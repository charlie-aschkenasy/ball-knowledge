// ===========================================================================
// Per-format grading. Each format file exports its own grade implementation;
// this module composes them into a single dispatcher used by the quiz flow.
// ===========================================================================

import { gradeMultipleChoice } from '../formats/multipleChoice';
import { gradeFillInBlank } from '../formats/fillInBlank';
import { gradeMatching } from '../formats/matching';
import type { AnswerValue, Question } from '../db/types';

/**
 * Returns true when `value` is a correct answer for `question`.
 *
 * A null value (timeout) or a kind mismatch counts as incorrect.
 */
export function gradeAnswer(question: Question, value: AnswerValue | null): boolean {
  if (!value) return false;
  switch (question.type) {
    case 'multiple_choice':
      return gradeMultipleChoice(question, value);
    case 'fill_in_blank':
      return gradeFillInBlank(question, value);
    case 'matching':
      return gradeMatching(question, value);
  }
}
