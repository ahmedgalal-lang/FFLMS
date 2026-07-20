import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/server/db";
import type { Principal } from "@/server/access/policy";
import { AuthorizationError } from "@/server/access/policy";
import { createCourse } from "@/server/services/course";
import { addModule, addLesson } from "@/server/services/curriculum";
import { publishCourse } from "@/server/services/publish";
import { enroll } from "@/server/services/enrollment";
import { markLessonComplete } from "@/server/services/progress";
import { upsertLessonQuiz, addQuestion } from "@/server/services/quiz";
import { startAttempt, submitAttempt } from "@/server/services/attempt";
import { upsertLessonAssignment } from "@/server/services/assignment";
import { submitAssignment, gradeSubmission } from "@/server/services/submission";
import { getGradebook } from "@/server/services/gradebook";
import { verifyCertificate } from "@/server/services/certificate";

let instructor: Principal;
let otherInstructor: Principal;
let student: Principal;
let courseId: string;
let quizId: string;
let quizQ: string;
let quizCorrect: string;
let assignmentId: string;
const userIds: string[] = [];

beforeAll(async () => {
  const suffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const i = await db.user.create({ data: { email: `gi-${suffix}@t.test`, name: "GI", role: "INSTRUCTOR" } });
  const o = await db.user.create({ data: { email: `go-${suffix}@t.test`, name: "GO", role: "INSTRUCTOR" } });
  const s = await db.user.create({ data: { email: `gs-${suffix}@t.test`, name: "Grace Student", role: "STUDENT" } });
  userIds.push(i.id, o.id, s.id);
  instructor = { id: i.id, role: "INSTRUCTOR", status: "ACTIVE" };
  otherInstructor = { id: o.id, role: "INSTRUCTOR", status: "ACTIVE" };
  student = { id: s.id, role: "STUDENT", status: "ACTIVE" };

  const course = await createCourse(instructor, {
    title: "Gradebook Course",
    summary: "Course for gradebook integration tests.",
    description: "",
  });
  courseId = course.id;
  const mod = await addModule(instructor, course.id, "M1");
  const lQuiz = await addLesson(instructor, mod.id, "Quiz lesson");
  const lAsg = await addLesson(instructor, mod.id, "Assignment lesson");
  await publishCourse(instructor, course.id);
  await enroll(student, course.id);

  const quiz = await upsertLessonQuiz(instructor, lQuiz.id, {
    title: "Quiz One",
    passingScore: 50,
  });
  quizId = quiz.id;
  const q = await addQuestion(instructor, quizId, {
    type: "MULTIPLE_CHOICE",
    prompt: "Pick correct",
    points: 1,
    options: [
      { text: "right", isCorrect: true },
      { text: "wrong", isCorrect: false },
    ],
  });
  quizQ = q.id;
  quizCorrect = q.options.find((o) => o.text === "right")!.id;

  const asg = await upsertLessonAssignment(instructor, lAsg.id, {
    title: "Essay",
    maxPoints: 50,
  });
  assignmentId = asg.id;
});

afterAll(async () => {
  await db.course.deleteMany({ where: { id: courseId } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("gradebook (US5, FR-022)", () => {
  it("aggregates quiz and assignment scores per student", async () => {
    // Student aces the quiz (100%) and gets 40/50 on the assignment (80%).
    const attempt = await startAttempt(student, quizId);
    await submitAttempt(student, attempt.attemptId, {
      answers: [{ questionId: quizQ, selectedOptionIds: [quizCorrect] }],
    });
    await submitAssignment(student, assignmentId, { text: "my essay" });
    const sub = await db.submission.findFirstOrThrow({
      where: { assignmentId, studentId: student.id },
    });
    await gradeSubmission(instructor, sub.id, { score: 40 });

    const gb = await getGradebook(instructor, courseId);
    expect(gb.assessments).toHaveLength(2);
    const row = gb.rows.find((r) => r.student.id === student.id)!;
    expect(row.cells[quizId]?.percent).toBe(100);
    expect(row.cells[assignmentId]?.percent).toBe(80); // 40/50
    expect(row.cells[assignmentId]?.label).toBe("40/50");
    expect(row.average).toBe(90); // (100 + 80) / 2
  });

  it("prevents a non-owner instructor from reading the gradebook", async () => {
    await expect(getGradebook(otherInstructor, courseId)).rejects.toBeInstanceOf(
      AuthorizationError,
    );
  });

  it("prevents a student from reading the gradebook", async () => {
    await expect(getGradebook(student, courseId)).rejects.toBeInstanceOf(
      AuthorizationError,
    );
  });

  it("issues a verifiable certificate on course completion", async () => {
    // Complete all required lessons so the course completes and a cert issues.
    const lessons = await db.lesson.findMany({
      where: { module: { courseId }, deletedAt: null },
    });
    for (const l of lessons) await markLessonComplete(student, l.id);

    const cert = await db.certificate.findUniqueOrThrow({
      where: { studentId_courseId: { studentId: student.id, courseId } },
    });
    const verdict = await verifyCertificate(cert.verificationCode);
    expect(verdict.valid).toBe(true);
    if (verdict.valid) {
      expect(verdict.holderName).toBe("Grace Student");
      expect(verdict.courseTitle).toBe("Gradebook Course");
    }

    // A bogus code verifies as invalid.
    const bogus = await verifyCertificate("does-not-exist");
    expect(bogus).toEqual({ valid: false, reason: "NOT_FOUND" });
  });
});
