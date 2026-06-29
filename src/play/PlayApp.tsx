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
import PlayPropose from './PlayPropose';
import {
  getToday,
  submitQuiz,
  AlreadyPlayedError,
  NoDailySetError,
  WindowExpiredError,
  type ServerQuestion,
  type SelectedAnswers,
  type AnswerTimes,
  type SubmitResult,
} from '../lib/api';

type Screen =
  | 'home'
  | 'quiz'
  | 'results'
  | 'leaderboard'
  | 'propose'
  | 'already-played'
  | 'no-set'
  | 'expired';

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
      if (e instanceof NoDailySetError) {
        setScreen('no-set');
      } else {
        setHomeError(e instanceof Error ? e.message : 'Could not load today’s quiz.');
      }
    } finally {
      setLoadingQuiz(false);
    }
  }

  async function finishQuiz(answers: SelectedAnswers, times: AnswerTimes) {
    setSelected(answers);
    setSubmitting(true);
    try {
      const res = await submitQuiz(answers, startedAt, times);
      setResult(res);
      setScreen('results');
    } catch (e) {
      if (e instanceof AlreadyPlayedError) {
        setScreen('already-played');
      } else if (e instanceof WindowExpiredError) {
        setScreen('expired');
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

  if (screen === 'propose') {
    return <PlayPropose onHome={() => setScreen('home')} />;
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

  if (screen === 'no-set') {
    return (
      <div className="screen results">
        <header className="results-header">
          <span className="label">Hang tight</span>
          <h1 className="results-headline">Not live yet</h1>
        </header>
        <p style={{ color: 'var(--muted)', textAlign: 'center' }}>
          Today’s quiz isn’t live yet — check back soon.
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

  if (screen === 'expired') {
    return (
      <div className="screen results">
        <header className="results-header">
          <span className="label">Time’s up</span>
          <h1 className="results-headline">Quiz expired</h1>
        </header>
        <p style={{ color: 'var(--muted)', textAlign: 'center' }}>
          Your time ran out, so no score was recorded today. Come back tomorrow for the
          next drop.
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
      onPropose={() => setScreen('propose')}
      loadingQuiz={loadingQuiz}
      error={homeError}
    />
  );
}
