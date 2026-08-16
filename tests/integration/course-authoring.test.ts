import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/server/db";
import type { Principal } from "@/server/access/policy";
import { AuthorizationError } from "@/server/access/policy";
import {
  createCourse,
  updateCourse,
  getCourseForEditing,
  reorderCourses,
  listAllCourses,
} from "@/server/services/course";
import {
  addModule,
  addLesson,
  addContentBlock,
  reorderModules,
  reorderLessons,
} from "@/server/services/curriculum";
import { publishCourse } from "@/server/services/publish";
import { AppError } from "@/server/http";
import { searchCatalog } from "@/server/services/catalog";

let instructor: Principal;
let otherInstructor: Principal;
let student: Principal;
let admin: Principal;
const created: string[] = [];
const users: string[] = [];

beforeAll(async () => {
  const suffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const i = await db.user.create({
    data: { email: `inst-${suffix}@t.test`, name: "Test Instr", role: "INSTRUCTOR" },
  });
  const o = await db.user.create({
    data: { email: `inst2-${suffix}@t.test`, name: "Other", role: "INSTRUCTOR" },
  });
  const s = await db.user.create({
    data: { email: `stu-${suffix}@t.test`, name: "Test Stu", role: "STUDENT" },
  });
  const a = await db.user.create({
    data: { email: `admin-${suffix}@t.test`, name: "Test Admin", role: "ADMIN" },
  });
  users.push(i.id, o.id, s.id, a.id);
  instructor = { id: i.id, role: "INSTRUCTOR", status: "ACTIVE" };
  otherInstructor = { id: o.id, role: "INSTRUCTOR", status: "ACTIVE" };
  student = { id: s.id, role: "STUDENT", status: "ACTIVE" };
  admin = { id: a.id, role: "ADMIN", status: "ACTIVE" };
});

afterAll(async () => {
  for (const id of created) {
    await db.course.deleteMany({ where: { id } });
  }
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

describe("course authoring (US1)", () => {
  it("creates a draft course owned by the instructor", async () => {
    const course = await createCourse(instructor, {
      title: "Authoring Test Course",
      summary: "A course used by the authoring integration test.",
      description: "",
    });
    created.push(course.id);
    expect(course.status).toBe("DRAFT");
    expect(course.instructorId).toBe(instructor.id);
    expect(course.slug).toMatch(/authoring-test-course/);
  });

  it("blocks a student from creating courses", async () => {
    await expect(
      createCourse(student, {
        title: "Nope",
        summary: "students cannot author",
        description: "",
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("blocks another instructor from editing someone else's course", async () => {
    const course = await createCourse(instructor, {
      title: "Ownership Course",
      summary: "Only the owner may edit this course.",
      description: "",
    });
    created.push(course.id);
    await expect(
      updateCourse(otherInstructor, course.id, { title: "Hijacked" }),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("enforces the publish gate, then publishes and appears in catalog", async () => {
    const course = await createCourse(instructor, {
      title: "Publish Flow Course",
      summary: "Walks through the publish completeness gate.",
      description: "",
    });
    created.push(course.id);

    // Empty course cannot publish.
    await expect(publishCourse(instructor, course.id)).rejects.toBeInstanceOf(
      AppError,
    );

    // Add structure + content.
    const mod = await addModule(instructor, course.id, "Module 1");
    const l1 = await addLesson(instructor, mod.id, "Lesson 1");
    await addContentBlock(instructor, l1.id, {
      type: "TEXT",
      text: "<p>Hello</p>",
    });
    await addLesson(instructor, mod.id, "Lesson 2");

    // Now it publishes.
    const published = await publishCourse(instructor, course.id);
    expect(published.status).toBe("PUBLISHED");
    expect(published.publishedAt).toBeInstanceOf(Date);

    // And is discoverable in the catalog.
    const { items } = await searchCatalog(
      { q: "Publish Flow", page: 1 },
      { page: 1, pageSize: 12, skip: 0 },
    );
    expect(items.some((c) => c.id === course.id)).toBe(true);
  });

  it("returns the full editable tree in curriculum order", async () => {
    const course = await createCourse(instructor, {
      title: "Tree Course",
      summary: "Verifies the editable tree ordering.",
      description: "",
    });
    created.push(course.id);
    const mod = await addModule(instructor, course.id, "M");
    await addLesson(instructor, mod.id, "A");
    await addLesson(instructor, mod.id, "B");

    const tree = await getCourseForEditing(instructor, course.id);
    expect(tree?.modules[0]?.lessons.map((l) => l.title)).toEqual(["A", "B"]);
  });

  it("reorders lessons within a module by a full ordered id list", async () => {
    const course = await createCourse(instructor, {
      title: "Lesson Reorder Course",
      summary: "Verifies lesson reordering.",
      description: "",
    });
    created.push(course.id);
    const mod = await addModule(instructor, course.id, "M");
    const a = await addLesson(instructor, mod.id, "A");
    const b = await addLesson(instructor, mod.id, "B");
    const c = await addLesson(instructor, mod.id, "C");

    await reorderLessons(instructor, mod.id, [c.id, a.id, b.id]);

    const tree = await getCourseForEditing(instructor, course.id);
    expect(tree?.modules[0]?.lessons.map((l) => l.title)).toEqual(["C", "A", "B"]);
  });

  it("reorders modules within a course by a full ordered id list", async () => {
    const course = await createCourse(instructor, {
      title: "Module Reorder Course",
      summary: "Verifies module reordering.",
      description: "",
    });
    created.push(course.id);
    const m1 = await addModule(instructor, course.id, "First");
    const m2 = await addModule(instructor, course.id, "Second");
    const m3 = await addModule(instructor, course.id, "Third");

    await reorderModules(instructor, course.id, [m3.id, m1.id, m2.id]);

    const tree = await getCourseForEditing(instructor, course.id);
    expect(tree?.modules.map((m) => m.title)).toEqual(["Third", "First", "Second"]);
  });

  it("blocks a non-owning instructor from reordering", async () => {
    const course = await createCourse(instructor, {
      title: "Reorder Ownership Course",
      summary: "Only the owner may reorder.",
      description: "",
    });
    created.push(course.id);
    const mod = await addModule(instructor, course.id, "M");
    const a = await addLesson(instructor, mod.id, "A");
    const b = await addLesson(instructor, mod.id, "B");

    await expect(
      reorderLessons(otherInstructor, mod.id, [b.id, a.id]),
    ).rejects.toBeInstanceOf(AuthorizationError);
    await expect(
      reorderModules(otherInstructor, course.id, [mod.id]),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rejects a reorder list that doesn't exactly match the module's lessons", async () => {
    const course = await createCourse(instructor, {
      title: "Reorder Mismatch Course",
      summary: "Verifies the reorder list is validated.",
      description: "",
    });
    created.push(course.id);
    const mod = await addModule(instructor, course.id, "M");
    await addLesson(instructor, mod.id, "A");
    await addLesson(instructor, mod.id, "B");

    await expect(
      reorderLessons(instructor, mod.id, ["not-a-real-id"]),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("reorders courses by permuting the order values they already occupy", async () => {
    const c1 = await createCourse(instructor, {
      title: "Course Order A",
      summary: "First created.",
      description: "",
    });
    const c2 = await createCourse(instructor, {
      title: "Course Order B",
      summary: "Second created.",
      description: "",
    });
    const c3 = await createCourse(instructor, {
      title: "Course Order C",
      summary: "Third created.",
      description: "",
    });
    created.push(c1.id, c2.id, c3.id);

    // New courses are appended in creation order.
    expect(c1.order).toBeLessThan(c2.order);
    expect(c2.order).toBeLessThan(c3.order);

    // Put C first, A second, B third — a genuine reorder, not just a
    // relabeling, so it also proves the "no-op if all defaulted to 0"
    // failure mode from before createCourse assigned distinct positions.
    await reorderCourses(instructor, [c3.id, c1.id, c2.id]);

    const reordered = await db.course.findMany({
      where: { id: { in: [c1.id, c2.id, c3.id] } },
      orderBy: { order: "asc" },
      select: { id: true },
    });
    expect(reordered.map((c) => c.id)).toEqual([c3.id, c1.id, c2.id]);

    // A course created afterwards still appends past the reordered max,
    // rather than colliding with a permuted value.
    const after = await createCourse(instructor, {
      title: "Course Order Bystander",
      summary: "Created after the reorder call.",
      description: "",
    });
    created.push(after.id);
    const maxReordered = Math.max(
      ...(await db.course.findMany({
        where: { id: { in: [c1.id, c2.id, c3.id] } },
        select: { order: true },
      })).map((c) => c.order),
    );
    expect(after.order).toBeGreaterThan(maxReordered);
  });

  it("blocks a non-owning instructor from reordering courses; admin may reorder any", async () => {
    const mine = await createCourse(instructor, {
      title: "Reorder Ownership Course",
      summary: "Only the owner (or admin) may reorder.",
      description: "",
    });
    created.push(mine.id);

    await expect(
      reorderCourses(otherInstructor, [mine.id]),
    ).rejects.toBeInstanceOf(AuthorizationError);
    await expect(reorderCourses(admin, [mine.id])).resolves.toBeUndefined();
  });

  it("rejects an empty or non-existent reorder list", async () => {
    await expect(reorderCourses(instructor, [])).rejects.toBeInstanceOf(
      AppError,
    );
    await expect(
      reorderCourses(instructor, ["not-a-real-course-id"]),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("only admins can list all courses platform-wide", async () => {
    await expect(listAllCourses(instructor)).rejects.toBeInstanceOf(
      AuthorizationError,
    );
    const all = await listAllCourses(admin);
    expect(Array.isArray(all)).toBe(true);
  });
});
