// ===========================================================================
// One row in a leaderboard. Highlights the human row; renders gold title
// pills for any sports this player holds in the current scope.
// ===========================================================================

import type { Sport } from '../db/types';

interface Props {
  rank: number;
  name: string;
  points: number;
  isHuman: boolean;
  titles: Sport[];
}

export default function LeaderboardRow({ rank, name, points, isHuman, titles }: Props) {
  return (
    <li className={`board-row ${isHuman ? 'me' : ''}`}>
      <span className="board-rank">{rank}</span>
      <span className="board-name">
        <span className="name">{name}</span>
        {titles.map((sport) => (
          <span key={sport} className="tag tag-title">
            🏆 {sport}
          </span>
        ))}
      </span>
      <span className="board-points">{points.toLocaleString()}</span>
    </li>
  );
}
