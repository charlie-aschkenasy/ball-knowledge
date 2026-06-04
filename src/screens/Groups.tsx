// ===========================================================================
// Groups list. Squads (private friend-style rooms) on top, then the per-sport
// arenas. Each card shows size and the human's current rank inside.
// ===========================================================================

import { useDB } from '../db/store';
import { aggregateLeaderboard } from '../domain/leaderboard';
import type { Group, Sport } from '../db/types';

interface Props {
  onOpen: (groupId: string) => void;
  onHome: () => void;
}

export default function Groups({ onOpen, onHome }: Props) {
  const db = useDB();
  if (!db) return null;

  const squads = db.groups.filter((g) => g.type === 'squad');
  const arenas = db.groups.filter((g) => g.type === 'arena');

  return (
    <div className="screen">
      <header className="brand">
        <h1 className="brand-title">
          Group<span className="accent">s</span>
        </h1>
        <p className="brand-tag">Your squads and the public arenas.</p>
      </header>

      <section className="group-section">
        <div className="group-section-head">
          <span className="label">Your squads</span>
        </div>
        {squads.map((g) => (
          <GroupCard key={g.id} group={g} onOpen={() => onOpen(g.id)} />
        ))}
      </section>

      <section className="group-section">
        <div className="group-section-head">
          <span className="label">Sport arenas</span>
        </div>
        {arenas.map((g) => (
          <GroupCard key={g.id} group={g} onOpen={() => onOpen(g.id)} />
        ))}
      </section>

      <button className="btn btn-secondary" onClick={onHome}>
        Back home
      </button>
    </div>
  );
}

function GroupCard({ group, onOpen }: { group: Group; onOpen: () => void }) {
  const db = useDB();
  if (!db) return null;

  const rows = aggregateLeaderboard({
    db,
    view: 'seasonal',
    scope: { kind: 'group', groupId: group.id },
  });
  const myRank = rows.find((r) => r.isHuman)?.rank ?? null;

  return (
    <button className="group-card" onClick={onOpen}>
      <div className="group-card-row">
        <div>
          <div className="group-card-name">{group.name}</div>
          <div className="group-card-sub">
            {group.memberIds.length} {group.memberIds.length === 1 ? 'member' : 'members'}
            {group.sport ? ` · ${group.sport}` : ''}
          </div>
        </div>
        <div className="group-card-sub">
          {myRank ? `#${myRank}` : '—'}
        </div>
      </div>
    </button>
  );
}

// Re-export for App typing convenience
export type { Group, Sport };
