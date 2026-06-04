// ===========================================================================
// Bot simulation. Each game day, each bot rolls a reliability gate and (if it
// plays) gets the same selectDailyQuiz treatment as the human, then answers
// each question with a probability derived from its skill + the question's
// HIDDEN intrinsic difficulty + small noise.
//
// !! Critical: pCorrect uses `q.intrinsic`, NOT `effectiveDifficulty(q)`.
// That independence is what lets the difficulty engine measure a real signal
// instead of confirming its own labels. See PLAN.md "Bot simulation".
// ===========================================================================

import { BOT_NOISE } from '../config';
import { getBots, getStats } from '../db/repo';
import type { DB, PlayerProfile, Question } from '../db/types';
import { applyQuizResult, type QuizAnswerInput } from './scoring';
import { selectDailyQuiz } from './selection';

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

/**
 * Returns true if the bot will play today (passes its reliability gate).
 * Reliability defaults to 0.9 if missing — generous so the world still moves.
 */
function rollReliability(bot: PlayerProfile): boolean {
  const r = bot.reliability ?? 0.9;
  return Math.random() < r;
}

/**
 * Computes the probability this bot answers a given question correctly.
 *
 * Centered on skill = 0.70, so a baseline-competent bot reproduces the
 * authored expectation (intrinsic). Stronger bots lift; weaker bots subtract.
 */
function pCorrectForBot(bot: PlayerProfile, q: Question): number {
  const skill = bot.sportSkills?.[q.sport] ?? 0.4;
  const noise = (Math.random() - 0.5) * BOT_NOISE;
  return clamp01(q.intrinsic + (skill - 0.7) + noise);
}

/** Builds a bot's set of answers for a quiz, sampling each one independently. */
function simulateBotAnswers(bot: PlayerProfile, quiz: Question[]): QuizAnswerInput[] {
  return quiz.map((q) => ({
    questionId: q.id,
    value: null, // bots don't need a real answer value — wasCorrect is what counts
    wasCorrect: Math.random() < pCorrectForBot(bot, q),
  }));
}

/**
 * Simulates a full day of bot play. For each bot that passes its reliability
 * gate, builds a per-bot quiz via the same selection logic the human uses,
 * generates probabilistic answers, then folds the result into the DB via
 * applyQuizResult.
 *
 * Bots that fail their reliability gate simply don't play; they'll get hit
 * with the seasonal-miss penalty by rollDay (phase 11).
 */
export function simulateBotsForDay(db: DB, allQuestions: Question[]): DB {
  let next = db;
  const bots = getBots(next);

  for (const bot of bots) {
    if (!rollReliability(bot)) continue;
    const stats = getStats(next, bot.id);
    const quiz = selectDailyQuiz(
      bot,
      stats.recentlySeenQuestionIds,
      allQuestions,
      next,
    );
    const answers = simulateBotAnswers(bot, quiz);
    next = applyQuizResult(next, bot.id, answers, quiz).db;
  }

  return next;
}
