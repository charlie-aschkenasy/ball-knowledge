// ===========================================================================
// All tunable constants in one place. Edit here to retune game feel.
// Each constant is documented and referenced by exactly one module.
// ===========================================================================

import type { Difficulty, QuestionType } from './db/types';

// ----------------- Daily quiz shape -----------------

/** Number of questions in a single daily quiz. */
export const QUIZ_SIZE = 5;

/** Difficulty mix for each daily quiz. Counts should sum to QUIZ_SIZE. */
export const DIFFICULTY_RECIPE: Record<Difficulty, number> = {
  easy: 2,
  medium: 2,
  hard: 1,
};

// ----------------- Scoring -----------------

/** Flat points per correct answer. Wrong / timeout = 0. */
export const POINTS_PER_QUESTION = 10;

// ----------------- Timers (per-format) -----------------

/**
 * Per-format countdown in seconds. Multiple choice stays snappy; fill-in-blank
 * and matching get the room they need for typing/linking.
 */
export const TIMER_SECONDS_BY_FORMAT: Record<QuestionType, number> = {
  multiple_choice: 15,
  fill_in_blank: 22,
  matching: 28,
};

/** Legacy alias retained for the pre-rewrite Quiz screen (phase 8 removes it). */
export const TIMER_SECONDS = TIMER_SECONDS_BY_FORMAT.multiple_choice;

// ----------------- Drop windows -----------------

/** Local hour (0–23) when the morning drop opens. */
export const MORNING_DROP_HOUR = 10;
/** Local hour (0–23) when the evening drop opens (second chance). */
export const EVENING_DROP_HOUR = 22;

// ----------------- Difficulty engine -----------------

/** Minimum number of answers before effectiveDifficulty switches to live data. */
export const MIN_SAMPLE = 20;
/** Accuracy ≥ this rebuckets to 'easy'. */
export const EASY_THRESHOLD = 0.7;
/** Accuracy ≥ this rebuckets to 'medium'; below → 'hard'. */
export const HARD_THRESHOLD = 0.35;

// ----------------- Selection (recently-seen + sport bias) -----------------

/** Size of the per-player ring buffer of recently-seen question IDs. */
export const RECENT_BUFFER = 30;
/** Probability a slot is restricted to the player's preferredSports. */
export const SPORT_BIAS_PCT = 0.7;

// ----------------- Seasonal -----------------

/** Points subtracted from seasonalScore for each missed day. */
export const SEASONAL_MISS_PENALTY = 8;
/** seasonalScore is clamped to never drop below this value. */
export const SEASONAL_SCORE_FLOOR = 0;
/** Length of a season in days. */
export const SEASON_LENGTH_DAYS = 30;

// ----------------- Bots -----------------

/** Number of bots seeded into the world. */
export const BOT_COUNT = 40;
/** Symmetric noise band on bot pCorrect computation, in absolute points. */
export const BOT_NOISE = 0.1;
/**
 * Days of bot-only simulation that run inside buildSeedDB before currentDay=1.
 * Populates leaderboards / titles / question stats so the world feels alive
 * on first open. Human stays at 0 through backfill.
 */
export const BACKFILL_DAYS = 12;

// ----------------- Storage -----------------

/** localStorage key for the single DB blob. */
export const DB_STORAGE_KEY = 'ball-knowledge:db';

/** Bump when schema changes incompatibly. */
export const DB_SCHEMA_VERSION = 1 as const;

/** AnswerEvent retention — only the most recent N days are kept. */
export const ANSWER_EVENT_RETENTION_DAYS = 30;
