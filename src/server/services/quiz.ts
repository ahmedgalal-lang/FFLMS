import { db } from "@/server/db";
import { authorize, type Principal } from "@/server/access/policy";
import { NotFoundError, AppError } from "@/server/http";
import { loadCourseForAuthz } from "@/server/services/course";
import {
  quizSettingsSchema,
  questionInputSchema,
  type QuizSettingsInput,
  type QuestionInput,
} from "@/lib/validation";

/** Resolve the course that owns a lesson and authorize quiz management. */
async function authorizeLessonQuiz(principal: Principal, lessonId: string) {
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, deletedAt: null },
    select: { id: true, module: { select: { courseId: true } } },
  });
  if (!lesson) throw new NotFoundError("Lesson not found.");
  const course = await loadCourseForAuthz(lesson.module.courseId);
  authorize(principal, { type: "quiz:manage", course });
  return lesson;
}

async function authorizeQuiz(principal: Principal, quizId: string) {
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, lessonId: true, lesson: { select: { module: { select: { courseId: true } } } } },
  });
  if (!quiz) throw new NotFoundError("Quiz not found.");
  const course = await loadCourseForAuthz(quiz.lesson.module.courseId);
  authorize(principal, { type: "quiz:manage", course });
  return quiz;
}

/** Create or update the quiz attached to a lesson (one per lesson). */
export async function upsertLessonQuiz(
  principal: Principal,
  lessonId: string,
  input: QuizSettingsInput,
) {
  await authorizeLessonQuiz(principal, lessonId);
  const data = quizSettingsSchema.parse(input);
  return db.quiz.upsert({
    where: { lessonId },
    update: {
      title: data.title,
      passingScore: data.passingScore,
      timeLimitSec: data.timeLimitSec ?? null,
      maxAttempts: data.maxAttempts ?? null,
      shuffleQuestions: data.shuffleQuestions ?? false,
      showAnswersAfter: data.showAnswersAfter ?? true,
    },
    create: {
      lessonId,
      title: data.title,
      passingScore: data.passingScore,
      timeLimitSec: data.timeLimitSec ?? null,
      maxAttempts: data.maxAttempts ?? null,
      shuffleQuestions: data.shuffleQuestions ?? false,
      showAnswersAfter: data.showAnswersAfter ?? true,
    },
  });
}

export async function deleteQuiz(principal: Principal, quizId: string) {
  await authorizeQuiz(principal, quizId);
  await db.quiz.delete({ where: { id: quizId } });
}

/** Append a question (with options) to a quiz. */
export async function addQuestion(
  principal: Principal,
  quizId: string,
  input: QuestionInput,
) {
  await authorizeQuiz(principal, quizId);
  const data = questionInputSchema.parse(input);
  const count = await db.question.count({ where: { quizId } });

  return db.question.create({
    data: {
      quizId,
      type: data.type,
      prompt: data.prompt,
      points: data.points,
      order: count,
      correctText: data.type === "SHORT_ANSWER" ? (data.correctText ?? null) : null,
      options:
        data.type === "SHORT_ANSWER"
          ? undefined
          : {
              create: data.options.map((o, i) => ({
                text: o.text,
                isCorrect: o.isCorrect,
                order: i,
              })),
            },
    },
    include: { options: { orderBy: { order: "asc" } } },
  });
}

export async function deleteQuestion(principal: Principal, questionId: string) {
  const question = await db.question.findUnique({
    where: { id: questionId },
    select: { quizId: true },
  });
  if (!question) throw new NotFoundError("Question not found.");
  await authorizeQuiz(principal, question.quizId);
  await db.question.delete({ where: { id: questionId } });
}

/** Full quiz (with correct answers) for the instructor builder. */
export async function getQuizForEditing(principal: Principal, quizId: string) {
  await authorizeQuiz(principal, quizId);
  return db.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  });
}

/** Lesson (with its quiz, if any) for the instructor quiz builder page. */
export async function getLessonQuizForEditing(
  principal: Principal,
  lessonId: string,
) {
  const lesson = await authorizeLessonQuiz(principal, lessonId);
  const full = await db.lesson.findUnique({
    where: { id: lesson.id },
    select: {
      id: true,
      title: true,
      module: { select: { courseId: true } },
      quiz: {
        include: {
          questions: {
            orderBy: { order: "asc" },
            include: { options: { orderBy: { order: "asc" } } },
          },
        },
      },
    },
  });
  return full;
}

/** Guard used before publishing/attempting: a quiz needs ≥1 question. */
export async function assertQuizReady(quizId: string) {
  const count = await db.question.count({ where: { quizId } });
  if (count === 0) {
    throw new AppError("This quiz has no questions yet.", 422, "QUIZ_EMPTY");
  }
}
