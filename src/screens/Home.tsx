import type { PlayerState } from '../lib/storage';
import { buildLeaderboard, PLAYER_NAME } from '../lib/leaderboard';

interface HomeProps {
  player: PlayerState;
  playedToday: boolean;
  onPlay: () => void;
  onLeaderboard: () => void;
  onResetDay: () => void;
}

export default function Home({ player, playedToday, onPlay, onLeaderboard, onResetDay }: HomeProps) {
  const myRank = buildLeaderboard(player.totalPoints).find((e) => e.isPlayer)?.rank ?? null;

  return (
    <div className="screen">
      <header className="brand">
        <h1>Ball Knowledge</h1>
        <p className="tagline">Your daily sports IQ check.</p>
      </header>

      <section className="rating-card">
        <span className="rating-label">Ball Knowledge rating</span>
        <span className="rating-value">{player.totalPoints}</span>
        <span className="rating-sub">
          {myRank ? `Ranked #${myRank}` : '—'} &middot; {player.quizzesCompleted} quizzes played
        </span>
      </section>

      {playedToday ? (
        <section className="status-card done">
          <span className="status-emoji" aria-hidden>✅</span>
          <h2>You're done for today</h2>
          <p>Nice work, {PLAYER_NAME.toLowerCase()}. Come back tomorrow for a fresh quiz.</p>
        </section>
      ) : (
        <button className="btn btn-primary btn-play" onClick={onPlay}>
          Play today's quiz
        </button>
      )}

      <button className="btn btn-secondary" onClick={onLeaderboard}>
        View leaderboard
      </button>

      <div className="dev-tools">
        <span className="dev-badge">DEV TOOLS</span>
        <button className="btn btn-dev" onClick={onResetDay}>
          Reset day (replay today)
        </button>
      </div>
    </div>
  );
}
