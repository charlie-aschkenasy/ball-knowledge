// ===========================================================================
// Dev panel. Clearly badged "DEV TOOLS — simulated time". Controls map 1:1
// to the actions documented in PLAN.md "Dev panel + debug view".
//
// Includes the question debug table — a sortable view of seed difficulty,
// intrinsic, timesShown/timesCorrect, accuracy, and effective bucket. Rows
// where effective != seed are highlighted so the engine's calibration is
// visible at a glance.
// ===========================================================================

import { useMemo, useState } from 'react';
import { QUESTIONS } from '../data/questions';
import { useBKStore, useDB, useGameTime } from '../db/store';
import {
  effectiveDifficulty,
  hasDrifted,
  liveAccuracy,
} from '../domain/difficulty';
import { advanceDays, rollSeason } from '../domain/season';
import { enterLiveMode, enterSimMode, setWindow } from '../domain/time';
import type { Difficulty, DropWindow } from '../db/types';

interface Props {
  onHome: () => void;
}

type SortKey =
  | 'id'
  | 'sport'
  | 'seed'
  | 'intrinsic'
  | 'shown'
  | 'correct'
  | 'accuracy'
  | 'effective';

const WINDOWS: DropWindow[] = ['pre', 'morning', 'evening', 'closed'];

export default function Dev({ onHome }: Props) {
  const db = useDB();
  const time = useGameTime();
  const setDB = useBKStore((s) => s.setDB);
  const reseed = useBKStore((s) => s.reseed);

  const [advanceN, setAdvanceN] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('shown');
  const [sortDesc, setSortDesc] = useState(true);

  if (!db || !time) return null;

  function action(fn: () => void) {
    return () => fn();
  }

  function doResetToday() {
    if (!db) return;
    setDB({
      ...db,
      stats: db.stats.map((s) =>
        s.playerId === db.humanPlayerId ? { ...s, lastPlayedDay: null } : s,
      ),
    });
  }

  function doAdvance(n: number) {
    if (!db) return;
    setDB(advanceDays(db, n, QUESTIONS));
  }

  function doForceWindow(w: DropWindow) {
    if (!db) return;
    setDB({ ...db, time: setWindow(db.time, w) });
  }

  function doToggleMode() {
    if (!db) return;
    setDB({
      ...db,
      time: db.time.mode === 'live' ? enterSimMode(db.time) : enterLiveMode(db.time),
    });
  }

  function doResetSeason() {
    if (!db) return;
    setDB(rollSeason(db));
  }

  function doReseed() {
    if (confirm('Wipe the world and reseed (40 bots + 12-day backfill)?')) {
      reseed();
    }
  }

  // ----- Debug table ------------------------------------------------------
  const debugRows = useMemo(() => {
    const statById = new Map(db.questionStats.map((s) => [s.questionId, s]));
    return QUESTIONS.map((q) => {
      const stat = statById.get(q.id) ?? {
        questionId: q.id,
        timesShown: 0,
        timesCorrect: 0,
      };
      const eff: Difficulty = effectiveDifficulty(q, stat);
      const acc = liveAccuracy(stat);
      return {
        id: q.id,
        sport: q.sport,
        seed: q.difficulty,
        intrinsic: q.intrinsic,
        shown: stat.timesShown,
        correct: stat.timesCorrect,
        accuracy: acc,
        effective: eff,
        drifted: hasDrifted(q, stat),
      };
    });
  }, [db.questionStats]);

  const sortedRows = useMemo(() => {
    const copy = [...debugRows];
    copy.sort((a, b) => {
      let av: number | string = a[sortKey] ?? 0;
      let bv: number | string = b[sortKey] ?? 0;
      if (sortKey === 'accuracy') {
        av = a.accuracy ?? -1;
        bv = b.accuracy ?? -1;
      }
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDesc ? bv.localeCompare(av) : av.localeCompare(bv);
      }
      return sortDesc ? (bv as number) - (av as number) : (av as number) - (bv as number);
    });
    return copy;
  }, [debugRows, sortKey, sortDesc]);

  function clickSort(key: SortKey) {
    if (sortKey === key) setSortDesc((d) => !d);
    else {
      setSortKey(key);
      setSortDesc(true);
    }
  }

  return (
    <div className="screen dev-screen">
      <header className="brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="dev-badge">DEV TOOLS</span>
          <span className="dev-mode">
            Day{' '}
            <strong style={{ color: 'var(--text)' }}>{time.currentDay}</strong>
            {' · '}
            <span className={time.mode === 'live' ? 'live' : 'sim'}>{time.mode}</span>
            {' · '}
            window {time.currentWindow}
          </span>
        </div>
        <p className="brand-tag">Simulated time. Wipe is destructive.</p>
      </header>

      {/* Time controls */}
      <section className="dev-section">
        <span className="label">Time</span>
        <div className="dev-row">
          <button className="btn btn-secondary btn-small" onClick={action(doResetToday)}>
            Reset today
          </button>
          <button
            className="btn btn-secondary btn-small"
            onClick={action(() => doAdvance(1))}
          >
            +1 day
          </button>
          <input
            type="number"
            min={1}
            max={60}
            value={advanceN}
            onChange={(e) => setAdvanceN(Math.max(1, Number(e.target.value) || 1))}
            className="dev-input"
          />
          <button
            className="btn btn-secondary btn-small"
            onClick={action(() => doAdvance(advanceN))}
          >
            +N days
          </button>
        </div>
        <div className="dev-row">
          <span className="label">Force window:</span>
          {WINDOWS.map((w) => (
            <button
              key={w}
              className="btn btn-secondary btn-small"
              onClick={action(() => doForceWindow(w))}
              disabled={time.currentWindow === w}
            >
              {w}
            </button>
          ))}
        </div>
        <div className="dev-row">
          <button className="btn btn-secondary btn-small" onClick={action(doToggleMode)}>
            Switch to {time.mode === 'live' ? 'sim' : 'live'} mode
          </button>
        </div>
      </section>

      {/* Destructive actions */}
      <section className="dev-section">
        <span className="label">Reset</span>
        <div className="dev-row">
          <button className="btn btn-danger btn-small" onClick={action(doResetSeason)}>
            Reset season
          </button>
          <button className="btn btn-danger btn-small" onClick={action(doReseed)}>
            Reseed DB
          </button>
        </div>
      </section>

      {/* Question debug table */}
      <section className="dev-section">
        <span className="label">Question engine</span>
        <p className="brand-tag" style={{ marginTop: 0 }}>
          Rows highlighted ⚡ have drifted away from their seed bucket under
          live data. {sortedRows.filter((r) => r.drifted).length} of {sortedRows.length} drifted.
        </p>
        <div className="debug-table-wrap">
          <table className="debug-table">
            <thead>
              <tr>
                <th onClick={() => clickSort('id')}>id</th>
                <th onClick={() => clickSort('sport')}>sport</th>
                <th onClick={() => clickSort('seed')}>seed</th>
                <th onClick={() => clickSort('intrinsic')}>intrinsic</th>
                <th onClick={() => clickSort('shown')}>shown</th>
                <th onClick={() => clickSort('correct')}>correct</th>
                <th onClick={() => clickSort('accuracy')}>acc</th>
                <th onClick={() => clickSort('effective')}>effective</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((r) => (
                <tr key={r.id} className={r.drifted ? 'drifted' : ''}>
                  <td>{r.id}</td>
                  <td>{r.sport}</td>
                  <td>
                    <span className={`pill pill-${r.seed}`}>{r.seed}</span>
                  </td>
                  <td>{r.intrinsic.toFixed(2)}</td>
                  <td>{r.shown}</td>
                  <td>{r.correct}</td>
                  <td>{r.accuracy !== null ? r.accuracy.toFixed(2) : '—'}</td>
                  <td>
                    <span className={`pill pill-${r.effective}`}>{r.effective}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <button className="btn btn-secondary" onClick={onHome}>
        Back home
      </button>
    </div>
  );
}
