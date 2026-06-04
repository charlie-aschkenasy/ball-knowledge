import { useEffect, useState } from 'react';
import { TIMER_SECONDS } from '../config';
import type { MultipleChoiceQuestion, Question } from '../db/types';
import type { Answer } from '../lib/scoring';

interface QuizProps {
  questions: Question[];
  onComplete: (answers: Answer[]) => void;
}

/** Short pause so the player sees correct/wrong feedback before advancing. */
const FEEDBACK_MS = 1000;

export default function Quiz({ questions, onComplete }: QuizProps) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);

  // Phase 2: pre-rewrite Quiz only supports multiple_choice. Phase 8 rewrites
  // this screen for format dispatch.
  const question = questions[index] as MultipleChoiceQuestion;
  const isLast = index === questions.length - 1;

  // Advance to the next question (or finish), recording the given answer.
  function commitAndAdvance(selected: number | null) {
    const answer: Answer = { questionId: question.id, selectedIndex: selected };
    const nextAnswers = [...answers, answer];

    window.setTimeout(() => {
      if (isLast) {
        onComplete(nextAnswers);
      } else {
        setAnswers(nextAnswers);
        setIndex((i) => i + 1);
        setSelectedIndex(null);
        setLocked(false);
        setSecondsLeft(TIMER_SECONDS);
      }
    }, FEEDBACK_MS);
  }

  function handleSelect(optionIndex: number) {
    if (locked) return;
    setLocked(true);
    setSelectedIndex(optionIndex);
    commitAndAdvance(optionIndex);
  }

  // Countdown timer. When it hits zero, lock with no answer and advance.
  useEffect(() => {
    if (locked) return;
    if (secondsLeft <= 0) {
      setLocked(true);
      commitAndAdvance(null);
      return;
    }
    const id = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, locked]);

  const timedOut = locked && selectedIndex === null;
  const timerPct = Math.max(0, (secondsLeft / TIMER_SECONDS) * 100);
  const timerLow = secondsLeft <= 5;

  function optionClass(optionIndex: number): string {
    if (!locked) return 'option';
    if (optionIndex === question.correctIndex) return 'option correct';
    if (optionIndex === selectedIndex) return 'option wrong';
    return 'option dimmed';
  }

  return (
    <div className="screen quiz">
      <div className="quiz-top">
        <span className="quiz-progress">
          Question {index + 1} / {questions.length}
        </span>
        <span className={`quiz-timer ${timerLow ? 'low' : ''}`}>{secondsLeft}s</span>
      </div>

      <div className="timer-bar">
        <div className={`timer-fill ${timerLow ? 'low' : ''}`} style={{ width: `${timerPct}%` }} />
      </div>

      <div className="quiz-tags">
        <span className={`tag tag-${question.difficulty}`}>{question.difficulty}</span>
        <span className="tag tag-sport">{question.sport}</span>
      </div>

      <h2 className="question-text">{question.text}</h2>

      <div className="options">
        {question.options.map((option: string, optionIndex: number) => (
          <button
            key={optionIndex}
            className={optionClass(optionIndex)}
            onClick={() => handleSelect(optionIndex)}
            disabled={locked}
          >
            {option}
          </button>
        ))}
      </div>

      {timedOut && <p className="feedback feedback-timeout">Time's up! No answer recorded.</p>}
    </div>
  );
}
