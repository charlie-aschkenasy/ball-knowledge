import type { QuizResult } from '../lib/scoring';

interface ResultsProps {
  result: QuizResult;
  newTotal: number;
  onHome: () => void;
  onLeaderboard: () => void;
}

export default function Results({ result, newTotal, onHome, onLeaderboard }: ResultsProps) {
  const { correctCount, total, pointsEarned } = result;

  let headline = 'Quiz complete!';
  if (correctCount === total) headline = 'Perfect run!';
  else if (correctCount === 0) headline = 'Rough one today.';
  else if (correctCount >= Math.ceil(total / 2)) headline = 'Solid showing.';

  return (
    <div className="screen results">
      <header className="brand">
        <h1>{headline}</h1>
      </header>

      <div className="score-ring">
        <span className="score-big">
          {correctCount}
          <span className="score-small">/{total}</span>
        </span>
        <span className="score-caption">correct</span>
      </div>

      <ul className="result-stats">
        <li>
          <span>Points earned today</span>
          <strong>+{pointsEarned}</strong>
        </li>
        <li>
          <span>New ball knowledge rating</span>
          <strong>{newTotal}</strong>
        </li>
      </ul>

      <button className="btn btn-primary" onClick={onLeaderboard}>
        See the leaderboard
      </button>
      <button className="btn btn-secondary" onClick={onHome}>
        Back home
      </button>
    </div>
  );
}
