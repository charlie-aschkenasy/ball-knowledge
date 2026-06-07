// ===========================================================================
// One group's leaderboard. Same chunky-row style as the main Leaderboards
// page, plus a prominent "leader" hero card at the top so the top user's
// name is the first thing you see.
//
// Title pills are scoped to THIS group (so "NBA guy" here is the NBA leader
// inside the group, not in the world).
// ===========================================================================

import { useMemo, useState } from 'react';
import { Avatar, LeagueRow } from '../components/LeagueRow';
import SegmentedControl from '../components/SegmentedControl';
import { useDB, useGroup } from '../db/store';
import { aggregateLeaderboard, type LeaderboardView } from '../domain/leaderboard';
import { computeTitleHolders, titlesHeldBy } from '../domain/titles';

interface Props {
  groupId: string;
  onBack: () => void;
}

export default function GroupDetail({ groupId, onBack }: Props) {
  const db = useDB();
  const group = useGroup(groupId);
  const [view, setView] = useState<LeaderboardView>('seasonal');

  const rows = useMemo(() => {
    if (!db) return [];
    return aggregateLeaderboard({
      db,
      view,
      scope: { kind: 'group', groupId },
    });
  }, [db, view, groupId]);

  const titles = useMemo(() => {
    if (!db) return new Map();
    return computeTitleHolders(db, { kind: 'group', groupId });
  }, [db, groupId]);

  if (!db || !group) {
    return (
      <div className="screen">
        <p className="lb-empty">Group not found.</p>
        <button className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
      </div>
    );
  }

  const leader = rows[0];
  const restRows = rows.slice(1);
  const subtitle =
    group.type === 'arena' && group.sport
      ? `${group.sport} arena · ${group.memberIds.length} members`
      : `Squad · ${group.memberIds.length} members`;

  return (
    <div className="screen">
      <header className="league-header">
        <div className="league-badge">{group.type === 'arena' ? '🏟️' : '👥'}</div>
        <div className="league-titles">
          <h1 className="league-title">{group.name}</h1>
          <p className="league-sub">{subtitle}</p>
        </div>
      </header>

      {leader && (
        <article className="leader-card">
          <span className="label">Top of {group.name}</span>
          <div className="leader-card-row">
            <Avatar name={leader.player.name} highlight={leader.isHuman} large />
            <div className="leader-card-name-col">
              <span className="leader-card-name">
                {leader.isHuman ? 'YOU' : leader.player.name}
              </span>
              <span className="leader-card-sub">
                {leader.isHuman ? '#1 · keep it up' : '#1 in this group'}
              </span>
            </div>
            <span className="leader-card-points">
              {leader.points.toLocaleString()}
            </span>
          </div>
        </article>
      )}

      <SegmentedControl<LeaderboardView>
        options={[
          { value: 'seasonal', label: 'Season' },
          { value: 'lifetime', label: 'Lifetime' },
        ]}
        value={view}
        onChange={setView}
      />

      {rows.length === 0 ? (
        <p className="lb-empty">No one ranked yet.</p>
      ) : (
        <ol className="league-list">
          {restRows.map((r) => (
            <LeagueRow
              key={r.player.id}
              entry={r}
              zone="safe"
              titles={titlesHeldBy(titles, r.player.id)}
            />
          ))}
        </ol>
      )}

      <button className="btn btn-ghost" onClick={onBack}>
        Back to groups
      </button>
    </div>
  );
}
