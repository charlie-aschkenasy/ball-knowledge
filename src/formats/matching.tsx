// ===========================================================================
// Matching format. 4 left items ↔ 4 right items. Player taps a left then a
// right to link them; submits when all are paired. All-correct or wrong.
// ===========================================================================

import { useMemo, useState } from 'react';
import type { AnswerValue, MatchingQuestion } from '../db/types';

interface Props {
  question: MatchingQuestion;
  locked: boolean;
  committedMapping: Record<string, string> | null;
  onCommit: (value: AnswerValue) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function Matching({ question, locked, committedMapping, onCommit }: Props) {
  // Show the right column in a randomized order so it's not trivial.
  const rights = useMemo(
    () => shuffle(question.pairs.map((p) => p.right)),
    [question.id],
  );
  const lefts = question.pairs.map((p) => p.left);

  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const allPaired = lefts.every((l) => mapping[l]);

  function pickLeft(l: string) {
    if (locked) return;
    if (mapping[l]) {
      // Unpair
      const next = { ...mapping };
      delete next[l];
      setMapping(next);
      setSelectedLeft(l);
      return;
    }
    setSelectedLeft(l);
  }

  function pickRight(r: string) {
    if (locked || !selectedLeft) return;
    // If this right is already used elsewhere, free it first
    const next: Record<string, string> = {};
    for (const [l, val] of Object.entries(mapping)) {
      if (val !== r) next[l] = val;
    }
    next[selectedLeft] = r;
    setMapping(next);
    setSelectedLeft(null);
  }

  function submit() {
    if (!allPaired) return;
    onCommit({ kind: 'match', mapping });
  }

  const cellMapping = locked ? (committedMapping ?? {}) : mapping;

  function leftClass(l: string): string {
    if (locked) {
      const expected = question.pairs.find((p) => p.left === l)?.right;
      const got = cellMapping[l];
      if (got === expected) return 'match-cell left correct';
      return 'match-cell left wrong';
    }
    if (cellMapping[l]) return 'match-cell left paired';
    if (selectedLeft === l) return 'match-cell left selected';
    return 'match-cell left';
  }

  function rightClass(r: string): string {
    const linkedLeft = Object.entries(cellMapping).find(([, v]) => v === r)?.[0];
    if (locked) {
      if (!linkedLeft) return 'match-cell';
      const expected = question.pairs.find((p) => p.left === linkedLeft)?.right;
      return expected === r ? 'match-cell correct' : 'match-cell wrong';
    }
    if (linkedLeft) return 'match-cell paired';
    return 'match-cell';
  }

  return (
    <div className="quiz-options">
      <div className="match-grid">
        {lefts.map((l, i) => (
          <Row
            key={l}
            left={l}
            right={rights[i]}
            mapping={cellMapping}
            leftClass={leftClass(l)}
            rightClass={rightClass(rights[i])}
            onPickLeft={() => pickLeft(l)}
            onPickRight={() => pickRight(rights[i])}
            locked={locked}
          />
        ))}
      </div>
      {!locked && (
        <button className="btn btn-primary" onClick={submit} disabled={!allPaired}>
          {allPaired ? 'Lock it in' : 'Pair all four'}
        </button>
      )}
    </div>
  );
}

interface RowProps {
  left: string;
  right: string;
  mapping: Record<string, string>;
  leftClass: string;
  rightClass: string;
  onPickLeft: () => void;
  onPickRight: () => void;
  locked: boolean;
}

function Row({ left, right, leftClass, rightClass, onPickLeft, onPickRight, locked }: RowProps) {
  return (
    <>
      <button type="button" className={leftClass} onClick={onPickLeft} disabled={locked}>
        {left}
      </button>
      <span className="match-arrow">→</span>
      <button type="button" className={rightClass} onClick={onPickRight} disabled={locked}>
        {right}
      </button>
    </>
  );
}

export function gradeMatching(
  question: MatchingQuestion,
  value: AnswerValue,
): boolean {
  if (value.kind !== 'match' || !value.mapping) return false;
  return question.pairs.every((p) => value.mapping?.[p.left] === p.right);
}
