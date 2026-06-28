// ===========================================================================
// Results screen for the real flow. Everything shown here comes from the
// server's submit response (score, correct count, per-question recap). We pair
// each recap row with the question text + options we already have client-side
// so we can show the correct answer and what the player picked.
// ===========================================================================

import { useEffect, useState } from 'react';
import type { ServerQuestion, SelectedAnswers, SubmitResult, RecapItem } from '../lib/api';

interface Props {
  result: SubmitResult;
  questions: ServerQuestion[];
  selected: SelectedAnswers;
  onHome: () => void;
  onLeaderboards: () => void;
}

export default function PlayResults({
  result,
  questions,
  selected,
  onHome,
  onLeaderboards,
}: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(id);
  }, [copied]);

  const { correctCount, total, score } = result;
  let headline = 'Quiz complete';
  if (correctCount === total) headline = 'Perfect run';
  else if (correctCount === 0) headline = 'Rough one';
  else if (correctCount >= Math.ceil(total / 2)) headline = 'Solid showing';

  const byId = new Map(questions.map((q) => [q.id, q]));

  function handleShare() {
    const grid = result.recap.map((r) => (r.wasCorrect ? '🟩' : '⬜')).join('');
    const text = [
      `Ball Knowledge · ${result.play_date}`,
      `${grid} ${correctCount}/${total}`,
      `${score} pts`,
    ].join('\n');
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => setCopied(true),
        () => setCopied(true),
      );
    } else {
      window.prompt('Copy your result:', text);
      setCopied(true);
    }
  }

  return (
    <div className="screen results">
      <header className="results-header">
        <span className="label">{result.play_date}</span>
        <h1 className="results-headline">{headline}</h1>
      </header>

      <div className="stats-grid">
        <StatTile label="Correct" big={`${correctCount}/${total}`} />
        <StatTile label="Points" big={`${score}`} />
      </div>

      {result.recap.length > 0 && (
        <RecapSection recap={result.recap} byId={byId} selected={selected} />
      )}

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
    </div>
  );
}

// ---------------------------------------------------------------------------

function RecapSection({
  recap,
  byId,
  selected,
}: {
  recap: RecapItem[];
  byId: Map<string, ServerQuestion>;
  selected: SelectedAnswers;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const open = openIndex !== null ? recap[openIndex] : null;
  const openQuestion = open ? byId.get(open.questionId) : undefined;

  return (
    <section className="recap" aria-label="Per-question review">
      <span className="label" style={{ alignSelf: 'flex-start' }}>
        Review
      </span>
      <div className="recap-tiles" role="tablist">
        {recap.map((item, i) => {
          const ok = item.wasCorrect;
          const isOpen = i === openIndex;
          return (
            <button
              key={item.questionId}
              role="tab"
              aria-pressed={isOpen}
              className={`recap-tile ${ok ? 'ok' : 'bad'} ${isOpen ? 'open' : ''}`}
              onClick={() => setOpenIndex(isOpen ? null : i)}
            >
              <span className="recap-tile-label">Question</span>
              <span className="recap-tile-num">{i + 1}</span>
              <span className="recap-tile-mark">{ok ? '✓' : '✗'}</span>
            </button>
          );
        })}
      </div>

      {open && openQuestion && openIndex !== null && (
        <article className={`recap-detail ${open.wasCorrect ? 'ok' : 'bad'}`}>
          <header className="recap-card-head">
            <span className="recap-q">Question {openIndex + 1}</span>
            <span className={`recap-status ${open.wasCorrect ? 'ok' : 'bad'}`}>
              {open.wasCorrect ? '✓ Correct' : '✗ Wrong'}
            </span>
          </header>
          <p className="recap-text">{openQuestion.prompt}</p>
          <RecapBody item={open} question={openQuestion} selected={selected} />
        </article>
      )}
    </section>
  );
}

function RecapBody({
  item,
  question,
  selected,
}: {
  item: RecapItem;
  question: ServerQuestion;
  selected: SelectedAnswers;
}) {
  const options = question.options ?? [];
  const pickedIndex = selected[item.questionId];
  const pickedText =
    pickedIndex !== null && pickedIndex !== undefined ? options[pickedIndex] : null;

  // Multiple choice: show the correct option (from correctIndex) and the pick.
  if (item.correctIndex !== null && item.correctIndex !== undefined) {
    const correctText = options[item.correctIndex] ?? `Option ${item.correctIndex + 1}`;
    return (
      <>
        <RecapLine label="Correct" value={correctText} kind="correct" />
        <RecapLine
          label="You"
          value={pickedText ?? 'No answer.'}
          kind={item.wasCorrect ? 'correct' : 'wrong'}
        />
      </>
    );
  }

  // Fill-in-blank: server sends acceptableAnswers.
  if (item.acceptableAnswers && item.acceptableAnswers.length > 0) {
    return (
      <RecapLine
        label="Accepted"
        value={item.acceptableAnswers.join(', ')}
        kind="correct"
      />
    );
  }

  // Matching: server sends the correct pairs.
  if (item.pairs && item.pairs.length > 0) {
    return (
      <div className="recap-line">
        <span className="recap-line-label">Pairs</span>
        <ul className="recap-pairs">
          {item.pairs.map((p) => (
            <li key={p.left}>
              <span>{p.left}</span>
              <span className="recap-arrow">→</span>
              <span>{p.right}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <RecapLine
      label="Result"
      value={item.wasCorrect ? 'Correct' : 'Wrong'}
      kind={item.wasCorrect ? 'correct' : 'wrong'}
    />
  );
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

function StatTile({ label, big }: { label: string; big: string }) {
  return (
    <div className="stat-tile">
      <span className="stat-tile-big">{big}</span>
      <span className="stat-tile-label">{label}</span>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
