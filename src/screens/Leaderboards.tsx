// ===========================================================================
// Leaderboards screen — Duolingo Leagues style. League header with badge +
// season info, chunky rounded rows with letter-avatar circles, promotion and
// demotion zones marked with banners, "YOU" row gold-bordered.
//
// Data flow unchanged from before: aggregateLeaderboard({ scope, view, db })
// gives the ranked rows; computeTitleHolders(db, { kind:'world' }) gives the
// title pills.
// ===========================================================================

import { Fragment, useMemo, useState } from 'react';
import { LeagueRow, type Zone } from '../components/LeagueRow';
import SegmentedControl from '../components/SegmentedControl';
import { useDB, useSeason } from '../db/store';
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

const SCOPE_LABELS: { key: ScopeKey; label: string; emoji: string }[] = [
  { key: 'world',   label: 'World',   emoji: '🌎' },
  { key: 'NBA',     label: 'NBA',     emoji: '🏀' },
  { key: 'NFL',     label: 'NFL',     emoji: '🏈' },
  { key: 'MLB',     label: 'MLB',     emoji: '⚾' },
  { key: 'UFC',     label: 'UFC',     emoji: '🥊' },
  { key: 'Soccer',  label: 'Soccer',  emoji: '⚽' },
  { key: 'general', label: 'General', emoji: '🏆' },
];

/** Zone sizes are cosmetic — there are no real promotions in Ball Knowledge,
 *  but the visual cue still motivates climbing / catching up. */
const PROMOTE_COUNT = 10;
const DEMOTE_COUNT = 5;

export default function Leaderboards({ onHome }: Props) {
  const db = useDB();
  const season = useSeason();
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
    if (!db) return new Map<Sport, string>();
    return computeTitleHolders(db, { kind: 'world' });
  }, [db]);

  if (!db) return null;

  const scopeMeta = SCOPE_LABELS.find((s) => s.key === scopeKey) ?? SCOPE_LABELS[0];
  const hasZones =
    view === 'seasonal' && rows.length > PROMOTE_COUNT + DEMOTE_COUNT + 1;

  return (
    <div className="screen leaderboard">
      {/* League header */}
      <header className="league-header">
        <div className="league-badge">{scopeMeta.emoji}</div>
        <div className="league-titles">
          <h1 className="league-title">{scopeMeta.label} league</h1>
          <p className="league-sub">
            Season {season?.number ?? '–'} ·{' '}
            {view === 'seasonal' ? 'live race' : 'all-time totals'}
          </p>
        </div>
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
        {SCOPE_LABELS.map(({ key, label, emoji }) => (
          <button
            key={key}
            className="tab-pill"
            role="tab"
            aria-pressed={scopeKey === key}
            onClick={() => setScopeKey(key)}
          >
            <span style={{ marginRight: 6 }}>{emoji}</span>
            {label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="lb-empty">No one ranked yet.</p>
      ) : (
        <ol className="league-list">
          {rows.map((r, i) => {
            const zone = zoneFor(i, rows.length);
            const showPromote = hasZones && i === 0;
            const showDemote = hasZones && i === rows.length - DEMOTE_COUNT;
            return (
              <Fragment key={r.player.id}>
                {showPromote && (
                  <ZoneBanner kind="promote" count={PROMOTE_COUNT} />
                )}
                {showDemote && <ZoneBanner kind="demote" count={DEMOTE_COUNT} />}
                <LeagueRow
                  entry={r}
                  zone={zone}
                  titles={titlesHeldBy(titles, r.player.id)}
                />
              </Fragment>
            );
          })}
        </ol>
      )}

      <button className="btn btn-ghost" onClick={onHome}>
        Back home
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------

function zoneFor(index: number, total: number): Zone {
  if (index < PROMOTE_COUNT) return 'promote';
  if (index >= total - DEMOTE_COUNT) return 'demote';
  return 'safe';
}

function ZoneBanner({ kind, count }: { kind: 'promote' | 'demote'; count: number }) {
  return (
    <li className={`zone-banner zone-${kind}`} aria-hidden>
      <span className="zone-icon">{kind === 'promote' ? '↑' : '↓'}</span>
      <span className="zone-label">
        {kind === 'promote'
          ? `Promotion zone · top ${count}`
          : `Demotion zone · bottom ${count}`}
      </span>
    </li>
  );
}
