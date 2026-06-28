// ===========================================================================
// Leaderboard screen for the real flow. Reads the "leaderboard" view
// (display_name, score) and renders it with the Duolingo-league styling from
// the original screen — ranked rows, top-3 highlighted.
// ===========================================================================

import { useEffect, useState } from 'react';
import { Avatar } from '../components/Avatar';
import { getLeaderboard, type LeaderboardRow } from '../lib/api';

interface Props {
  onHome: () => void;
}

export default function PlayLeaderboard({ onHome }: Props) {
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getLeaderboard()
      .then((data) => active && setRows(data))
      .catch((e) => active && setError(e instanceof Error ? e.message : 'Failed to load.'));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="screen leaderboard">
      <header className="league-header">
        <div className="league-badge">🌎</div>
        <div className="league-titles">
          <h1 className="league-title">Leaderboard</h1>
          <p className="league-sub">Today’s scores</p>
        </div>
      </header>

      {error && <p className="lb-empty">{error}</p>}
      {!error && rows === null && <p className="lb-empty">Loading…</p>}
      {!error && rows !== null && rows.length === 0 && (
        <div className="lb-empty">
          <p className="lb-empty-title">No scores yet today</p>
          <p>Play the quiz and you’ll be first on the board.</p>
        </div>
      )}

      {rows && rows.length > 0 && (
        <ol className="league-list">
          {rows.map((r, i) => (
            <li key={`${r.display_name}-${i}`} className="league-row">
              <span className="league-rank">{i + 1}</span>
              <Avatar name={r.display_name || 'Player'} />
              <div className="league-name-col">
                <span className="league-name">{r.display_name || 'Player'}</span>
              </div>
              <span className="league-points">{r.score.toLocaleString()}</span>
            </li>
          ))}
        </ol>
      )}

      <button className="btn btn-ghost" onClick={onHome}>
        Back home
      </button>
    </div>
  );
}
