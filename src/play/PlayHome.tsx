// ===========================================================================
// Home screen for the real (server-backed) flow. Same visual language as the
// original Home, trimmed to what the backend actually provides: a play CTA and
// navigation. Lifetime/streak/season were placeholder local-sim stats and are
// intentionally gone.
// ===========================================================================

import { useAuth } from '../auth/AuthProvider';

interface Props {
  onPlay: () => void;
  onLeaderboards: () => void;
  loadingQuiz: boolean;
  error: string | null;
}

export default function PlayHome({ onPlay, onLeaderboards, loadingQuiz, error }: Props) {
  const { user, signOut } = useAuth();

  return (
    <div className="screen home">
      <header className="brand">
        <h1 className="brand-title">
          Ball<span className="accent"> Knowledge</span>
        </h1>
        <p className="brand-tag">Your daily sports IQ check.</p>
      </header>

      <section className="card home-drop">
        <div className="home-drop-status">
          <span className="label">Today’s drop</span>
          <h2>Ready when you are</h2>
          <p style={{ color: 'var(--muted)' }}>
            Five questions. One shot a day.
          </p>
        </div>
        {error && <p className="auth-error">{error}</p>}
        <button
          className="btn btn-primary btn-play"
          onClick={onPlay}
          disabled={loadingQuiz}
        >
          {loadingQuiz ? 'Loading…' : 'Play today’s quiz'}
        </button>
      </section>

      <div className="home-action-grid">
        <button className="btn btn-secondary" onClick={onLeaderboards}>
          Leaderboard
        </button>
        <button className="btn btn-secondary" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>

      <div className="home-footer">
        <span className="btn-small" style={{ color: 'var(--muted)' }}>
          {user?.email}
        </span>
      </div>
    </div>
  );
}
