// ---------------------------------------------------------------------------
// Scoring logic, kept isolated so it is easy to change.
//
// Rule for this MVP: each correct answer is worth POINTS_PER_QUESTION.
// Wrong answers and timeouts award nothing (no penalty).
// ---------------------------------------------------------------------------

import { POINTS_PER_QUESTION } from '../config';
import type { Question } from '../data/questions';

/**
 * A player's answer to a single question.
 * `selectedIndex` is null when the question timed out with no selection.
 */
export interface Answer {
  questionId: string;
  selectedIndex: number | null;
}

export interface QuizResult {
  correctCount: number;
  pointsEarned: number;
  total: number;
}

export function isCorrect(question: Question, answer: Answer): boolean {
  return answer.selectedIndex === question.correctIndex;
}

export function scoreQuiz(questions: Question[], answers: Answer[]): QuizResult {
  const byId = new Map(questions.map((q) => [q.id, q]));
  let correctCount = 0;

  for (const answer of answers) {
    const question = byId.get(answer.questionId);
    if (question && isCorrect(question, answer)) {
      correctCount += 1;
    }
  }

  return {
    correctCount,
    pointsEarned: correctCount * POINTS_PER_QUESTION,
    total: questions.length,
  };
}
