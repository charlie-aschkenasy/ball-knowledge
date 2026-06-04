import type { Difficulty } from './data/questions';

// ---------------------------------------------------------------------------
// Key tunable constants. Tweak these to change game feel.
// ---------------------------------------------------------------------------

/** Points awarded per correct answer. Wrong / timed-out answers award nothing. */
export const POINTS_PER_QUESTION = 10;

/** Per-question countdown length, in seconds. */
export const TIMER_SECONDS = 15;

/** Number of questions in a single daily quiz. */
export const QUIZ_SIZE = 5;

/**
 * Difficulty recipe for each daily quiz.
 * The counts here should add up to QUIZ_SIZE.
 */
export const DIFFICULTY_RECIPE: Record<Difficulty, number> = {
  easy: 2,
  medium: 2,
  hard: 1,
};
