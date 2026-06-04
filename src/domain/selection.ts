// ===========================================================================
// Daily quiz selection — the single chokepoint for fairness.
//
// `selectDailyQuiz(profile, db, allQuestions)` returns a 5-question quiz that:
//   1. Buckets by EFFECTIVE difficulty (live-calibrated, not just seed)
//   2. Excludes recently-seen for that player (last RECENT_BUFFER)
//   3. Biases each slot toward the player's preferredSports with probability
//      SPORT_BIAS_PCT (the rest of the time, any sport)
//   4. Falls back gracefully when a bucket is empty after exclusions
//
// Why fairness lives here: the "hard problem" the brief called out is that
// different players see different questions. As long as effective-difficulty
// buckets are calibrated and each player gets the same RECIPE (2 easy / 2 med /
// 1 hard), expected scores are matched even when individual questions differ.
// See PLAN.md "Daily quiz selection (and fairness)" for limits.
// ===========================================================================

import {
  DIFFICULTY_RECIPE,
  QUIZ_SIZE,
  RECENT_BUFFER,
  SPORT_BIAS_PCT,
} from '../config';
import type {
  DB,
  Difficulty,
  PlayerProfile,
  Question,
  Sport,
} from '../db/types';
import { buildEffectiveDifficultyMap } from './difficulty';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pickRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

interface SelectionContext {
  preferredSports: Set<Sport>;
  recentlySeen: Set<string>;
  effective: Map<string, Difficulty>;
  bucketsBySeed: Map<Difficulty, Question[]>;
}

function buildContext(
  profile: PlayerProfile,
  recentlySeenIds: string[],
  allQuestions: Question[],
  effective: Map<string, Difficulty>,
): SelectionContext {
  // Cap recently-seen check to the configured buffer length (older entries
  // shouldn't influence selection even if the buffer wasn't pruned).
  const recentlySeen = new Set(recentlySeenIds.slice(0, RECENT_BUFFER));
  const bucketsBySeed = new Map<Difficulty, Question[]>([
    ['easy', []],
    ['medium', []],
    ['hard', []],
  ]);
  for (const q of allQuestions) {
    const bucket = effective.get(q.id) ?? q.difficulty;
    bucketsBySeed.get(bucket)?.push(q);
  }
  return {
    preferredSports: new Set(profile.preferredSports),
    recentlySeen,
    effective,
    bucketsBySeed,
  };
}

function poolForSlot(
  ctx: SelectionContext,
  bucket: Difficulty,
  usedIds: Set<string>,
  preferredOnly: boolean,
): Question[] {
  const all = ctx.bucketsBySeed.get(bucket) ?? [];
  return all.filter((q) => {
    if (usedIds.has(q.id)) return false;
    if (ctx.recentlySeen.has(q.id)) return false;
    if (preferredOnly && !ctx.preferredSports.has(q.sport)) return false;
    return true;
  });
}

/**
 * Pick one question for a given effective-difficulty bucket using sport bias,
 * with graceful fallbacks if the bucket is too sparse.
 *
 * Fallback ladder (highest fidelity first):
 *   1. Preferred sports + bucket + not-recently-seen
 *   2. Any sport + bucket + not-recently-seen
 *   3. Any sport + bucket (allow recently-seen)
 *   4. Any sport + any bucket + not-already-used (last resort)
 */
function pickForSlot(
  ctx: SelectionContext,
  bucket: Difficulty,
  usedIds: Set<string>,
): Question | undefined {
  const preferLane = Math.random() < SPORT_BIAS_PCT;

  if (preferLane) {
    const preferred = poolForSlot(ctx, bucket, usedIds, true);
    if (preferred.length > 0) return pickRandom(preferred);
  }
  const any = poolForSlot(ctx, bucket, usedIds, false);
  if (any.length > 0) return pickRandom(any);

  // Drop the recently-seen filter for this bucket if pool is empty.
  const anyWithRecent = (ctx.bucketsBySeed.get(bucket) ?? []).filter(
    (q) => !usedIds.has(q.id),
  );
  if (anyWithRecent.length > 0) return pickRandom(anyWithRecent);

  // Final fallback: take ANY unused question regardless of bucket.
  const everything: Question[] = [];
  for (const list of ctx.bucketsBySeed.values()) {
    for (const q of list) {
      if (!usedIds.has(q.id)) everything.push(q);
    }
  }
  return pickRandom(everything);
}

// ---------------------------------------------------------------------------
// Public entry
// ---------------------------------------------------------------------------

/**
 * Builds the daily quiz for the given player. Pure — does not mutate the DB
 * or the player's recently-seen buffer (that update happens in scoring).
 *
 * `allQuestions` is passed in (rather than read from a module-level import)
 * so this function is trivially testable and can be re-used with arbitrary
 * question sets.
 */
export function selectDailyQuiz(
  profile: PlayerProfile,
  recentlySeenIds: string[],
  allQuestions: Question[],
  db: Pick<DB, 'questionStats'>,
): Question[] {
  const effective = buildEffectiveDifficultyMap(allQuestions, db.questionStats);
  const ctx = buildContext(profile, recentlySeenIds, allQuestions, effective);

  const selected: Question[] = [];
  const usedIds = new Set<string>();

  // Walk the recipe in difficulty order (deterministic for cleaner pools),
  // then shuffle the final 5 so order varies.
  const order: Difficulty[] = ['hard', 'medium', 'easy'];
  for (const bucket of order) {
    const count = DIFFICULTY_RECIPE[bucket];
    for (let i = 0; i < count; i++) {
      const picked = pickForSlot(ctx, bucket, usedIds);
      if (!picked) continue;
      selected.push(picked);
      usedIds.add(picked.id);
    }
  }

  // If recipe slots came up short (tiny bank case), top up to QUIZ_SIZE.
  if (selected.length < QUIZ_SIZE) {
    const remaining = allQuestions.filter((q) => !usedIds.has(q.id));
    const fillers = shuffle(remaining).slice(0, QUIZ_SIZE - selected.length);
    for (const q of fillers) {
      selected.push(q);
      usedIds.add(q.id);
    }
  }

  return shuffle(selected);
}
