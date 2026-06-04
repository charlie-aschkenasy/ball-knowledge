import { useMemo, useState } from 'react';
import Home from './screens/Home';
import Quiz from './screens/Quiz';
import Results from './screens/Results';
import Leaderboard from './screens/Leaderboard';
import type { Question } from './data/questions';
import { buildDailyQuiz } from './lib/quiz';
import { scoreQuiz } from './lib/scoring';
import type { Answer, QuizResult } from './lib/scoring';
import {
  hasPlayedToday,
  loadPlayer,
  resetToday,
  savePlayer,
  todayString,
} from './lib/storage';
import type { PlayerState } from './lib/storage';

type Screen = 'home' | 'quiz' | 'results' | 'leaderboard';

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

  function finishQuiz(answers: Answer[]) {
    const result = scoreQuiz(quizQuestions, answers);
    const updated: PlayerState = {
      totalPoints: player.totalPoints + result.pointsEarned,
      lastPlayedDate: todayString(),
      quizzesCompleted: player.quizzesCompleted + 1,
    };
    savePlayer(updated);
    setPlayer(updated);
    setLastResult(result);
    setScreen('results');
  }

  function handleResetDay() {
    setPlayer(resetToday(player));
    setScreen('home');
  }

  return (
    <div className="app">
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
        <Leaderboard playerPoints={player.totalPoints} onHome={() => setScreen('home')} />
      )}
    </div>
  );
}
