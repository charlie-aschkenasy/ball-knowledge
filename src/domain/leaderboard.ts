// ===========================================================================
// Leaderboard aggregation.
//
// One function for all the variants: aggregateLeaderboard({ scope, view, db }).
// scope says WHO to rank (world / per-sport / per-group); view says by WHICH
// score (lifetime vs seasonal). Per-sport scopes use perSport[Lifetime|Seasonal]Points
// so the sport leaderboard ranks on within-sport achievement, not overall
// lifetime/season.
// ===========================================================================

import { getGroup } from '../db/repo';
import type { DB, PlayerProfile, PlayerStats, Sport } from '../db/types';

export type LeaderboardView = 'lifetime' | 'seasonal';

export type LeaderboardScope =
  | { kind: 'world' }
  | { kind: 'sport'; sport: Sport }
  | { kind: 'group'; groupId: string };

export interface LeaderboardEntry {
  rank: number;
  player: PlayerProfile;
  stats: PlayerStats;
  points: number;
  isHuman: boolean;
}

interface AggregateArgs {
  scope: LeaderboardScope;
  view: LeaderboardView;
  db: DB;
}

/** True if a bot has any meaningful skill in the given sport. Used to scope
 *  per-sport public arenas to "people who care about that sport". */
function botCaresAboutSport(bot: PlayerProfile, sport: Sport): boolean {
  return (bot.sportSkills?.[sport] ?? 0) >= 0.45;
}

function memberIdsForScope(db: DB, scope: LeaderboardScope): string[] {
  if (scope.kind === 'world') return db.players.map((p) => p.id);
  if (scope.kind === 'group') return getGroup(db, scope.groupId)?.memberIds ?? [];
  // 'sport': human + bots who care about that sport
  const out: string[] = [db.humanPlayerId];
  for (const p of db.players) {
    if (p.isHuman) continue;
    if (botCaresAboutSport(p, scope.sport)) out.push(p.id);
  }
  return out;
}

function pointsFor(
  stats: PlayerStats,
  scope: LeaderboardScope,
  view: LeaderboardView,
): number {
  if (scope.kind === 'sport') {
    return view === 'lifetime'
      ? stats.perSportLifetimePoints[scope.sport] ?? 0
      : stats.perSportSeasonalPoints[scope.sport] ?? 0;
  }
  return view === 'lifetime' ? stats.lifetimePoints : stats.seasonalScore;
}

export function aggregateLeaderboard({
  scope,
  view,
  db,
}: AggregateArgs): LeaderboardEntry[] {
  const ids = new Set(memberIdsForScope(db, scope));
  const statsById = new Map(db.stats.map((s) => [s.playerId, s]));

  const rows = db.players
    .filter((p) => ids.has(p.id))
    .map((player) => {
      const stats = statsById.get(player.id);
      if (!stats) return null;
      return {
        player,
        stats,
        points: pointsFor(stats, scope, view),
        isHuman: player.isHuman,
      };
    })
    .filter((r): r is Omit<LeaderboardEntry, 'rank'> => r !== null);

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    // Tie-breakers so the order is stable / fair: higher streak, then name.
    if (b.stats.streak !== a.stats.streak) return b.stats.streak - a.stats.streak;
    return a.player.name.localeCompare(b.player.name);
  });

  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

/** Index of the human entry, or -1 if not present. */
export function findHumanIndex(rows: LeaderboardEntry[]): number {
  return rows.findIndex((r) => r.isHuman);
}
