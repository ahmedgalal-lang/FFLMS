import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/server/db";
import type { Principal } from "@/server/access/policy";
import { AuthorizationError } from "@/server/access/policy";
import { AppError } from "@/server/http";
import { createCourse } from "@/server/services/course";
import { addModule, addLesson } from "@/server/services/curriculum";
import { publishCourse } from "@/server/services/publish";
import { enroll } from "@/server/services/enrollment";
import { upsertLessonAssignment } from "@/server/services/assignment";
import {
  submitAssignment,
  gradeSubmission,
  listSubmissions,
  getMySubmission,
} from "@/server/services/submission";

let instructor: Principal;
let otherInstructor: Principal;
let student: Principal;
let courseId: string;
let openAssignmentId: string; // ACCEPT late policy, past due
let rejectAssignmentId: string; // REJECT late policy, past due
const userIds: string[] = [];

const past = new Date(Date.now() - 60_000);

beforeAll(async () => {
  const suffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const i = await db.user.create({ data: { email: `ai-${suffix}@t.test`, name: "AI", role: "INSTRUCTOR" } });
  const o = await db.user.create({ data: { email: `ao-${suffix}@t.test`, name: "AO", role: "INSTRUCTOR" } });
  const s = await db.user.create({ data: { email: `as-${suffix}@t.test`, name: "AS", role: "STUDENT" } });
  userIds.push(i.id, o.id, s.id);
  instructor = { id: i.id, role: "INSTRUCTOR", status: "ACTIVE" };
  otherInstructor = { id: o.id, role: "INSTRUCTOR", status: "ACTIVE" };
  student = { id: s.id, role: "STUDENT", status: "ACTIVE" };

  const course = await createCourse(instructor, {
    title: "Assignment Test Course",
    summary: "Course for assignment integration tests.",
    description: "",
  });
  courseId = course.id;
  const mod = await addModule(instructor, course.id, "M1");
  const l1 = await addLesson(instructor, mod.id, "L1");
  const l2 = await addLesson(instructor, mod.id, "L2");
  await publishCourse(instructor, course.id);
  await enroll(student, course.id);

  const open = await upsertLessonAssignment(instructor, l1.id, {
    title: "Essay",
    instructions: "Write something.",
    dueAt: past,
    maxPoints: 100,
    latePolicy: "ACCEPT",
  });
  openAssignmentId = open.id;

  const rej = await upsertLessonAssignment(instructor, l2.id, {
    title: "Strict Essay",
    dueAt: past,
    maxPoints: 50,
    latePolicy: "REJECT",
  });
  rejectAssignmentId = rej.id;
});

afterAll(async () => {
  await db.course.deleteMany({ where: { id: courseId } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("assignments (US4, FR-020/021)", () => {
  it("records a submission and flags it late (server time)", async () => {
    const sub = await submitAssignment(student, openAssignmentId, {
      text: "My answer",
    });
    expect(sub.status).toBe("SUBMITTED");
    expect(sub.isLate).toBe(true);

    const mine = await getMySubmission(student, openAssignmentId);
    expect(mine?.text).toBe("My answer");
  });

  it("rejects a late submission under the REJECT policy", async () => {
    await expect(
      submitAssignment(student, rejectAssignmentId, { text: "too late" }),
    ).rejects.toMatchObject({ code: "PAST_DUE" });
  });

  it("blocks a non-enrolled user (e.g. an instructor) from submitting", async () => {
    // An instructor has no enrollment, so the enrollment guard denies them.
    await expect(
      submitAssignment(instructor, openAssignmentId, { text: "no" }),
    ).rejects.toMatchObject({ code: "NOT_ENROLLED" });
  });

  it("requires text or a file", async () => {
    await expect(
      submitAssignment(student, openAssignmentId, {}),
    ).rejects.toBeInstanceOf(Error);
  });

  it("lets the owning instructor grade with score + feedback and notifies", async () => {
    await submitAssignment(student, openAssignmentId, { text: "Final answer" });
    const { submissions } = await listSubmissions(instructor, openAssignmentId);
    const target = submissions.find((s) => s.studentId === student.id)!;

    const graded = await gradeSubmission(instructor, target.id, {
      score: 88,
      feedback: "Nice work.",
    });
    expect(graded.status).toBe("GRADED");
    expect(graded.score).toBe(88);
    expect(graded.gradedById).toBe(instructor.id);

    const note = await db.notification.findFirst({
      where: { userId: student.id, type: "GRADE_POSTED" },
      orderBy: { createdAt: "desc" },
    });
    expect(note?.body).toContain("88");
  });

  it("prevents a non-owner instructor from grading", async () => {
    const { submissions } = await listSubmissions(instructor, openAssignmentId);
    const target = submissions.find((s) => s.studentId === student.id)!;
    await expect(
      gradeSubmission(otherInstructor, target.id, { score: 10 }),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rejects a score above the maximum", async () => {
    const { submissions } = await listSubmissions(instructor, openAssignmentId);
    const target = submissions.find((s) => s.studentId === student.id)!;
    await expect(
      gradeSubmission(instructor, target.id, { score: 500 }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
