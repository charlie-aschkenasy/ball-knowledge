import { useMemo, useState } from 'react';
import { POINTS_PER_QUESTION } from './config';
import Atmosphere from './components/Atmosphere';
import Home from './screens/Home';
import Quiz, { type QuizAnswer } from './screens/Quiz';
import Results from './screens/Results';
import Leaderboards from './screens/Leaderboards';
import type { Question } from './db/types';
import { buildDailyQuiz } from './lib/quiz';
import type { QuizResult } from './lib/scoring';
import {
  hasPlayedToday,
  loadPlayer,
  resetToday,
  savePlayer,
  todayString,
} from './lib/storage';
import type { PlayerState } from './lib/storage';

type Screen = 'home' | 'quiz' | 'results' | 'leaderboard';

/**
 * Phase 8 shell: Atmosphere mounted under the app, new Quiz screen (format
 * dispatch + per-format timer + drop reveal) wired in. Scoring still writes
 * to the legacy single-bucket totalPoints (phase 9 replaces it with the
 * lifetime + seasonal split on top of the new DB). Home / Results /
 * Leaderboard screens are rewritten in phases 12 / 14 / 15.
 */
export default function App() {
  const [player, setPlayer] = useState<PlayerState>(() => loadPlayer());
  const [screen, setScreen] = useState<Screen>('home');
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [lastResult, setLastResult] = useState<QuizResult | null>(null);

  const playedToday = useMemo(() => hasPlayedToday(player), [player]);

  function startQuiz() {
    if (hasPlayedToday(player)) return;
    setQuizQuestions(buildDailyQuiz());
    setScreen('quiz');
  }

  function finishQuiz(quizAnswers: QuizAnswer[]) {
    const correctCount = quizAnswers.filter((a) => a.wasCorrect).length;
    const total = quizQuestions.length;
    const pointsEarned = correctCount * POINTS_PER_QUESTION;
    const updated: PlayerState = {
      totalPoints: player.totalPoints + pointsEarned,
      lastPlayedDate: todayString(),
      quizzesCompleted: player.quizzesCompleted + 1,
    };
    savePlayer(updated);
    setPlayer(updated);
    setLastResult({ correctCount, pointsEarned, total });
    setScreen('results');
  }

  function handleResetDay() {
    setPlayer(resetToday(player));
    setScreen('home');
  }

  return (
    <div className="app">
      <Atmosphere />

      {screen === 'home' && (
        <Home
          player={player}
          playedToday={playedToday}
          onPlay={startQuiz}
          onLeaderboard={() => setScreen('leaderboard')}
          onResetDay={handleResetDay}
        />
      )}

      {screen === 'quiz' && <Quiz questions={quizQuestions} onComplete={finishQuiz} />}

      {screen === 'results' && lastResult && (
        <Results
          result={lastResult}
          newTotal={player.totalPoints}
          onHome={() => setScreen('home')}
          onLeaderboard={() => setScreen('leaderboard')}
        />
      )}

      {screen === 'leaderboard' && (
        <Leaderboards onHome={() => setScreen('home')} />
      )}
    </div>
  );
}
