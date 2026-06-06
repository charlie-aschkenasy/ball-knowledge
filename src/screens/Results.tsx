// ===========================================================================
// Results screen — Wordle end-of-game style. A row of big-number stats, the
// per-question recap, a countdown to the next drop, and a big Share button
// that copies an emoji summary to the clipboard.
// ===========================================================================

import { useEffect, useState } from 'react';
import { useCountUp } from '../hooks/useCountUp';
import { useGameTime, useHumanStats } from '../db/store';
import { formatCountdown, secondsUntilNextWindowChange } from '../domain/time';
import type { LastResult, RecapItem } from '../App';
import type { Question } from '../db/types';
import type { QuizAnswer } from './Quiz';

interface Props {
  result: LastResult;
  onHome: () => void;
  onLeaderboards: () => void;
}

export default function Results({ result, onHome, onLeaderboards }: Props) {
  const stats = useHumanStats();
  const time = useGameTime();
  const points = useCountUp(result.pointsEarned, 550);
  const lifetime = useCountUp(result.newLifetime, 750);
  const seasonal = useCountUp(result.newSeasonal, 750);
  const [bannerVisible, setBannerVisible] = useState(result.titlesTaken.length > 0);
  const [copied, setCopied] = useState(false);
  const [liveTick, setLiveTick] = useState(0);

  // Auto-hide the title celebration banner
  useEffect(() => {
    if (!bannerVisible) return;
    const id = window.setTimeout(() => setBannerVisible(false), 1900);
    return () => window.clearTimeout(id);
  }, [bannerVisible]);

  // Live mode: refresh the countdown each second
  useEffect(() => {
    if (time?.mode !== 'live') return;
    const id = window.setInterval(() => setLiveTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [time?.mode]);

  // Auto-hide the "copied" toast
  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(id);
  }, [copied]);

  const { correctCount, total } = result;
  let headline = 'Quiz complete';
  if (correctCount === total) headline = 'Perfect run';
  else if (correctCount === 0) headline = 'Rough one';
  else if (correctCount >= Math.ceil(total / 2)) headline = 'Solid showing';

  const currentDay = time?.currentDay ?? 0;
  const streak = stats?.streak ?? 0;
  const longestStreak = stats?.longestStreak ?? 0;

  // Countdown text. In live mode we tick the wall clock; in sim mode the user
  // controls when day advances via Dev, so we just point at the next day.
  void liveTick; // referenced so the effect's setState triggers a re-render
  const countdownText =
    time?.mode === 'live'
      ? formatCountdown(secondsUntilNextWindowChange())
      : 'Day ' + (currentDay + 1);

  function handleShare() {
    const text = buildShareText(currentDay, result, streak);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => setCopied(true))
        .catch(() => setCopied(true)); // still flash the toast on permission denial
    } else {
      // Last-resort: open a prompt so the user can copy manually
      window.prompt('Copy your result:', text);
      setCopied(true);
    }
  }

  return (
    <div className="screen results">
      <header className="results-header">
        <span className="label">Day {currentDay}</span>
        <h1 className="results-headline">{headline}</h1>
      </header>

      <div className="stats-grid">
        <StatTile label="Correct" big={`${correctCount}/${total}`} />
        <StatTile label="Points" big={`+${points}`} />
        <StatTile label="Lifetime" big={lifetime.toLocaleString()} />
        <StatTile label="Streak" big={`${streak}`} sub={`max ${longestStreak}`} />
      </div>

      <div className="season-strip">
        <span className="label">Season score</span>
        <span className="season-strip-value">{seasonal.toLocaleString()}</span>
      </div>

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

      <div className="next-drop">
        <div className="next-drop-row">
          <span className="label">Next drop</span>
          <span className="next-drop-time num">{countdownText}</span>
        </div>
        <p className="next-drop-sub">
          {time?.mode === 'live'
            ? 'until the next window'
            : 'advance the simulated day in Dev tools to play again'}
        </p>
      </div>

      <button className="btn btn-primary btn-share" onClick={handleShare}>
        <ShareIcon /> Share result
      </button>
      <button className="btn btn-secondary" onClick={onLeaderboards}>
        See the leaderboard
      </button>
      <button className="btn btn-ghost" onClick={onHome}>
        Back home
      </button>

      {copied && (
        <div className="toast" role="status">
          Copied to clipboard
        </div>
      )}

      {bannerVisible && result.titlesTaken[0] && (
        <div className="title-banner" role="status">
          NEW {result.titlesTaken[0].toUpperCase()} GUY
        </div>
      )}
    </div>
  );
}

function StatTile({ label, big, sub }: { label: string; big: string; sub?: string }) {
  return (
    <div className="stat-tile">
      <span className="stat-tile-big">{big}</span>
      <span className="stat-tile-label">{label}</span>
      {sub && <span className="stat-tile-sub">{sub}</span>}
    </div>
  );
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function buildShareText(day: number, r: LastResult, streak: number): string {
  const grid = r.recap.map((item) => (item.answer.wasCorrect ? '🟩' : '⬜')).join('');
  return [
    `Ball Knowledge · Day ${day}`,
    `${grid} ${r.correctCount}/${r.total}`,
    `+${r.pointsEarned} pts · Streak ${streak}`,
  ].join('\n');
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
            value={extras > 0 ? `${accepted}  (+${extras} more accepted)` : accepted}
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
