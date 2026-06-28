// ===========================================================================
// The signed-in app. Owns the play-flow state machine and all backend calls:
//   home  --Play-->  get-today  -->  quiz  --submit-->  results
//   home  -->  leaderboard
//
// No localStorage, no bots — every bit of play data is server-authoritative.
// ===========================================================================

import { useState } from 'react';
import PlayHome from './PlayHome';
import PlayQuiz from './PlayQuiz';
import PlayResults from './PlayResults';
import PlayLeaderboard from './PlayLeaderboard';
import {
  getToday,
  submitQuiz,
  AlreadyPlayedError,
  type ServerQuestion,
  type SelectedAnswers,
  type SubmitResult,
} from '../lib/api';

type Screen = 'home' | 'quiz' | 'results' | 'leaderboard' | 'already-played';

export default function PlayApp() {
  const [screen, setScreen] = useState<Screen>('home');
  const [questions, setQuestions] = useState<ServerQuestion[]>([]);
  const [startedAt, setStartedAt] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState<SelectedAnswers>({});
  const [result, setResult] = useState<SubmitResult | null>(null);

  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [homeError, setHomeError] = useState<string | null>(null);

  async function startQuiz() {
    setHomeError(null);
    setLoadingQuiz(true);
    try {
      const today = await getToday();
      setQuestions(today.questions);
      setStartedAt(today.started_at);
      setSelected({});
      setResult(null);
      setScreen('quiz');
    } catch (e) {
      setHomeError(e instanceof Error ? e.message : 'Could not load today’s quiz.');
    } finally {
      setLoadingQuiz(false);
    }
  }

  async function finishQuiz(answers: SelectedAnswers) {
    setSelected(answers);
    setSubmitting(true);
    try {
      const res = await submitQuiz(answers, startedAt);
      setResult(res);
      setScreen('results');
    } catch (e) {
      if (e instanceof AlreadyPlayedError) {
        setScreen('already-played');
      } else {
        setHomeError(e instanceof Error ? e.message : 'Could not submit your answers.');
        setScreen('home');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (screen === 'quiz') {
    return (
      <PlayQuiz questions={questions} onComplete={finishQuiz} submitting={submitting} />
    );
  }

  if (screen === 'results' && result) {
    return (
      <PlayResults
        result={result}
        questions={questions}
        selected={selected}
        onHome={() => setScreen('home')}
        onLeaderboards={() => setScreen('leaderboard')}
      />
    );
  }

  if (screen === 'leaderboard') {
    return <PlayLeaderboard onHome={() => setScreen('home')} />;
  }

  if (screen === 'already-played') {
    return (
      <div className="screen results">
        <header className="results-header">
          <span className="label">All set</span>
          <h1 className="results-headline">Already played today</h1>
        </header>
        <p style={{ color: 'var(--muted)', textAlign: 'center' }}>
          You’ve already submitted today’s quiz. Come back tomorrow for the next drop.
        </p>
        <button className="btn btn-secondary" onClick={() => setScreen('leaderboard')}>
          See the leaderboard
        </button>
        <button className="btn btn-ghost" onClick={() => setScreen('home')}>
          Back home
        </button>
      </div>
    );
  }

  return (
    <PlayHome
      onPlay={startQuiz}
      onLeaderboards={() => setScreen('leaderboard')}
      loadingQuiz={loadingQuiz}
      error={homeError}
    />
  );
}
