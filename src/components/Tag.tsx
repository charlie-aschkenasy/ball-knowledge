// ===========================================================================
// Pill / tag. Used for difficulty, sport, title markers.
// ===========================================================================

import type { Difficulty, Sport } from '../db/types';

export function DifficultyTag({ difficulty }: { difficulty: Difficulty }) {
  return <span className={`tag tag-${difficulty}`}>{difficulty}</span>;
}

export function SportTag({ sport }: { sport: Sport }) {
  return <span className="tag tag-sport">{sport}</span>;
}

export function TitleTag({ sport }: { sport: Sport }) {
  return <span className="tag tag-title">🏆 {sport} guy</span>;
}

export function StreakTag({ streak }: { streak: number }) {
  if (streak <= 0) return null;
  return <span className="tag tag-streak">🔥 {streak} day streak</span>;
}
