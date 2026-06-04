// ---------------------------------------------------------------------------
// Leaderboard: seeded fake players plus the real player, ranked by points.
// ---------------------------------------------------------------------------

export interface LeaderboardEntry {
  name: string;
  totalPoints: number;
  isPlayer: boolean;
  rank: number;
}

/** Display name for the real (current) player. */
export const PLAYER_NAME = 'You';

/** Seeded fake players so the board looks populated and real. */
const SEED_PLAYERS: { name: string; totalPoints: number }[] = [
  { name: 'CourtVision', totalPoints: 420 },
  { name: 'GridironGoat', totalPoints: 360 },
  { name: 'PaintBeast', totalPoints: 310 },
  { name: 'PitchPerfect', totalPoints: 250 },
  { name: 'OctagonOracle', totalPoints: 190 },
  { name: 'DiamondDan', totalPoints: 140 },
  { name: 'RookieRiley', totalPoints: 80 },
];

/**
 * Builds the ranked leaderboard, inserting the real player by their total
 * points and computing 1-based ranks (highest points first).
 */
export function buildLeaderboard(playerPoints: number): LeaderboardEntry[] {
  const combined = [
    ...SEED_PLAYERS.map((p) => ({ ...p, isPlayer: false })),
    { name: PLAYER_NAME, totalPoints: playerPoints, isPlayer: true },
  ];

  combined.sort((a, b) => b.totalPoints - a.totalPoints);

  return combined.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}
