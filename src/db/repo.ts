// ===========================================================================
// Repository: pure read/write helpers over the DB blob.
//
// All functions are pure: they take a DB (and args) and return either a query
// result OR a NEW DB. They do not touch localStorage. Persistence is owned by
// the store (`db/store.ts`), which calls these and then saves.
//
// This keeps the logic testable in isolation and the boundary between data
// and side effects crisp.
// ===========================================================================

import { ANSWER_EVENT_RETENTION_DAYS } from '../config';
import type {
  AnswerEvent,
  DB,
  Group,
  PlayerProfile,
  PlayerStats,
  QuestionStat,
  SeasonState,
  Sport,
} from './types';

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------

export function getPlayer(db: DB, id: string): PlayerProfile | undefined {
  return db.players.find((p) => p.id === id);
}

export function getHuman(db: DB): PlayerProfile {
  const p = getPlayer(db, db.humanPlayerId);
  if (!p) throw new Error(`[repo] humanPlayerId ${db.humanPlayerId} not found`);
  return p;
}

export function getBots(db: DB): PlayerProfile[] {
  return db.players.filter((p) => !p.isHuman);
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export function getStats(db: DB, playerId: string): PlayerStats {
  const s = db.stats.find((s) => s.playerId === playerId);
  if (!s) throw new Error(`[repo] stats for ${playerId} not found`);
  return s;
}

export function getHumanStats(db: DB): PlayerStats {
  return getStats(db, db.humanPlayerId);
}

/**
 * Returns a new DB with the given player's stats updated.
 * `updater` receives the current stats and returns the next.
 */
export function updateStats(
  db: DB,
  playerId: string,
  updater: (s: PlayerStats) => PlayerStats,
): DB {
  return {
    ...db,
    stats: db.stats.map((s) => (s.playerId === playerId ? updater(s) : s)),
  };
}

// ---------------------------------------------------------------------------
// Question stats + answer events
// ---------------------------------------------------------------------------

export function getQuestionStat(db: DB, questionId: string): QuestionStat {
  const q = db.questionStats.find((q) => q.questionId === questionId);
  // If we encounter a question not yet in the stats table (e.g. a newly added
  // question after a seed), surface a zeroed row so callers don't have to
  // pepper null checks. The stat will be created on first recordAnswerEvent.
  return q ?? { questionId, timesShown: 0, timesCorrect: 0 };
}

/**
 * Records a single answer event: appends to `answers`, bumps the question's
 * timesShown / timesCorrect, and prunes stale events past the retention
 * window. Returns a new DB.
 */
export function recordAnswerEvent(db: DB, event: AnswerEvent): DB {
  const existing = db.questionStats.find((q) => q.questionId === event.questionId);
  const nextStats: QuestionStat[] = existing
    ? db.questionStats.map((q) =>
        q.questionId === event.questionId
          ? {
              ...q,
              timesShown: q.timesShown + 1,
              timesCorrect: q.timesCorrect + (event.wasCorrect ? 1 : 0),
            }
          : q,
      )
    : [
        ...db.questionStats,
        {
          questionId: event.questionId,
          timesShown: 1,
          timesCorrect: event.wasCorrect ? 1 : 0,
        },
      ];

  const cutoffDay = db.time.currentDay - ANSWER_EVENT_RETENTION_DAYS;
  const nextAnswers = [...db.answers, event].filter((a) => a.day >= cutoffDay);

  return { ...db, questionStats: nextStats, answers: nextAnswers };
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

export function getGroups(db: DB): Group[] {
  return db.groups;
}

export function getGroup(db: DB, id: string): Group | undefined {
  return db.groups.find((g) => g.id === id);
}

export function getSquads(db: DB): Group[] {
  return db.groups.filter((g) => g.type === 'squad');
}

export function getArenas(db: DB): Group[] {
  return db.groups.filter((g) => g.type === 'arena');
}

export function getArenaForSport(db: DB, sport: Sport): Group | undefined {
  return db.groups.find((g) => g.type === 'arena' && g.sport === sport);
}

// ---------------------------------------------------------------------------
// Season + time
// ---------------------------------------------------------------------------

export function setSeason(db: DB, season: SeasonState): DB {
  return { ...db, season };
}

export function setTime(db: DB, time: DB['time']): DB {
  return { ...db, time };
}

// ---------------------------------------------------------------------------
// Bulk replace (for reseed + season-reset orchestration)
// ---------------------------------------------------------------------------

export function replaceStats(db: DB, stats: PlayerStats[]): DB {
  return { ...db, stats };
}
