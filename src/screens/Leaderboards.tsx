// ===========================================================================
// Leaderboards screen. Two controls:
//   - Scope tabs: World / NBA / NFL / MLB / UFC / Soccer / general
//   - View segmented: Lifetime / Seasonal
// Rows are the human + bots in scope. Title pills decorate holders.
// ===========================================================================

import { useMemo, useState } from 'react';
import LeaderboardRow from '../components/LeaderboardRow';
import SegmentedControl from '../components/SegmentedControl';
import { useDB } from '../db/store';
import {
  aggregateLeaderboard,
  type LeaderboardScope,
  type LeaderboardView,
} from '../domain/leaderboard';
import { computeTitleHolders, titlesHeldBy } from '../domain/titles';
import type { Sport } from '../db/types';

interface Props {
  onHome: () => void;
}

type ScopeKey = 'world' | Sport;
const SCOPE_LABELS: { key: ScopeKey; label: string }[] = [
  { key: 'world', label: 'World' },
  { key: 'NBA', label: 'NBA' },
  { key: 'NFL', label: 'NFL' },
  { key: 'MLB', label: 'MLB' },
  { key: 'UFC', label: 'UFC' },
  { key: 'Soccer', label: 'Soccer' },
  { key: 'general', label: 'General' },
];

export default function Leaderboards({ onHome }: Props) {
  const db = useDB();
  const [scopeKey, setScopeKey] = useState<ScopeKey>('world');
  const [view, setView] = useState<LeaderboardView>('seasonal');

  const scope = useMemo<LeaderboardScope>(
    () => (scopeKey === 'world' ? { kind: 'world' } : { kind: 'sport', sport: scopeKey }),
    [scopeKey],
  );

  const rows = useMemo(() => {
    if (!db) return [];
    return aggregateLeaderboard({ scope, view, db });
  }, [db, scope, view]);

  const titles = useMemo(() => {
    if (!db) return new Map();
    return computeTitleHolders(db, { kind: 'world' });
  }, [db]);

  if (!db) return null;

  return (
    <div className="screen leaderboard">
      <header className="brand">
        <h1 className="brand-title">
          Leader<span className="accent">board</span>
        </h1>
        <p className="brand-tag">Ranked by points. Your row is highlighted.</p>
      </header>

      <SegmentedControl<LeaderboardView>
        options={[
          { value: 'seasonal', label: 'Season' },
          { value: 'lifetime', label: 'Lifetime' },
        ]}
        value={view}
        onChange={setView}
      />

      <div className="tabs-scroll" role="tablist">
        {SCOPE_LABELS.map(({ key, label }) => (
          <button
            key={key}
            className="tab-pill"
            role="tab"
            aria-pressed={scopeKey === key}
            onClick={() => setScopeKey(key)}
          >
            {label}
          </button>
        ))}
      </div>

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

      <button className="btn btn-secondary" onClick={onHome}>
        Back home
      </button>
    </div>
  );
}
