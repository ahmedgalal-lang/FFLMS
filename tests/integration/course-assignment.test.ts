import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/server/db";
import type { Principal } from "@/server/access/policy";
import { AuthorizationError } from "@/server/access/policy";
import { AppError } from "@/server/http";
import { createCourse, setCourseVisibility } from "@/server/services/course";
import { addModule, addLesson } from "@/server/services/curriculum";
import { publishCourse } from "@/server/services/publish";
import { markLessonComplete } from "@/server/services/progress";
import {
  assignCourseToStudent,
  revokeCourseFromStudent,
  listCourseAssignments,
} from "@/server/services/course-assignment";

let admin: Principal;
let instructor: Principal;
let otherInstructor: Principal;
let student: Principal;
let student2: Principal;
let courseId: string;
let draftCourseId: string;
let lessonId: string;
const userIds: string[] = [];
const courseIds: string[] = [];

beforeAll(async () => {
  const suffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const a = await db.user.create({
    data: { email: `ca-admin-${suffix}@t.test`, name: "Admin", role: "ADMIN" },
  });
  const i = await db.user.create({
    data: { email: `ca-inst-${suffix}@t.test`, name: "Inst", role: "INSTRUCTOR" },
  });
  const i2 = await db.user.create({
    data: { email: `ca-inst2-${suffix}@t.test`, name: "Inst2", role: "INSTRUCTOR" },
  });
  const s = await db.user.create({
    data: { email: `ca-stu-${suffix}@t.test`, name: "Stu", role: "STUDENT" },
  });
  const s2 = await db.user.create({
    data: { email: `ca-stu2-${suffix}@t.test`, name: "Stu2", role: "STUDENT" },
  });
  userIds.push(a.id, i.id, i2.id, s.id, s2.id);
  admin = { id: a.id, role: "ADMIN", status: "ACTIVE" };
  instructor = { id: i.id, role: "INSTRUCTOR", status: "ACTIVE" };
  otherInstructor = { id: i2.id, role: "INSTRUCTOR", status: "ACTIVE" };
  student = { id: s.id, role: "STUDENT", status: "ACTIVE" };
  student2 = { id: s2.id, role: "STUDENT", status: "ACTIVE" };

  const course = await createCourse(instructor, {
    title: "Course Assignment Test Course",
    summary: "Course for the course-assignment integration test.",
    description: "",
  });
  courseId = course.id;
  courseIds.push(courseId);
  const mod = await addModule(instructor, course.id, "M1");
  const l1 = await addLesson(instructor, mod.id, "L1");
  lessonId = l1.id;
  await publishCourse(instructor, course.id);
  await setCourseVisibility(instructor, course.id, "RESTRICTED");

  const draft = await createCourse(instructor, {
    title: "Unpublished Course For Assignment Test",
    summary: "Should not be assignable while a draft.",
    description: "",
  });
  draftCourseId = draft.id;
  courseIds.push(draftCourseId);
});

afterAll(async () => {
  await db.course.deleteMany({ where: { id: { in: courseIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("assignCourseToStudent (US1, FR-001–FR-004, FR-006, FR-010)", () => {
  it("the owning instructor can assign their course, auto-enrolling the student", async () => {
    await assignCourseToStudent(instructor, courseId, student.id);
    const enrollment = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: student.id, courseId } },
    });
    expect(enrollment?.status).toBe("ACTIVE");
  });

  it("a different instructor cannot assign someone else's course", async () => {
    await expect(
      assignCourseToStudent(otherInstructor, courseId, student2.id),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("an admin can assign any course to any student", async () => {
    await assignCourseToStudent(admin, courseId, student2.id);
    const enrollment = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: student2.id, courseId } },
    });
    expect(enrollment?.status).toBe("ACTIVE");
  });

  it("assigning the same student twice is idempotent — one CourseAssignment row", async () => {
    await assignCourseToStudent(instructor, courseId, student.id);
    await assignCourseToStudent(instructor, courseId, student.id);
    const count = await db.courseAssignment.count({
      where: { courseId, studentId: student.id },
    });
    expect(count).toBe(1);
  });

  it("a draft (unpublished) course cannot be assigned", async () => {
    await expect(
      assignCourseToStudent(instructor, draftCourseId, student.id),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("lists current direct assignments for the instructor's panel", async () => {
    const list = await listCourseAssignments(instructor, courseId);
    const studentIds = list.map((a) => a.studentId);
    expect(studentIds).toContain(student.id);
    expect(studentIds).toContain(student2.id);
  });
});

describe("revokeCourseFromStudent (US3, FR-007, FR-009, FR-011)", () => {
  it("cancels the student's Enrollment but preserves prior progress", async () => {
    await assignCourseToStudent(instructor, courseId, student.id);
    await markLessonComplete(student, lessonId);

    await revokeCourseFromStudent(instructor, courseId, student.id);

    const enrollment = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: student.id, courseId } },
    });
    expect(enrollment?.status).toBe("CANCELLED");

    const progress = await db.lessonProgress.findFirst({
      where: { enrollmentId: enrollment!.id, lessonId },
    });
    expect(progress?.completedAt).not.toBeNull();
  });

  it("re-assigning after a revoke reactivates access without resetting progress", async () => {
    await assignCourseToStudent(instructor, courseId, student.id);

    const enrollment = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: student.id, courseId } },
    });
    expect(enrollment?.status).toBe("ACTIVE");
    const progress = await db.lessonProgress.findFirst({
      where: { enrollmentId: enrollment!.id, lessonId },
    });
    expect(progress?.completedAt).not.toBeNull();
  });

  it("a non-owning instructor cannot revoke", async () => {
    await expect(
      revokeCourseFromStudent(otherInstructor, courseId, student2.id),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });
});
