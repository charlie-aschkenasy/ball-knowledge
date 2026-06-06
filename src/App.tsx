// ===========================================================================
// App shell + screen routing.
//
// All play-flow state lives in the new DB / store. Screen transitions are a
// small state machine; the play flow uses selectDailyQuiz + applyQuizResult.
// Title-taken celebrations are computed by diffing computeTitleHolders before
// and after applying the quiz.
// ===========================================================================

import { useCallback, useState } from 'react';
import AdminResetButton from './components/AdminResetButton';
import Atmosphere from './components/Atmosphere';
import Home from './screens/Home';
import Quiz, { type QuizAnswer } from './screens/Quiz';
import Results from './screens/Results';
import Leaderboards from './screens/Leaderboards';
import Groups from './screens/Groups';
import GroupDetail from './screens/GroupDetail';
import Dev from './screens/Dev';
import { QUESTIONS } from './data/questions';
import {
  useBKStore,
  useDB,
  useHumanProfile,
  useHumanStats,
} from './db/store';
import type { Question, Sport } from './db/types';
import { applyQuizResult, type QuizAnswerInput } from './domain/scoring';
import { rollDay } from './domain/season';
import { selectDailyQuiz } from './domain/selection';
import { projectLiveTick } from './domain/time';
import { computeTitleHolders, newlyTakenTitles } from './domain/titles';
import { useGameClock } from './hooks/useGameClock';

type Screen =
  | 'home'
  | 'quiz'
  | 'results'
  | 'leaderboard'
  | 'groups'
  | 'group-detail'
  | 'dev';

export interface RecapItem {
  question: Question;
  answer: QuizAnswer;
}

export interface LastResult {
  correctCount: number;
  total: number;
  pointsEarned: number;
  newLifetime: number;
  newSeasonal: number;
  titlesTaken: Sport[];
  recap: RecapItem[];
}

export default function App() {
  const db = useDB();
  const human = useHumanProfile();
  const humanStats = useHumanStats();
  const setDB = useBKStore((s) => s.setDB);

  const [screen, setScreen] = useState<Screen>('home');
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  // Live-mode catch-up: every interval/focus, project against the wall clock
  // and run rollDay() once per elapsed game day. The 'one rollDay per elapsed
  // day' invariant lives here AND in advanceDays — never bumps currentDay.
  const tickLive = useCallback(() => {
    const current = useBKStore.getState().db;
    if (!current || current.time.mode !== 'live') return;
    const { daysElapsed, settledTime } = projectLiveTick(current.time, new Date());
    if (daysElapsed === 0) {
      if (current.time.currentWindow !== settledTime.currentWindow) {
        setDB({
          ...current,
          time: { ...current.time, currentWindow: settledTime.currentWindow },
        });
      }
      return;
    }
    let next = current;
    for (let i = 0; i < daysElapsed; i++) {
      next = rollDay(next, QUESTIONS);
    }
    setDB({
      ...next,
      time: { ...next.time, currentWindow: settledTime.currentWindow },
    });
  }, [setDB]);
  useGameClock(db?.time ?? null, tickLive);

  if (!db || !human || !humanStats) {
    return (
      <div className="app">
        <Atmosphere />
      </div>
    );
  }

  function startQuiz() {
    if (!db || !human || !humanStats) return;
    const quiz = selectDailyQuiz(human, humanStats.recentlySeenQuestionIds, QUESTIONS, db);
    setQuizQuestions(quiz);
    setScreen('quiz');
  }

  function finishQuiz(answers: QuizAnswer[]) {
    if (!db) return;
    const titlesBefore = computeTitleHolders(db, { kind: 'world' });

    const input: QuizAnswerInput[] = answers.map((a) => ({
      questionId: a.questionId,
      value: a.value,
      wasCorrect: a.wasCorrect,
    }));
    const result = applyQuizResult(db, db.humanPlayerId, input, quizQuestions);
    setDB(result.db);

    const titlesAfter = computeTitleHolders(result.db, { kind: 'world' });
    const taken = newlyTakenTitles(titlesBefore, titlesAfter, result.db.humanPlayerId);

    const newStats = result.db.stats.find((s) => s.playerId === result.db.humanPlayerId);
    if (!newStats) return;
    // Zip questions with answers in commit order. Quiz commits sequentially,
    // so answers[i] always corresponds to quizQuestions[i].
    const recap: RecapItem[] = quizQuestions.map((q, i) => ({
      question: q,
      answer: answers[i],
    }));

    setLastResult({
      correctCount: result.correctCount,
      total: result.total,
      pointsEarned: result.pointsEarned,
      newLifetime: newStats.lifetimePoints,
      newSeasonal: newStats.seasonalScore,
      titlesTaken: taken,
      recap,
    });
    setScreen('results');
  }

  return (
    <div className="app">
      <Atmosphere />

      {screen !== 'quiz' && (
        <AdminResetButton onReset={() => setScreen('home')} />
      )}

      {screen === 'home' && (
        <Home
          onPlay={startQuiz}
          onLeaderboards={() => setScreen('leaderboard')}
          onGroups={() => setScreen('groups')}
          onDev={() => setScreen('dev')}
        />
      )}

      {screen === 'quiz' && <Quiz questions={quizQuestions} onComplete={finishQuiz} />}

      {screen === 'results' && lastResult && (
        <Results
          result={lastResult}
          onHome={() => setScreen('home')}
          onLeaderboards={() => setScreen('leaderboard')}
        />
      )}

      {screen === 'leaderboard' && (
        <Leaderboards onHome={() => setScreen('home')} />
      )}

      {screen === 'groups' && (
        <Groups
          onHome={() => setScreen('home')}
          onOpen={(id) => {
            setActiveGroupId(id);
            setScreen('group-detail');
          }}
        />
      )}

      {screen === 'group-detail' && activeGroupId && (
        <GroupDetail groupId={activeGroupId} onBack={() => setScreen('groups')} />
      )}

      {screen === 'dev' && <Dev onHome={() => setScreen('home')} />}
    </div>
  );
}
