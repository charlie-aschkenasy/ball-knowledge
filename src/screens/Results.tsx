// ===========================================================================
// Results screen — count-up tally for points, lifetime, and seasonal. Fires
// the title-taken celebration banner if applicable. Below the tally, a
// per-question recap shows correctness + correct answer + what the user
// submitted across all three formats.
// ===========================================================================

import { useEffect, useState } from 'react';
import { useCountUp } from '../hooks/useCountUp';
import type { LastResult, RecapItem } from '../App';
import type { Question } from '../db/types';
import type { QuizAnswer } from './Quiz';

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

      {result.recap.length > 0 && (
        <section className="recap" aria-label="Per-question review">
          <span className="label" style={{ alignSelf: 'flex-start' }}>
            Review
          </span>
          {result.recap.map((item, i) => (
            <RecapCard key={item.question.id} index={i} item={item} />
          ))}
        </section>
      )}

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

function RecapCard({ index, item }: { index: number; item: RecapItem }) {
  const { question, answer } = item;
  const ok = answer.wasCorrect;
  return (
    <article className={`recap-card ${ok ? 'ok' : 'bad'}`}>
      <header className="recap-card-head">
        <span className="recap-q">Q{index + 1}</span>
        <span className={`recap-status ${ok ? 'ok' : 'bad'}`}>
          {ok ? '✓ Correct' : '✗ Wrong'}
        </span>
      </header>
      <p className="recap-text">{question.text}</p>
      <RecapBody question={question} answer={answer} />
    </article>
  );
}

function RecapBody({ question, answer }: { question: Question; answer: QuizAnswer }) {
  switch (question.type) {
    case 'multiple_choice': {
      const correct = question.options[question.correctIndex];
      const picked =
        answer.value && answer.value.kind === 'mc' && answer.value.selectedIndex !== null
          ? question.options[answer.value.selectedIndex]
          : null;
      return (
        <>
          <RecapLine label="Correct" value={correct} kind="correct" />
          <RecapLine
            label="You"
            value={picked ?? 'No answer.'}
            kind={answer.wasCorrect ? 'correct' : 'wrong'}
          />
        </>
      );
    }
    case 'fill_in_blank': {
      const accepted = question.acceptableAnswers[0];
      const extras = question.acceptableAnswers.length - 1;
      const typed =
        answer.value && answer.value.kind === 'fib' ? answer.value.text : null;
      return (
        <>
          <RecapLine
            label="Correct"
            value={
              extras > 0
                ? `${accepted}  (+${extras} more accepted)`
                : accepted
            }
            kind="correct"
          />
          <RecapLine
            label="You"
            value={typed ?? 'No answer.'}
            kind={answer.wasCorrect ? 'correct' : 'wrong'}
          />
        </>
      );
    }
    case 'matching': {
      return (
        <>
          <div className="recap-line">
            <span className="recap-line-label">Pairs</span>
            <ul className="recap-pairs">
              {question.pairs.map((p) => (
                <li key={p.left}>
                  <span>{p.left}</span>
                  <span className="recap-arrow">→</span>
                  <span>{p.right}</span>
                </li>
              ))}
            </ul>
          </div>
          <RecapLine
            label="You"
            value={
              answer.value && answer.value.kind === 'match' && answer.value.mapping
                ? answer.wasCorrect
                  ? 'All four matched.'
                  : 'One or more wrong.'
                : 'No answer.'
            }
            kind={answer.wasCorrect ? 'correct' : 'wrong'}
          />
        </>
      );
    }
  }
}

function RecapLine({
  label,
  value,
  kind,
}: {
  label: string;
  value: string;
  kind: 'correct' | 'wrong';
}) {
  return (
    <div className="recap-line">
      <span className="recap-line-label">{label}</span>
      <span className={`recap-line-value ${kind}`}>{value}</span>
    </div>
  );
}
