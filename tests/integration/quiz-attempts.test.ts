import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/server/db";
import type { Principal } from "@/server/access/policy";
import { AppError } from "@/server/http";
import { createCourse } from "@/server/services/course";
import { addModule, addLesson } from "@/server/services/curriculum";
import { publishCourse } from "@/server/services/publish";
import { enroll } from "@/server/services/enrollment";
import { upsertLessonQuiz, addQuestion } from "@/server/services/quiz";
import { startAttempt, submitAttempt } from "@/server/services/attempt";

let instructor: Principal;
let student: Principal;
let courseId: string;

// Limited quiz (maxAttempts = 2) on lesson 1.
let limitedQuizId: string;
let limitedQ: string;
let limitedCorrect: string;

// Timed quiz (1s) on lesson 2.
let timedQuizId: string;
let timedQ: string;
let timedCorrect: string;

const userIds: string[] = [];

beforeAll(async () => {
  const suffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const i = await db.user.create({
    data: { email: `qi-${suffix}@t.test`, name: "QI", role: "INSTRUCTOR" },
  });
  const s = await db.user.create({
    data: { email: `qs-${suffix}@t.test`, name: "QS", role: "STUDENT" },
  });
  userIds.push(i.id, s.id);
  instructor = { id: i.id, role: "INSTRUCTOR", status: "ACTIVE" };
  student = { id: s.id, role: "STUDENT", status: "ACTIVE" };

  const course = await createCourse(instructor, {
    title: "Quiz Test Course",
    summary: "Course for quiz attempt integration tests.",
    description: "",
  });
  courseId = course.id;
  const mod = await addModule(instructor, course.id, "M1");
  const lesson1 = await addLesson(instructor, mod.id, "L1");
  const lesson2 = await addLesson(instructor, mod.id, "L2");
  await publishCourse(instructor, course.id);
  await enroll(student, course.id);

  const limited = await upsertLessonQuiz(instructor, lesson1.id, {
    title: "Limited Quiz",
    passingScore: 50,
    maxAttempts: 2,
  });
  limitedQuizId = limited.id;
  const q1 = await addQuestion(instructor, limitedQuizId, {
    type: "MULTIPLE_CHOICE",
    prompt: "2 + 2 = ?",
    points: 1,
    options: [
      { text: "3", isCorrect: false },
      { text: "4", isCorrect: true },
    ],
  });
  limitedQ = q1.id;
  limitedCorrect = q1.options.find((o) => o.text === "4")!.id;

  const timed = await upsertLessonQuiz(instructor, lesson2.id, {
    title: "Timed Quiz",
    passingScore: 50,
    timeLimitSec: 1,
  });
  timedQuizId = timed.id;
  const q2 = await addQuestion(instructor, timedQuizId, {
    type: "TRUE_FALSE",
    prompt: "The sky is blue.",
    points: 1,
    options: [
      { text: "True", isCorrect: true },
      { text: "False", isCorrect: false },
    ],
  });
  timedQ = q2.id;
  timedCorrect = q2.options.find((o) => o.text === "True")!.id;
});

afterAll(async () => {
  await db.course.deleteMany({ where: { id: courseId } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("quiz attempts (US3, FR-018/019)", () => {
  it("does not leak correct answers to the student", async () => {
    const started = await startAttempt(student, limitedQuizId);
    expect(started.questions[0]?.options[0]).not.toHaveProperty("isCorrect");
  });

  it("grades a correct submission (attempt #1) and records pass", async () => {
    const started = await startAttempt(student, limitedQuizId); // resumes #1
    const res = await submitAttempt(student, started.attemptId, {
      answers: [{ questionId: limitedQ, selectedOptionIds: [limitedCorrect] }],
    });
    expect(res.score).toBe(100);
    expect(res.passed).toBe(true);
  });

  it("enforces the attempt limit after all attempts are used", async () => {
    const a2 = await startAttempt(student, limitedQuizId); // attempt #2
    await submitAttempt(student, a2.attemptId, {
      answers: [{ questionId: limitedQ, selectedOptionIds: [] }],
    });
    await expect(startAttempt(student, limitedQuizId)).rejects.toMatchObject({
      code: "ATTEMPTS_EXHAUSTED",
    });
  });

  it("blocks re-submitting an already-graded attempt", async () => {
    const graded = await db.quizAttempt.findFirstOrThrow({
      where: { quizId: limitedQuizId, studentId: student.id, status: "GRADED" },
    });
    await expect(
      submitAttempt(student, graded.id, { answers: [] }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("marks an attempt EXPIRED when the time limit has elapsed (server time)", async () => {
    const started = await startAttempt(student, timedQuizId);
    // Back-date the server-recorded start beyond the 1s limit.
    await db.quizAttempt.update({
      where: { id: started.attemptId },
      data: { startedAt: new Date(Date.now() - 10_000) },
    });
    const res = await submitAttempt(student, started.attemptId, {
      answers: [{ questionId: timedQ, selectedOptionIds: [timedCorrect] }],
    });
    expect(res.expired).toBe(true);
    // Answers captured so far are still graded.
    expect(res.score).toBe(100);
    const persisted = await db.quizAttempt.findUniqueOrThrow({
      where: { id: started.attemptId },
    });
    expect(persisted.status).toBe("EXPIRED");
  });
});
