// ===========================================================================
// Quiz screen (rebuilt). Owns the per-question timer + flow; format-specific
// rendering is dispatched to formats/*.
//
// Flow:
//   reveal  → DropReveal (1.5s)
//   asking  → format-owned input, per-format timer counts down
//   resolved → correct/wrong feedback for FEEDBACK_MS, then advance
//   done    → callback with all answers
// ===========================================================================

import { useEffect, useState } from 'react';
import { TIMER_SECONDS_BY_FORMAT } from '../config';
import DropReveal from '../components/DropReveal';
import TimerRing from '../components/TimerRing';
import { DifficultyTag, SportTag } from '../components/Tag';
import type { AnswerValue, Question } from '../db/types';
import { gradeAnswer } from '../domain/grading';
import { MultipleChoice } from '../formats/multipleChoice';
import { FillInBlank } from '../formats/fillInBlank';
import { Matching } from '../formats/matching';

export interface QuizAnswer {
  questionId: string;
  value: AnswerValue | null; // null = timed out with no input
  wasCorrect: boolean;
}

interface Props {
  questions: Question[];
  onComplete: (answers: QuizAnswer[]) => void;
}

/** Visible feedback duration after a question resolves (correct / wrong). */
const FEEDBACK_MS = 1100;

type Phase = 'reveal' | 'asking' | 'resolved';

export default function Quiz({ questions, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('reveal');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [committed, setCommitted] = useState<AnswerValue | null>(null);
  const [resolved, setResolved] = useState<boolean | null>(null);

  const question = questions[index];
  const totalSeconds = TIMER_SECONDS_BY_FORMAT[question.type];
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const isLast = index === questions.length - 1;

  // ---- Phase: timer countdown while asking ----
  useEffect(() => {
    if (phase !== 'asking') return;
    if (secondsLeft <= 0) {
      // Time's up. Treat as null commit (no answer).
      lockAndResolve(null);
      return;
    }
    const id = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, secondsLeft]);

  // ---- Phase: advance after resolved ----
  useEffect(() => {
    if (phase !== 'resolved') return;
    const id = window.setTimeout(() => advance(), FEEDBACK_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function lockAndResolve(value: AnswerValue | null) {
    const wasCorrect = gradeAnswer(question, value);
    setCommitted(value);
    setResolved(wasCorrect);
    setPhase('resolved');
    setAnswers((prev) => [
      ...prev,
      { questionId: question.id, value, wasCorrect },
    ]);
  }

  function advance() {
    if (isLast) {
      onComplete(answers);
      return;
    }
    setIndex((i) => i + 1);
    setCommitted(null);
    setResolved(null);
    const next = questions[index + 1];
    setSecondsLeft(TIMER_SECONDS_BY_FORMAT[next.type]);
    setPhase('asking');
  }

  if (phase === 'reveal') {
    return (
      <div className="screen quiz">
        <DropReveal onDone={() => setPhase('asking')} />
      </div>
    );
  }

  const locked = phase === 'resolved';

  return (
    <div className="screen quiz">
      <header className="quiz-head">
        <span className="quiz-progress">
          Q{index + 1} of {questions.length}
        </span>
        <TimerRing secondsLeft={secondsLeft} totalSeconds={totalSeconds} />
      </header>

      <div className="quiz-tags">
        <DifficultyTag difficulty={question.difficulty} />
        <SportTag sport={question.sport} />
        <span className="tag tag-sport">{labelForType(question.type)}</span>
      </div>

      <div className="quiz-question-wrap fade-up" key={question.id}>
        <h2 className="quiz-question">{question.text}</h2>
      </div>

      <FormatBody
        question={question}
        locked={locked}
        committed={committed}
        onCommit={lockAndResolve}
      />

      {locked && resolved === false && (
        <p className="feedback feedback-timeout">
          {committed ? 'Not quite.' : '⏱ Time’s up — no answer recorded.'}
        </p>
      )}
    </div>
  );
}

function labelForType(t: Question['type']): string {
  switch (t) {
    case 'multiple_choice':
      return 'Pick one';
    case 'fill_in_blank':
      return 'Type it';
    case 'matching':
      return 'Match all';
  }
}

interface FormatBodyProps {
  question: Question;
  locked: boolean;
  committed: AnswerValue | null;
  onCommit: (value: AnswerValue) => void;
}

function FormatBody({ question, locked, committed, onCommit }: FormatBodyProps) {
  switch (question.type) {
    case 'multiple_choice':
      return (
        <MultipleChoice
          question={question}
          locked={locked}
          selectedIndex={
            committed && committed.kind === 'mc' ? committed.selectedIndex : null
          }
          onCommit={onCommit}
        />
      );
    case 'fill_in_blank':
      return (
        <FillInBlank
          question={question}
          locked={locked}
          committedText={committed && committed.kind === 'fib' ? committed.text : null}
          onCommit={onCommit}
        />
      );
    case 'matching':
      return (
        <Matching
          question={question}
          locked={locked}
          committedMapping={
            committed && committed.kind === 'match' ? committed.mapping : null
          }
          onCommit={onCommit}
        />
      );
  }
}
