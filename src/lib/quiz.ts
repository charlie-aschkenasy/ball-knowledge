// ---------------------------------------------------------------------------
// Daily quiz assembly.
//
// Builds a quiz from the question bank following the difficulty recipe
// (e.g. 2 easy, 2 medium, 1 hard). If the bank ever runs short of a given
// difficulty, we fall back to whatever is available so the app never breaks.
// ---------------------------------------------------------------------------

import { DIFFICULTY_RECIPE } from '../config';
import { QUESTIONS } from '../data/questions';
import type { Difficulty, Question } from '../data/questions';

// Phase 2/7: pre-rewrite Quiz screen only renders multiple_choice. Filter
// here so the legacy build never picks a FIB / matching question. Phase 8
// removes this whole file in favor of domain/selection.
const MC_QUESTIONS = QUESTIONS.filter((q) => q.type === 'multiple_choice');

/** Fisher-Yates shuffle returning a new array. */
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Builds today's quiz: draws the recipe counts from each difficulty, then
 * shuffles the final order so difficulties are interleaved.
 */
export function buildDailyQuiz(): Question[] {
  const selected: Question[] = [];
  const used = new Set<string>();

  (Object.keys(DIFFICULTY_RECIPE) as Difficulty[]).forEach((difficulty) => {
    const count = DIFFICULTY_RECIPE[difficulty];
    const pool = shuffle(MC_QUESTIONS.filter((q) => q.difficulty === difficulty));
    for (const question of pool.slice(0, count)) {
      selected.push(question);
      used.add(question.id);
    }
  });

  // Fallback: if a difficulty was short, top up from any unused questions.
  const totalWanted = Object.values(DIFFICULTY_RECIPE).reduce((a, b) => a + b, 0);
  if (selected.length < totalWanted) {
    const extras = shuffle(MC_QUESTIONS.filter((q) => !used.has(q.id)));
    for (const question of extras) {
      if (selected.length >= totalWanted) break;
      selected.push(question);
      used.add(question.id);
    }
  }

  return shuffle(selected);
}
