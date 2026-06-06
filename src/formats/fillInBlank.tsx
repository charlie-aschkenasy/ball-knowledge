// ===========================================================================
// Fill-in-blank format. Free text input with normalization tolerance.
// ===========================================================================

import { useState } from 'react';
import type { AnswerValue, FillInBlankQuestion } from '../db/types';

interface Props {
  question: FillInBlankQuestion;
  locked: boolean;
  committedText: string | null;
  onCommit: (value: AnswerValue) => void;
}

/**
 * Normalize an answer for comparison. Forgiving but not lax:
 *  - lowercase
 *  - trim and collapse whitespace
 *  - strip punctuation (keep letters / digits)
 *  - strip a leading article ("the ", "a ", "an ")
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .replace(/[^\p{L}\p{N}\s]/gu, '') // keep letters + digits + spaces
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(the|a|an)\s+/, '');
}

export function FillInBlank({ question, locked, committedText, onCommit }: Props) {
  const [text, setText] = useState('');

  function submit() {
    if (locked) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    onCommit({ kind: 'fib', text: trimmed });
  }

  const isCorrect =
    locked &&
    committedText !== null &&
    gradeFillInBlank(question, { kind: 'fib', text: committedText });

  const resolveClass = !locked
    ? 'fib-input'
    : isCorrect
      ? 'fib-input correct'
      : 'fib-input wrong';

  return (
    <div className="quiz-options">
      <input
        type="text"
        className={resolveClass}
        placeholder={locked ? '' : 'Type your answer'}
        value={locked ? (committedText ?? '') : text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
        disabled={locked}
        autoFocus
        autoComplete="off"
        spellCheck={false}
        inputMode="text"
      />
      {!locked && (
        <button className="btn btn-primary" onClick={submit} disabled={!text.trim()}>
          Lock it in
        </button>
      )}
      {locked && isCorrect && (
        <p className="fib-hint" style={{ color: 'var(--correct)' }}>
          ✓ Locked in
        </p>
      )}
      {locked && !isCorrect && (
        <p className="fib-hint">
          Accepted: <strong>{question.acceptableAnswers[0]}</strong>
        </p>
      )}
    </div>
  );
}

export function gradeFillInBlank(
  question: FillInBlankQuestion,
  value: AnswerValue,
): boolean {
  if (value.kind !== 'fib' || !value.text) return false;
  const norm = normalize(value.text);
  if (!norm) return false;
  return question.acceptableAnswers.some((a) => normalize(a) === norm);
}
