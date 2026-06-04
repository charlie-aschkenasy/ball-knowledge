// ===========================================================================
// Season + day-roll orchestration.
//
// rollDay() is the ONE function that mutates currentDay. advanceDays(n) loops
// it n times. This is the "one rollDay per elapsed day" invariant.
// See PLAN.md "Game time, drop windows, daily lock".
// ===========================================================================

import {
  SEASONAL_MISS_PENALTY,
  SEASONAL_SCORE_FLOOR,
  SEASON_LENGTH_DAYS,
} from '../config';
import type { DB, Question } from '../db/types';
import { simulateBotsForDay } from './bots';
import { bumpDay } from './time';

interface RollOptions {
  /**
   * Skip the absence penalty for the human during backfill. Bots are still
   * penalized normally so the backfilled world reflects "some bots miss days".
   */
  skipHumanPenalty?: boolean;
}

/**
 * Penalize every player who didn't play `missedDay`. Players who have NEVER
 * played (lastPlayedDay === null) are exempt — that handles new humans and
 * bots who failed reliability before they ever got a turn.
 */
function applyAbsencePenalty(db: DB, missedDay: number, opts: RollOptions): DB {
  return {
    ...db,
    stats: db.stats.map((s) => {
      // Never-played players don't pay a miss penalty (no chance yet).
      if (s.lastPlayedDay === null) return s;
      // Played the day in question — no penalty.
      if (s.lastPlayedDay === missedDay) return s;
      if (opts.skipHumanPenalty && s.playerId === db.humanPlayerId) return s;
      const next = Math.max(
        SEASONAL_SCORE_FLOOR,
        s.seasonalScore - SEASONAL_MISS_PENALTY,
      );
      return { ...s, seasonalScore: next };
    }),
  };
}

/**
 * Zero out seasonal totals. Lifetime totals are untouched. Increments the
 * season number and resets the season window.
 */
export function rollSeason(db: DB): DB {
  const newStart = db.time.currentDay;
  return {
    ...db,
    season: {
      number: db.season.number + 1,
      startDay: newStart,
      endDay: newStart + SEASON_LENGTH_DAYS,
    },
    stats: db.stats.map((s) => ({
      ...s,
      seasonalScore: 0,
      perSportSeasonalPoints: {},
    })),
  };
}

/**
 * One game-day transition. The order matters:
 *   1. Simulate bots for the CURRENT day (so they get a chance before being
 *      called absent).
 *   2. Apply the absence penalty for the CURRENT day.
 *   3. Bump time to next day (resets window to morning).
 *   4. If the new day crosses the season end, roll the season.
 *
 * Returns a new DB. Caller saves.
 */
export function rollDay(
  db: DB,
  allQuestions: Question[],
  opts: RollOptions = {},
): DB {
  const currentDay = db.time.currentDay;

  // 1. Bots play today (if they pass reliability)
  let next = simulateBotsForDay(db, allQuestions);

  // 2. Penalize everyone who didn't play today
  next = applyAbsencePenalty(next, currentDay, opts);

  // 3. Advance time to the next day
  next = { ...next, time: bumpDay(next.time) };

  // 4. Season boundary?
  if (next.time.currentDay >= next.season.endDay) {
    next = rollSeason(next);
  }

  return next;
}

/**
 * Convenience: roll rollDay() exactly `n` times. NEVER jumps currentDay; the
 * only path that mutates time. Used by the Dev panel and by the seed backfill.
 */
export function advanceDays(
  db: DB,
  n: number,
  allQuestions: Question[],
  opts: RollOptions = {},
): DB {
  let next = db;
  for (let i = 0; i < n; i++) {
    next = rollDay(next, allQuestions, opts);
  }
  return next;
}
