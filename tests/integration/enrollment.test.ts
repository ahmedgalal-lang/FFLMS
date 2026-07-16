import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/server/db";
import type { Principal } from "@/server/access/policy";
import { AuthorizationError } from "@/server/access/policy";
import { enroll, listMyEnrollments } from "@/server/services/enrollment";
import { markLessonComplete, getResumeLessonId } from "@/server/services/progress";
import { createCourse, updateCourse } from "@/server/services/course";
import { addModule, addLesson } from "@/server/services/curriculum";
import { publishCourse } from "@/server/services/publish";

let instructor: Principal;
let student: Principal;
let courseId: string;
let lessonIds: string[] = [];
const userIds: string[] = [];

beforeAll(async () => {
  const suffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const i = await db.user.create({
    data: { email: `ei-${suffix}@t.test`, name: "EI", role: "INSTRUCTOR" },
  });
  const s = await db.user.create({
    data: { email: `es-${suffix}@t.test`, name: "ES", role: "STUDENT" },
  });
  userIds.push(i.id, s.id);
  instructor = { id: i.id, role: "INSTRUCTOR", status: "ACTIVE" };
  student = { id: s.id, role: "STUDENT", status: "ACTIVE" };

  const course = await createCourse(instructor, {
    title: "Enroll Test Course",
    summary: "Course for the enrollment integration test.",
    description: "",
  });
  courseId = course.id;
  const mod = await addModule(instructor, course.id, "M1");
  const l1 = await addLesson(instructor, mod.id, "L1");
  const l2 = await addLesson(instructor, mod.id, "L2");
  lessonIds = [l1.id, l2.id];
  await publishCourse(instructor, course.id);
});

afterAll(async () => {
  await db.course.deleteMany({ where: { id: courseId } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("enrollment (US2, FR-011)", () => {
  it("enrolling is idempotent — one enrollment per (student, course)", async () => {
    const first = await enroll(student, courseId);
    const second = await enroll(student, courseId);
    expect(second.id).toBe(first.id);

    const count = await db.enrollment.count({
      where: { studentId: student.id, courseId },
    });
    expect(count).toBe(1);
  });

  it("blocks an instructor from enrolling", async () => {
    await expect(enroll(instructor, courseId)).rejects.toBeInstanceOf(
      AuthorizationError,
    );
  });

  it("tracks progress and resume as lessons are completed", async () => {
    await enroll(student, courseId);

    // Resume starts at the first lesson.
    const enr = await db.enrollment.findUniqueOrThrow({
      where: { studentId_courseId: { studentId: student.id, courseId } },
    });
    expect(await getResumeLessonId(enr.id, courseId)).toBe(lessonIds[0]);

    // Complete lesson 1 → 50%, resume advances to lesson 2.
    let res = await markLessonComplete(student, lessonIds[0]!);
    expect(res.progressPercent).toBe(50);
    expect(res.completed).toBe(false);
    expect(await getResumeLessonId(enr.id, courseId)).toBe(lessonIds[1]);

    // Completing the same lesson again is idempotent.
    res = await markLessonComplete(student, lessonIds[0]!);
    expect(res.progressPercent).toBe(50);

    // Complete lesson 2 → 100%, course complete, certificate issued.
    res = await markLessonComplete(student, lessonIds[1]!);
    expect(res.progressPercent).toBe(100);
    expect(res.completed).toBe(true);
    expect(await getResumeLessonId(enr.id, courseId)).toBeNull();

    const cert = await db.certificate.findUnique({
      where: { studentId_courseId: { studentId: student.id, courseId } },
    });
    expect(cert).not.toBeNull();
    expect(cert?.verificationCode).toHaveLength(32);
  });

  it("surfaces enrollments in My Learning", async () => {
    await enroll(student, courseId);
    const list = await listMyEnrollments(student);
    expect(list.some((e) => e.courseId === courseId)).toBe(true);
  });
});
