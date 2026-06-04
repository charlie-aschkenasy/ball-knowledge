// ---------------------------------------------------------------------------
// Scoring logic, kept isolated so it is easy to change.
//
// Rule for this MVP: each correct answer is worth POINTS_PER_QUESTION.
// Wrong answers and timeouts award nothing (no penalty).
// ---------------------------------------------------------------------------

import { POINTS_PER_QUESTION } from '../config';
import type { MultipleChoiceQuestion, Question } from '../db/types';

/**
 * A player's answer to a single question.
 * `selectedIndex` is null when the question timed out with no selection.
 *
 * NOTE (phase 2): pre-rewrite this file only handles multiple_choice. Phase 7
 * widens to a per-format grader; this file gets replaced by domain/scoring.ts.
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
  return (
    question.type === 'multiple_choice' &&
    answer.selectedIndex === (question as MultipleChoiceQuestion).correctIndex
  );
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
