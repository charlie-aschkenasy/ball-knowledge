import { buildLeaderboard } from '../lib/leaderboard';

interface LeaderboardProps {
  playerPoints: number;
  onHome: () => void;
}

export default function Leaderboard({ playerPoints, onHome }: LeaderboardProps) {
  const entries = buildLeaderboard(playerPoints);

  return (
    <div className="screen leaderboard">
      <header className="brand">
        <h1>Leaderboard</h1>
        <p className="tagline">Ranked by ball knowledge rating.</p>
      </header>

      <ol className="board">
        {entries.map((entry) => (
          <li key={entry.name} className={`board-row ${entry.isPlayer ? 'me' : ''}`}>
            <span className="board-rank">#{entry.rank}</span>
            <span className="board-name">{entry.name}</span>
            <span className="board-points">{entry.totalPoints}</span>
          </li>
        ))}
      </ol>

      <button className="btn btn-secondary" onClick={onHome}>
        Back home
      </button>
    </div>
  );
}
