// ===========================================================================
// Multiple choice format. Primary question type.
// ===========================================================================

import type { AnswerValue, MultipleChoiceQuestion } from '../db/types';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

interface Props {
  question: MultipleChoiceQuestion;
  locked: boolean;
  selectedIndex: number | null;
  onCommit: (value: AnswerValue) => void;
}

export function MultipleChoice({ question, locked, selectedIndex, onCommit }: Props) {
  function optionClass(i: number): string {
    if (!locked) return 'answer';
    if (i === question.correctIndex) return 'answer correct';
    if (i === selectedIndex) return 'answer wrong';
    return 'answer dimmed';
  }

  return (
    <div className="quiz-options">
      {question.options.map((option, i) => (
        <button
          key={i}
          className={optionClass(i)}
          disabled={locked}
          onClick={() => onCommit({ kind: 'mc', selectedIndex: i })}
        >
          <span className="answer-letter">{LETTERS[i] ?? String(i + 1)}</span>
          <span>{option}</span>
        </button>
      ))}
    </div>
  );
}

export function gradeMultipleChoice(
  question: MultipleChoiceQuestion,
  value: AnswerValue,
): boolean {
  if (value.kind !== 'mc') return false;
  return value.selectedIndex === question.correctIndex;
}
