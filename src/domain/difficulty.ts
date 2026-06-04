// ===========================================================================
// Difficulty engine.
//
// A question carries a SEED bucket (`difficulty`: easy/medium/hard) and a
// HIDDEN intrinsic scalar (`intrinsic`: 0..1). The engine here computes the
// EFFECTIVE bucket from live answer data once we have enough samples — that
// effective bucket is what the daily recipe uses.
//
// IMPORTANT: this engine reads ONLY `questionStats` (live data). It MUST NOT
// look at `intrinsic` — that scalar is bots' independent ground truth, kept
// separate on purpose so the engine measures something real instead of
// confirming its own labels. See PLAN.md "Difficulty engine".
// ===========================================================================

import { EASY_THRESHOLD, HARD_THRESHOLD, MIN_SAMPLE } from '../config';
import type { Difficulty, Question, QuestionStat } from '../db/types';

/** Live accuracy (timesCorrect / timesShown), or null with no samples. */
export function liveAccuracy(stat: QuestionStat): number | null {
  if (stat.timesShown === 0) return null;
  return stat.timesCorrect / stat.timesShown;
}

/**
 * The currently-effective difficulty bucket for a question:
 *  - below MIN_SAMPLE: the author-seeded bucket
 *  - at/above MIN_SAMPLE: a bucket derived from the live accuracy
 */
export function effectiveDifficulty(
  question: Question,
  stat: QuestionStat,
): Difficulty {
  if (stat.timesShown < MIN_SAMPLE) return question.difficulty;
  const acc = stat.timesCorrect / stat.timesShown;
  if (acc >= EASY_THRESHOLD) return 'easy';
  if (acc >= HARD_THRESHOLD) return 'medium';
  return 'hard';
}

/**
 * True when live data has rebucketed the question away from its seed.
 * Used by the dev debug table to highlight drifted rows.
 */
export function hasDrifted(question: Question, stat: QuestionStat): boolean {
  return (
    stat.timesShown >= MIN_SAMPLE &&
    effectiveDifficulty(question, stat) !== question.difficulty
  );
}

/**
 * Build an effective-difficulty lookup keyed by question id. Use this once
 * per selection pass (or per debug render) rather than re-computing on every
 * lookup.
 */
export function buildEffectiveDifficultyMap(
  questions: Question[],
  questionStats: QuestionStat[],
): Map<string, Difficulty> {
  const statById = new Map(questionStats.map((s) => [s.questionId, s]));
  const out = new Map<string, Difficulty>();
  for (const q of questions) {
    const stat = statById.get(q.id) ?? { questionId: q.id, timesShown: 0, timesCorrect: 0 };
    out.set(q.id, effectiveDifficulty(q, stat));
  }
  return out;
}
