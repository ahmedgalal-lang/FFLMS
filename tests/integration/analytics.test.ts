import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/server/db";
import type { Principal } from "@/server/access/policy";
import { AuthorizationError } from "@/server/access/policy";
import { createCourse } from "@/server/services/course";
import { addModule, addLesson } from "@/server/services/curriculum";
import { publishCourse } from "@/server/services/publish";
import { enroll } from "@/server/services/enrollment";
import { markLessonComplete } from "@/server/services/progress";
import { getCourseAnalytics, getOrgReports } from "@/server/services/analytics";

let instructor: Principal;
let otherInstructor: Principal;
let admin: Principal;
let s1: Principal;
let s2: Principal;
let courseId: string;
let lessonIds: string[] = [];
const userIds: string[] = [];

beforeAll(async () => {
  const suffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const i = await db.user.create({ data: { email: `ani-${suffix}@t.test`, name: "AnInst", role: "INSTRUCTOR" } });
  const o = await db.user.create({ data: { email: `ano-${suffix}@t.test`, name: "AnOther", role: "INSTRUCTOR" } });
  const a = await db.user.create({ data: { email: `ana-${suffix}@t.test`, name: "AnAdmin", role: "ADMIN" } });
  const u1 = await db.user.create({ data: { email: `an1-${suffix}@t.test`, name: "S1", role: "STUDENT" } });
  const u2 = await db.user.create({ data: { email: `an2-${suffix}@t.test`, name: "S2", role: "STUDENT" } });
  userIds.push(i.id, o.id, a.id, u1.id, u2.id);
  instructor = { id: i.id, role: "INSTRUCTOR", status: "ACTIVE" };
  otherInstructor = { id: o.id, role: "INSTRUCTOR", status: "ACTIVE" };
  admin = { id: a.id, role: "ADMIN", status: "ACTIVE" };
  s1 = { id: u1.id, role: "STUDENT", status: "ACTIVE" };
  s2 = { id: u2.id, role: "STUDENT", status: "ACTIVE" };

  const course = await createCourse(instructor, {
    title: "Analytics Course",
    summary: "Course for analytics integration tests.",
    description: "",
  });
  courseId = course.id;
  const mod = await addModule(instructor, course.id, "M1");
  const l1 = await addLesson(instructor, mod.id, "L1");
  const l2 = await addLesson(instructor, mod.id, "L2");
  lessonIds = [l1.id, l2.id];
  await publishCourse(instructor, course.id);

  // Two students enroll; s1 completes everything, s2 completes only lesson 1.
  await enroll(s1, course.id);
  await enroll(s2, course.id);
  await markLessonComplete(s1, l1.id);
  await markLessonComplete(s1, l2.id);
  await markLessonComplete(s2, l1.id);
});

afterAll(async () => {
  await db.course.deleteMany({ where: { id: courseId } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("course analytics (US8, FR-030)", () => {
  it("computes enrollments, completion rate, and per-lesson drop-off", async () => {
    const a = await getCourseAnalytics(instructor, courseId);
    expect(a.enrollments.total).toBe(2);
    expect(a.enrollments.completed).toBe(1); // s1 finished
    expect(a.completionRate).toBe(50);

    const l1 = a.lessonDropoff.find((d) => d.lessonId === lessonIds[0])!;
    const l2 = a.lessonDropoff.find((d) => d.lessonId === lessonIds[1])!;
    expect(l1.completed).toBe(2); // both did lesson 1
    expect(l2.completed).toBe(1); // only s1 did lesson 2 -> drop-off
    expect(l1.completionRate).toBe(100);
    expect(l2.completionRate).toBe(50);
  });

  it("prevents a non-owner instructor from reading course analytics", async () => {
    await expect(getCourseAnalytics(otherInstructor, courseId)).rejects.toBeInstanceOf(
      AuthorizationError,
    );
  });

  it("prevents a student from reading course analytics", async () => {
    await expect(getCourseAnalytics(s1, courseId)).rejects.toBeInstanceOf(
      AuthorizationError,
    );
  });

  it("gives admins org-wide reports; blocks non-admins", async () => {
    const r = await getOrgReports(admin);
    expect(r.totalEnrollments).toBeGreaterThanOrEqual(2);
    expect(r.overallCompletionRate).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(r.topCourses)).toBe(true);

    await expect(getOrgReports(instructor)).rejects.toBeInstanceOf(AuthorizationError);
  });
});
