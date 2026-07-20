import { db } from "@/server/db";
import { authorize, type Principal } from "@/server/access/policy";
import { NotFoundError, AppError } from "@/server/http";
import {
  gradeQuiz,
  type GradableQuestion,
  type StudentAnswer,
} from "@/server/services/grading-calc";
import { assertQuizReady } from "@/server/services/quiz";
import { submitAttemptSchema, type SubmitAttemptInput } from "@/lib/validation";

/** Load a quiz + the acting student's enrollment, authorizing an attempt. */
async function loadQuizForAttempt(principal: Principal, quizId: string) {
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      title: true,
      timeLimitSec: true,
      maxAttempts: true,
      passingScore: true,
      shuffleQuestions: true,
      showAnswersAfter: true,
      lesson: { select: { module: { select: { courseId: true } } } },
    },
  });
  if (!quiz) throw new NotFoundError("Quiz not found.");
  const courseId = quiz.lesson.module.courseId;

  const enrollment = await db.enrollment.findUnique({
    where: { studentId_courseId: { studentId: principal.id, courseId } },
    select: { id: true, studentId: true },
  });
  if (!enrollment) {
    throw new AppError("Enrol in the course to take this quiz.", 403, "NOT_ENROLLED");
  }
  authorize(principal, {
    type: "quiz:attempt",
    enrollment: { studentId: enrollment.studentId },
  });
  return { quiz, enrollmentId: enrollment.id };
}

/** Sanitized question shape sent to the student — never includes isCorrect. */
export type AttemptQuestion = {
  id: string;
  type: string;
  prompt: string;
  points: number;
  options: { id: string; text: string }[];
};

/**
 * Start (or resume) an attempt. Enforces the attempt limit and records
 * server-authoritative start time. Returns the attempt and the sanitized
 * questions (correct answers stripped).
 */
export async function startAttempt(principal: Principal, quizId: string) {
  const { quiz, enrollmentId } = await loadQuizForAttempt(principal, quizId);
  await assertQuizReady(quizId);

  // Resume an in-progress attempt if one exists.
  const existing = await db.quizAttempt.findFirst({
    where: { quizId, studentId: principal.id, status: "IN_PROGRESS" },
    orderBy: { attemptNumber: "desc" },
  });

  let attempt = existing;
  if (!attempt) {
    const used = await db.quizAttempt.count({
      where: { quizId, studentId: principal.id },
    });
    if (quiz.maxAttempts != null && used >= quiz.maxAttempts) {
      throw new AppError(
        `You have used all ${quiz.maxAttempts} attempts.`,
        403,
        "ATTEMPTS_EXHAUSTED",
      );
    }
    attempt = await db.quizAttempt.create({
      data: {
        quizId,
        studentId: principal.id,
        enrollmentId,
        attemptNumber: used + 1,
        status: "IN_PROGRESS",
      },
    });
  }

  const questions = await loadSanitizedQuestions(quizId, quiz.shuffleQuestions);
  const deadline =
    quiz.timeLimitSec != null
      ? new Date(attempt.startedAt.getTime() + quiz.timeLimitSec * 1000)
      : null;

  return {
    attemptId: attempt.id,
    quizId,
    title: quiz.title,
    startedAt: attempt.startedAt,
    deadline,
    timeLimitSec: quiz.timeLimitSec,
    attemptNumber: attempt.attemptNumber,
    questions,
  };
}

async function loadSanitizedQuestions(
  quizId: string,
  shuffle: boolean,
): Promise<AttemptQuestion[]> {
  const questions = await db.question.findMany({
    where: { quizId },
    orderBy: { order: "asc" },
    select: {
      id: true,
      type: true,
      prompt: true,
      points: true,
      options: {
        orderBy: { order: "asc" },
        select: { id: true, text: true }, // isCorrect intentionally omitted
      },
    },
  });
  const mapped = questions.map((q) => ({
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    points: q.points,
    options: q.options,
  }));
  return shuffle ? stableShuffle(mapped) : mapped;
}

/** Deterministic-enough shuffle without Math.random dependency at import. */
function stableShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor((i * 2654435761) % (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * Submit an attempt for grading. Uses server time to enforce the time limit; a
 * late submission is still graded on whatever answers were captured (FR-019).
 * Objective grading is computed server-side only (FR-018).
 */
export async function submitAttempt(
  principal: Principal,
  attemptId: string,
  input: SubmitAttemptInput,
) {
  const parsed = submitAttemptSchema.parse(input);

  const attempt = await db.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        select: {
          id: true,
          passingScore: true,
          timeLimitSec: true,
          showAnswersAfter: true,
        },
      },
    },
  });
  if (!attempt) throw new NotFoundError("Attempt not found.");
  authorize(principal, {
    type: "quiz:attempt",
    enrollment: { studentId: attempt.studentId },
  });
  if (attempt.status !== "IN_PROGRESS") {
    throw new AppError("This attempt has already been submitted.", 409, "ALREADY_SUBMITTED");
  }

  // Server-authoritative expiry check.
  const now = new Date();
  const expired =
    attempt.quiz.timeLimitSec != null &&
    now.getTime() > attempt.startedAt.getTime() + attempt.quiz.timeLimitSec * 1000;

  const questions = await db.question.findMany({
    where: { quizId: attempt.quiz.id },
    include: { options: { select: { id: true, isCorrect: true } } },
  });

  const gradable: GradableQuestion[] = questions.map((q) => ({
    id: q.id,
    type: q.type,
    points: q.points,
    options: q.options,
    correctText: q.correctText,
  }));
  const answers: StudentAnswer[] = parsed.answers.map((a) => ({
    questionId: a.questionId,
    selectedOptionIds: a.selectedOptionIds,
    answerText: a.answerText ?? null,
  }));

  const result = gradeQuiz(gradable, answers, attempt.quiz.passingScore);
  const awardedByQuestion = new Map(
    result.perQuestion.map((r) => [r.questionId, r.awardedPoints]),
  );

  await db.$transaction([
    ...answers.map((a) =>
      db.attemptAnswer.upsert({
        where: {
          attemptId_questionId: { attemptId, questionId: a.questionId },
        },
        update: {
          selectedOptionIds: a.selectedOptionIds,
          answerText: a.answerText,
          awardedPoints: awardedByQuestion.get(a.questionId) ?? 0,
        },
        create: {
          attemptId,
          questionId: a.questionId,
          selectedOptionIds: a.selectedOptionIds,
          answerText: a.answerText,
          awardedPoints: awardedByQuestion.get(a.questionId) ?? 0,
        },
      }),
    ),
    db.quizAttempt.update({
      where: { id: attemptId },
      data: {
        status: expired ? "EXPIRED" : "GRADED",
        score: result.score,
        passed: result.passed,
        submittedAt: now,
      },
    }),
  ]);

  // Notify the student their result is ready.
  await db.notification
    .create({
      data: {
        userId: principal.id,
        type: "GRADE_POSTED",
        title: result.passed ? "Quiz passed" : "Quiz graded",
        body: `You scored ${result.score}%.`,
      },
    })
    .catch(() => undefined);

  return {
    attemptId,
    score: result.score,
    passed: result.passed,
    expired,
    showAnswers: attempt.quiz.showAnswersAfter,
    perQuestion: result.perQuestion,
  };
}

/** Prior attempts for a student on a quiz (for the "attempts used" display). */
export async function listAttempts(principal: Principal, quizId: string) {
  return db.quizAttempt.findMany({
    where: { quizId, studentId: principal.id },
    orderBy: { attemptNumber: "asc" },
    select: {
      id: true,
      attemptNumber: true,
      status: true,
      score: true,
      passed: true,
      submittedAt: true,
    },
  });
}
