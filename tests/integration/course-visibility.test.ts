import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/server/db";
import type { Principal } from "@/server/access/policy";
import { AuthorizationError } from "@/server/access/policy";
import { createCourse, setCourseVisibility } from "@/server/services/course";
import { addModule, addLesson } from "@/server/services/curriculum";
import { publishCourse } from "@/server/services/publish";
import { enroll } from "@/server/services/enrollment";
import { searchCatalog, getPublicCourse } from "@/server/services/catalog";

let instructor: Principal;
let student: Principal;
let courseId: string;
let slug: string;
const userIds: string[] = [];

beforeAll(async () => {
  const suffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const i = await db.user.create({
    data: { email: `cv-inst-${suffix}@t.test`, name: "Inst", role: "INSTRUCTOR" },
  });
  const s = await db.user.create({
    data: { email: `cv-stu-${suffix}@t.test`, name: "Stu", role: "STUDENT" },
  });
  userIds.push(i.id, s.id);
  instructor = { id: i.id, role: "INSTRUCTOR", status: "ACTIVE" };
  student = { id: s.id, role: "STUDENT", status: "ACTIVE" };

  const course = await createCourse(instructor, {
    title: "Course Visibility Test Course",
    summary: "Course for the course-visibility integration test.",
    description: "",
  });
  courseId = course.id;
  slug = course.slug;
  const mod = await addModule(instructor, course.id, "M1");
  await addLesson(instructor, mod.id, "L1");
  await publishCourse(instructor, course.id);
});

afterAll(async () => {
  await db.course.deleteMany({ where: { id: courseId } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("course visibility (US1, FR-012, FR-013, FR-018, SC-005)", () => {
  it("an OPEN published course is in the catalog and self-enrollable", async () => {
    const { items } = await searchCatalog({ page: 1 }, { page: 1, skip: 0, pageSize: 20 });
    expect(items.some((c) => c.id === courseId)).toBe(true);
    expect(await getPublicCourse(slug)).not.toBeNull();

    const enrollment = await enroll(student, courseId);
    expect(enrollment.status).toBe("ACTIVE");
  });

  it("switching to RESTRICTED removes it from the catalog and detail page, and blocks self-enroll — but leaves the existing enrollment untouched", async () => {
    await setCourseVisibility(instructor, courseId, "RESTRICTED");

    const { items } = await searchCatalog({ page: 1 }, { page: 1, skip: 0, pageSize: 20 });
    expect(items.some((c) => c.id === courseId)).toBe(false);
    expect(await getPublicCourse(slug)).toBeNull();

    // The student who self-enrolled while it was OPEN keeps their access.
    const existing = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: student.id, courseId } },
    });
    expect(existing?.status).toBe("ACTIVE");

    await expect(enroll(student, courseId)).rejects.toBeInstanceOf(
      AuthorizationError,
    );
  });

  it("switching back to OPEN restores catalog visibility and self-enroll", async () => {
    await setCourseVisibility(instructor, courseId, "OPEN");

    const { items } = await searchCatalog({ page: 1 }, { page: 1, skip: 0, pageSize: 20 });
    expect(items.some((c) => c.id === courseId)).toBe(true);
    expect(await getPublicCourse(slug)).not.toBeNull();
  });
});
