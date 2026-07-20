import type { QuestionType } from "@prisma/client";

/**
 * Pure quiz auto-grading (Constitution Principle IV; FR-018, SC-004).
 *
 * Grades objective question types deterministically from the question's correct
 * answers and the student's response, with no database access, so it can be
 * unit-tested exhaustively. Grading is all-or-nothing per question (full points
 * for a fully-correct answer, zero otherwise) — the simplest defensible rule for
 * v1; partial credit is a future extension.
 */

export type GradableOption = { id: string; isCorrect: boolean };

export type GradableQuestion = {
  id: string;
  type: QuestionType;
  points: number;
  /** Options for choice-based types (empty for SHORT_ANSWER). */
  options: GradableOption[];
  /** Accepted answer for SHORT_ANSWER (exact match, case/space-insensitive). */
  correctText?: string | null;
};

export type StudentAnswer = {
  questionId: string;
  selectedOptionIds: string[];
  answerText?: string | null;
};

export type QuestionResult = {
  questionId: string;
  awardedPoints: number;
  possiblePoints: number;
  correct: boolean;
};

export type GradeResult = {
  score: number; // 0–100 integer percentage
  passed: boolean;
  awardedTotal: number;
  possibleTotal: number;
  perQuestion: QuestionResult[];
};

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

function isAnswerCorrect(
  question: GradableQuestion,
  answer: StudentAnswer | undefined,
): boolean {
  if (!answer) return false;

  switch (question.type) {
    case "SHORT_ANSWER": {
      const expected = question.correctText ?? "";
      if (!expected.trim()) return false;
      return norm(answer.answerText ?? "") === norm(expected);
    }
    case "MULTIPLE_CHOICE":
    case "TRUE_FALSE": {
      const correct = question.options.filter((o) => o.isCorrect).map((o) => o.id);
      const selected = answer.selectedOptionIds;
      return (
        correct.length === 1 &&
        selected.length === 1 &&
        selected[0] === correct[0]
      );
    }
    case "MULTI_SELECT": {
      const correct = new Set(
        question.options.filter((o) => o.isCorrect).map((o) => o.id),
      );
      const selected = new Set(answer.selectedOptionIds);
      if (correct.size === 0) return false;
      if (correct.size !== selected.size) return false;
      for (const id of selected) if (!correct.has(id)) return false;
      return true;
    }
    default:
      return false;
  }
}

export function gradeQuiz(
  questions: GradableQuestion[],
  answers: StudentAnswer[],
  passingScore: number,
): GradeResult {
  const byQuestion = new Map(answers.map((a) => [a.questionId, a]));

  const perQuestion: QuestionResult[] = questions.map((q) => {
    const correct = isAnswerCorrect(q, byQuestion.get(q.id));
    return {
      questionId: q.id,
      awardedPoints: correct ? q.points : 0,
      possiblePoints: q.points,
      correct,
    };
  });

  const awardedTotal = perQuestion.reduce((s, r) => s + r.awardedPoints, 0);
  const possibleTotal = perQuestion.reduce((s, r) => s + r.possiblePoints, 0);
  const score =
    possibleTotal === 0 ? 0 : Math.round((awardedTotal / possibleTotal) * 100);

  return {
    score,
    passed: score >= passingScore,
    awardedTotal,
    possibleTotal,
    perQuestion,
  };
}
