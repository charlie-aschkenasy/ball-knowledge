// ===========================================================================
// "[Sport] guy" title computation.
//
// Titles are SEASONAL — read from perSportSeasonalPoints. That matches the
// "always leave a path back" principle: every season the race for "NBA guy"
// is fresh. A future archive view could be added from perSportLifetimePoints.
//
// computeTitleHolders(db, scope) returns a Map<Sport, playerId> identifying
// who holds each title within the given scope (world / group). Useful for:
//   - Decorating leaderboard rows with title pills
//   - Detecting "title taken" celebrations (compare before/after applyQuizResult)
// ===========================================================================

import { getGroup } from '../db/repo';
import type { DB, Sport } from '../db/types';

const TITLE_SPORTS: Sport[] = ['NBA', 'NFL', 'MLB', 'UFC', 'Soccer', 'general'];

export type TitleScope =
  | { kind: 'world' }
  | { kind: 'group'; groupId: string };

function memberIdsFor(db: DB, scope: TitleScope): string[] {
  if (scope.kind === 'world') return db.players.map((p) => p.id);
  return getGroup(db, scope.groupId)?.memberIds ?? [];
}

/**
 * Returns a Map<sport, holderId>. A sport is omitted from the map if no one
 * in scope has any seasonal points in that sport (no holder yet).
 */
export function computeTitleHolders(
  db: DB,
  scope: TitleScope,
): Map<Sport, string> {
  const ids = new Set(memberIdsFor(db, scope));
  const statsById = new Map(db.stats.map((s) => [s.playerId, s]));
  const out = new Map<Sport, string>();

  for (const sport of TITLE_SPORTS) {
    let bestId: string | null = null;
    let bestPts = 0;
    for (const id of ids) {
      const s = statsById.get(id);
      if (!s) continue;
      const pts = s.perSportSeasonalPoints[sport] ?? 0;
      if (pts > bestPts) {
        bestPts = pts;
        bestId = id;
      }
    }
    if (bestId) out.set(sport, bestId);
  }
  return out;
}

/**
 * Returns the list of sports for which `playerId` holds the title within
 * the scope. Used to decorate a leaderboard row with title pills.
 */
export function titlesHeldBy(
  holders: Map<Sport, string>,
  playerId: string,
): Sport[] {
  const out: Sport[] = [];
  for (const [sport, id] of holders.entries()) {
    if (id === playerId) out.push(sport);
  }
  return out;
}

/**
 * Compares two snapshots of title holders and returns the sports for which
 * `playerId` newly took the title. Used to fire the celebration banner on
 * the Results screen.
 */
export function newlyTakenTitles(
  before: Map<Sport, string>,
  after: Map<Sport, string>,
  playerId: string,
): Sport[] {
  const out: Sport[] = [];
  for (const [sport, holder] of after.entries()) {
    if (holder === playerId && before.get(sport) !== playerId) {
      out.push(sport);
    }
  }
  return out;
}
