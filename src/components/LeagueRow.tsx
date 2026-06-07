// ===========================================================================
// Duolingo-style row used by both Leaderboards and GroupDetail. Letter-avatar
// circle, name, optional streak + title pills, big points.
//
// `zone` shades the row green (promotion) or red (demotion). The human's row
// always gets the gold "YOU" treatment regardless of zone.
// ===========================================================================

import type { LeaderboardEntry } from '../domain/leaderboard';
import type { Sport } from '../db/types';

export type Zone = 'promote' | 'safe' | 'demote';

interface Props {
  entry: LeaderboardEntry;
  zone: Zone;
  titles: Sport[];
}

export function LeagueRow({ entry, zone, titles }: Props) {
  const cls = [
    'league-row',
    entry.isHuman ? 'me' : '',
    !entry.isHuman ? `zone-${zone}` : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <li className={cls}>
      <span className="league-rank">{entry.rank}</span>
      <Avatar name={entry.player.name} highlight={entry.isHuman} />
      <div className="league-name-col">
        <span className="league-name">
          {entry.isHuman ? 'YOU' : entry.player.name}
        </span>
        <div className="league-name-meta">
          {entry.stats.streak > 0 && (
            <span className="league-streak">🔥 {entry.stats.streak}</span>
          )}
          {titles.map((s) => (
            <span key={s} className="league-title-pill">
              🏆 {s}
            </span>
          ))}
        </div>
      </div>
      <span className="league-points">{entry.points.toLocaleString()}</span>
    </li>
  );
}

// ---------- Avatar ----------

const AVATAR_COLORS = [
  '#6aaa64', '#c9b458', '#c9303c', '#5e7ce2',
  '#8b5cf6', '#ec4899', '#f97316', '#0ea5e9',
  '#14b8a6', '#a16207',
];

export function colorForName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function Avatar({
  name,
  highlight,
  large,
}: {
  name: string;
  highlight?: boolean;
  large?: boolean;
}) {
  const bg = highlight ? 'var(--accent)' : colorForName(name);
  const letter = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <span
      className={`avatar ${large ? 'avatar-lg' : ''}`}
      style={{ background: bg }}
      aria-hidden
    >
      {letter}
    </span>
  );
}
