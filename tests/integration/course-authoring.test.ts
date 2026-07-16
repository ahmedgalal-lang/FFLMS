import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/server/db";
import type { Principal } from "@/server/access/policy";
import { AuthorizationError } from "@/server/access/policy";
import {
  createCourse,
  updateCourse,
  getCourseForEditing,
} from "@/server/services/course";
import { addModule, addLesson, addContentBlock } from "@/server/services/curriculum";
import { publishCourse } from "@/server/services/publish";
import { AppError } from "@/server/http";
import { searchCatalog } from "@/server/services/catalog";

let instructor: Principal;
let otherInstructor: Principal;
let student: Principal;
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
  users.push(i.id, o.id, s.id);
  instructor = { id: i.id, role: "INSTRUCTOR", status: "ACTIVE" };
  otherInstructor = { id: o.id, role: "INSTRUCTOR", status: "ACTIVE" };
  student = { id: s.id, role: "STUDENT", status: "ACTIVE" };
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
});
