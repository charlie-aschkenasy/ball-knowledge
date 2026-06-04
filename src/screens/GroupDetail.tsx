// ===========================================================================
// One group's leaderboard. Same row component as the main board, but the
// title pills are scoped to THIS group (so "NBA guy" here is the NBA leader
// inside the group, not in the world).
// ===========================================================================

import { useMemo, useState } from 'react';
import LeaderboardRow from '../components/LeaderboardRow';
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

  return (
    <div className="screen">
      <header className="brand group-detail-head">
        <h1 className="brand-title">{group.name}</h1>
        <p className="brand-tag">
          {group.type === 'arena' && group.sport
            ? `${group.sport} arena · ${group.memberIds.length} members`
            : `Squad · ${group.memberIds.length} members`}
        </p>
      </header>

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
        <ol className="board">
          {rows.map((r) => (
            <LeaderboardRow
              key={r.player.id}
              rank={r.rank}
              name={r.player.name}
              points={r.points}
              isHuman={r.isHuman}
              titles={titlesHeldBy(titles, r.player.id)}
            />
          ))}
        </ol>
      )}

      <button className="btn btn-secondary" onClick={onBack}>
        Back to groups
      </button>
    </div>
  );
}
