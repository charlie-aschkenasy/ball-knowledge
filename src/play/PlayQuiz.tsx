// ===========================================================================
// Quiz screen for the real flow. Renders server questions (which carry NO
// answer key) and collects the player's selections. Grading happens entirely
// server-side on submit, so there is no per-question correct/wrong reveal here
// — we just lock the pick and move on.
//
// Today every question is multiple_choice; the renderer falls back gracefully
// for any other/unknown type so a future format doesn't crash the screen.
// ===========================================================================

import { useEffect, useRef, useState } from 'react';
import DropReveal from '../components/DropReveal';
import TimerRing from '../components/TimerRing';
import type { ServerQuestion, SelectedAnswers, AnswerTimes } from '../lib/api';

interface Props {
  questions: ServerQuestion[];
  onComplete: (answers: SelectedAnswers, times: AnswerTimes) => void;
  submitting: boolean;
}

/** Per-format countdown (seconds). Unknown types get a sensible default. */
const TIMER_BY_TYPE: Record<string, number> = {
  multiple_choice: 15,
  fill_in_blank: 22,
  matching: 28,
};
const DEFAULT_TIMER = 20;

/** How long the locked-in pick stays visible before advancing. */
const FEEDBACK_MS = 650;

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

type Phase = 'reveal' | 'asking' | 'committed';

function timerFor(q: ServerQuestion): number {
  return TIMER_BY_TYPE[q.type] ?? DEFAULT_TIMER;
}

export default function PlayQuiz({ questions, onComplete, submitting }: Props) {
  const [phase, setPhase] = useState<Phase>('reveal');
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  const question = questions[index];
  const totalSeconds = timerFor(question);
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const isLast = index === questions.length - 1;

  // Accumulated answers + per-question time spent, keyed by question id.
  const answersRef = useRef<SelectedAnswers>({});
  const timesRef = useRef<AnswerTimes>({});
  // Monotonic timestamp (ms) when the current question entered the asking phase.
  const startedAtRef = useRef<number>(0);
  // Idempotency guard: a click landing exactly as the timer hits zero must not
  // commit twice. A ref mutates synchronously, unlike batched state.
  const lockedRef = useRef(false);

  // Stamp the per-question start whenever a question begins (first question
  // after the reveal, and each subsequent question after advancing).
  useEffect(() => {
    if (phase === 'asking') startedAtRef.current = performance.now();
  }, [index, phase]);

  // Countdown while asking.
  useEffect(() => {
    if (phase !== 'asking') return;
    if (secondsLeft <= 0) {
      commit(null);
      return;
    }
    const id = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, secondsLeft]);

  // Advance after the lock-in beat.
  useEffect(() => {
    if (phase !== 'committed') return;
    const id = window.setTimeout(advance, FEEDBACK_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function commit(value: number | null) {
    if (lockedRef.current) return;
    lockedRef.current = true;
    answersRef.current[question.id] = value;
    timesRef.current[question.id] = Math.max(
      0,
      Math.round(performance.now() - startedAtRef.current),
    );
    setPicked(value);
    setPhase('committed');
  }

  function advance() {
    if (isLast) {
      onComplete(answersRef.current, timesRef.current);
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setPicked(null);
    setSecondsLeft(timerFor(questions[nextIndex]));
    setPhase('asking');
    lockedRef.current = false;
  }

  if (phase === 'reveal') {
    return (
      <div className="screen quiz">
        <DropReveal onDone={() => setPhase('asking')} />
      </div>
    );
  }

  // The very last question, once committed, shows a "scoring…" state while the
  // submit request is in flight.
  const locked = phase === 'committed';

  return (
    <div className="screen quiz">
      <header className="quiz-head">
        <span className="quiz-progress">
          Q{index + 1} of {questions.length}
        </span>
        <TimerRing secondsLeft={secondsLeft} totalSeconds={totalSeconds} />
      </header>

      <div className="quiz-meta">
        <span className="tag tag-sport">{question.sport}</span>
        <span className="tag tag-sport">Difficulty {question.difficulty}/5</span>
      </div>

      <div className="quiz-question-wrap fade-up" key={question.id}>
        <h2 className="quiz-question">{question.prompt}</h2>
      </div>

      {question.options && question.options.length > 0 ? (
        <div className="quiz-options">
          {question.options.map((option, i) => {
            let cls = 'answer';
            if (locked) cls = i === picked ? 'answer picked' : 'answer dimmed';
            return (
              <button
                key={i}
                className={cls}
                disabled={locked}
                onClick={() => commit(i)}
              >
                <span className="answer-letter">{LETTERS[i] ?? String(i + 1)}</span>
                <span>{option}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="feedback feedback-timeout">
          Unsupported question format — skipping.
        </p>
      )}

      {locked && isLast && submitting && (
        <p className="feedback">Scoring your run…</p>
      )}
    </div>
  );
}
