// ===========================================================================
// Home screen.
//
// Drop status at the top, lifetime rating BIG (the player's permanent
// "resume"), seasonal score and streak underneath. CTA pulls you into today's
// quiz when the window is open and you haven't played. Otherwise locked with
// a countdown to the next window switch.
// ===========================================================================

import { useEffect, useState } from 'react';
import { useDB, useGameTime, useHumanStats } from '../db/store';
import { aggregateLeaderboard } from '../domain/leaderboard';
import {
  canPlayNow,
  formatCountdown,
  hasPlayedToday,
  secondsUntilNextWindowChange,
} from '../domain/time';

interface Props {
  onPlay: () => void;
  onLeaderboards: () => void;
  onGroups: () => void;
  onDev: () => void;
}

export default function Home({ onPlay, onLeaderboards, onGroups, onDev }: Props) {
  const db = useDB();
  const stats = useHumanStats();
  const time = useGameTime();
  const [tick, setTick] = useState(0);

  // Lightweight 1s tick to refresh the live-mode countdown.
  useEffect(() => {
    if (!time) return;
    if (time.mode !== 'live') return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [time?.mode]);

  if (!db || !stats || !time) return null;

  const myRank =
    aggregateLeaderboard({ db, view: 'seasonal', scope: { kind: 'world' } }).find(
      (r) => r.isHuman,
    )?.rank ?? null;

  const playable = canPlayNow(stats, time);
  const playedToday = hasPlayedToday(stats, time);

  return (
    <div className="screen home">
      <header className="brand">
        <h1 className="brand-title">
          Ball<span className="accent"> Knowledge</span>
        </h1>
        <p className="brand-tag">Your daily sports IQ check.</p>
      </header>

      {/* Hero card with the big lifetime number */}
      <section className="home-hero">
        <div className="home-hero-row">
          <span className="home-rating-label">Lifetime rating</span>
          <span className="num" style={{ color: 'var(--muted)' }}>
            {myRank ? `#${myRank}` : '—'}
          </span>
        </div>
        <div className="home-rating-value">{stats.lifetimePoints.toLocaleString()}</div>

        <div className="home-secondary">
          <div className="home-stat">
            <span className="label">Season</span>
            <span className="home-stat-value">{stats.seasonalScore.toLocaleString()}</span>
          </div>
          <div className="home-stat">
            <span className="label">Streak</span>
            <span className="home-stat-value">
              {stats.streak}
              <span style={{ color: 'var(--muted)', marginLeft: 6, fontSize: 18 }}>
                {stats.streak > 0 ? '🔥' : ''}
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* Drop status + CTA */}
      <section className="card home-drop">
        <DropStatus
          time={time}
          playedToday={playedToday}
          playable={playable}
          tick={tick}
        />
        {playable && (
          <button className="btn btn-primary btn-play" onClick={onPlay}>
            Play today’s quiz
          </button>
        )}
      </section>

      {/* Nav */}
      <div className="home-action-grid">
        <button className="btn btn-secondary" onClick={onLeaderboards}>
          Leaderboards
        </button>
        <button className="btn btn-secondary" onClick={onGroups}>
          Groups
        </button>
      </div>

      {/* Dev */}
      <div className="home-footer">
        <button className="btn btn-ghost btn-small" onClick={onDev}>
          🛠 Dev tools
        </button>
      </div>
    </div>
  );
}

interface DropStatusProps {
  time: NonNullable<ReturnType<typeof useGameTime>>;
  playedToday: boolean;
  playable: boolean;
  tick: number;
}

function DropStatus({ time, playedToday, playable, tick }: DropStatusProps) {
  // `tick` only matters in live mode so the countdown re-reads the wall clock.
  void tick;
  const w = time.currentWindow;
  if (playedToday) {
    return (
      <div className="home-drop-status">
        <span className="label">All set today</span>
        <h2>Done for today ✓</h2>
        <p style={{ color: 'var(--muted)' }}>Come back at the next drop.</p>
      </div>
    );
  }

  if (w === 'pre') {
    const secs = time.mode === 'live' ? secondsUntilNextWindowChange() : null;
    return (
      <div className="home-drop-status">
        <span className="label">Next drop</span>
        <h2>Locked</h2>
        {secs !== null && <p className="home-countdown">{formatCountdown(secs)}</p>}
      </div>
    );
  }
  if (w === 'morning') {
    return (
      <div className="home-drop-status">
        <span className="label">Live now</span>
        <h2>Today’s drop is open</h2>
      </div>
    );
  }
  if (w === 'evening') {
    return (
      <div className="home-drop-status">
        <span className="label" style={{ color: 'var(--wrong)' }}>
          Last chance
        </span>
        <h2>Evening drop</h2>
        <p style={{ color: 'var(--muted)' }}>This closes at midnight.</p>
      </div>
    );
  }
  void playable;
  return (
    <div className="home-drop-status">
      <span className="label">Closed</span>
      <h2>Out of windows</h2>
    </div>
  );
}
