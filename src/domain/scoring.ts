// ===========================================================================
// Scoring — applies a completed quiz to a player's stats AND records the
// answer events that feed the difficulty engine.
//
// Pure: returns a new DB. Caller (store / App) saves.
// ===========================================================================

import { POINTS_PER_QUESTION, RECENT_BUFFER } from '../config';
import { recordAnswerEvent, updateStats } from '../db/repo';
import type {
  AnswerEvent,
  AnswerValue,
  DB,
  PlayerStats,
  Question,
} from '../db/types';

export interface QuizAnswerInput {
  questionId: string;
  value: AnswerValue | null;
  wasCorrect: boolean;
}

export interface QuizApplyResult {
  db: DB;
  pointsEarned: number;
  correctCount: number;
  total: number;
}

/**
 * Records answer events, awards points, updates streak + per-sport totals,
 * and trims the recently-seen ring buffer.
 */
export function applyQuizResult(
  db: DB,
  playerId: string,
  answers: QuizAnswerInput[],
  questions: Question[],
): QuizApplyResult {
  const questionsById = new Map(questions.map((q) => [q.id, q]));
  let next = db;
  const day = db.time.currentDay;

  // 1. Record answer events (bumps question stats + prunes old events).
  for (const a of answers) {
    const event: AnswerEvent = {
      playerId,
      questionId: a.questionId,
      day,
      wasCorrect: a.wasCorrect,
    };
    next = recordAnswerEvent(next, event);
  }

  // 2. Roll up correctness and points.
  const correctCount = answers.filter((a) => a.wasCorrect).length;
  const pointsEarned = correctCount * POINTS_PER_QUESTION;
  const total = answers.length;

  // 3. Update the player's stats in one shot.
  next = updateStats(next, playerId, (s) => {
    const perSportLifetime = { ...s.perSportLifetimePoints };
    const perSportSeasonal = { ...s.perSportSeasonalPoints };

    for (const a of answers) {
      if (!a.wasCorrect) continue;
      const q = questionsById.get(a.questionId);
      if (!q) continue;
      perSportLifetime[q.sport] = (perSportLifetime[q.sport] ?? 0) + POINTS_PER_QUESTION;
      perSportSeasonal[q.sport] = (perSportSeasonal[q.sport] ?? 0) + POINTS_PER_QUESTION;
    }

    const continuedStreak = s.lastPlayedDay === day - 1;
    const nextStreak = continuedStreak ? s.streak + 1 : 1;
    const nextLongest = Math.max(s.longestStreak, nextStreak);

    const updatedRecent = pushRecentlySeen(
      s.recentlySeenQuestionIds,
      answers.map((a) => a.questionId),
    );

    return {
      ...s,
      lifetimePoints: s.lifetimePoints + pointsEarned,
      seasonalScore: s.seasonalScore + pointsEarned,
      perSportLifetimePoints: perSportLifetime,
      perSportSeasonalPoints: perSportSeasonal,
      streak: nextStreak,
      longestStreak: nextLongest,
      lastPlayedDay: day,
      recentlySeenQuestionIds: updatedRecent,
    } satisfies PlayerStats;
  });

  return { db: next, pointsEarned, correctCount, total };
}

/**
 * Prepend new IDs to the recently-seen buffer, drop duplicates so the same
 * question doesn't take up multiple slots, then cap at RECENT_BUFFER.
 */
function pushRecentlySeen(current: string[], adding: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  // Walk most-recent-first: new ones, then old ones, deduped.
  for (const id of [...adding, ...current]) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= RECENT_BUFFER) break;
  }
  return out;
}
