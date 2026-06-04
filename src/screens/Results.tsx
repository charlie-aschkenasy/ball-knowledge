// ===========================================================================
// Results screen — count-up tally for points, lifetime, and seasonal. Fires
// the title-taken celebration banner if applicable.
// ===========================================================================

import { useEffect, useState } from 'react';
import { useCountUp } from '../hooks/useCountUp';
import type { LastResult } from '../App';

interface Props {
  result: LastResult;
  onHome: () => void;
  onLeaderboards: () => void;
}

export default function Results({ result, onHome, onLeaderboards }: Props) {
  const points = useCountUp(result.pointsEarned, 550);
  const lifetime = useCountUp(result.newLifetime, 750);
  const seasonal = useCountUp(result.newSeasonal, 750);
  const [bannerVisible, setBannerVisible] = useState(result.titlesTaken.length > 0);

  // Auto-hide the banner after its animation lifetime so subsequent re-mounts
  // (eg navigating back) don't replay it.
  useEffect(() => {
    if (!bannerVisible) return;
    const id = window.setTimeout(() => setBannerVisible(false), 1900);
    return () => window.clearTimeout(id);
  }, [bannerVisible]);

  const { correctCount, total } = result;
  let headline = 'Quiz complete';
  if (correctCount === total) headline = 'Perfect run';
  else if (correctCount === 0) headline = 'Rough one';
  else if (correctCount >= Math.ceil(total / 2)) headline = 'Solid showing';

  return (
    <div className="screen results">
      <header className="brand" style={{ alignItems: 'center', textAlign: 'center' }}>
        <h1 className="results-headline">{headline}</h1>
      </header>

      <div className="results-ring">
        <span className="results-big">
          {correctCount}
          <span className="small">/{total}</span>
        </span>
        <span className="results-caption">correct</span>
      </div>

      <ul className="result-stats">
        <li>
          <span className="stat-label">Points earned</span>
          <strong className="stat-value">+{points}</strong>
        </li>
        <li>
          <span className="stat-label">Lifetime rating</span>
          <strong className="stat-value">{lifetime.toLocaleString()}</strong>
        </li>
        <li>
          <span className="stat-label">Season score</span>
          <strong className="stat-value">{seasonal.toLocaleString()}</strong>
        </li>
      </ul>

      <button className="btn btn-primary" onClick={onLeaderboards}>
        See the leaderboard
      </button>
      <button className="btn btn-secondary" onClick={onHome}>
        Back home
      </button>

      {bannerVisible && result.titlesTaken[0] && (
        <div className="title-banner" role="status">
          NEW {result.titlesTaken[0].toUpperCase()} GUY
        </div>
      )}
    </div>
  );
}
