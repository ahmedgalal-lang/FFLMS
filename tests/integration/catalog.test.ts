import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/server/db";
import type { Principal } from "@/server/access/policy";
import { AuthorizationError } from "@/server/access/policy";
import { createCourse } from "@/server/services/course";
import { publishCourse } from "@/server/services/publish";
import { addModule, addLesson, addContentBlock } from "@/server/services/curriculum";
import {
  createCategory,
  updateCategory,
  reorderCategories,
} from "@/server/services/category";
import { browseCatalogGrouped } from "@/server/services/catalog";
import { AppError } from "@/server/http";

let instructor: Principal;
let admin: Principal;
let student: Principal;
const courseIds: string[] = [];
const categoryIds: string[] = [];
const userIds: string[] = [];

async function publishedCourse(suffix: string, title: string, categoryId?: string) {
  const course = await createCourse(instructor, {
    title,
    summary: `Catalog grouping test course ${suffix}.`,
    description: "",
  });
  courseIds.push(course.id);
  if (categoryId) {
    await db.course.update({ where: { id: course.id }, data: { categoryId } });
  }
  const mod = await addModule(instructor, course.id, "Module 1");
  const lesson = await addLesson(instructor, mod.id, "Lesson 1");
  await addContentBlock(instructor, lesson.id, { type: "TEXT", text: "<p>x</p>" });
  return publishCourse(instructor, course.id);
}

beforeAll(async () => {
  const suffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const i = await db.user.create({
    data: { email: `cat-inst-${suffix}@t.test`, name: "Catalog Instr", role: "INSTRUCTOR" },
  });
  const a = await db.user.create({
    data: { email: `cat-admin-${suffix}@t.test`, name: "Catalog Admin", role: "ADMIN" },
  });
  const s = await db.user.create({
    data: { email: `cat-stu-${suffix}@t.test`, name: "Catalog Stu", role: "STUDENT" },
  });
  userIds.push(i.id, a.id, s.id);
  instructor = { id: i.id, role: "INSTRUCTOR", status: "ACTIVE" };
  admin = { id: a.id, role: "ADMIN", status: "ACTIVE" };
  student = { id: s.id, role: "STUDENT", status: "ACTIVE" };
});

afterAll(async () => {
  for (const id of courseIds) {
    await db.course.deleteMany({ where: { id } });
  }
  for (const id of categoryIds) {
    await db.category.deleteMany({ where: { id } });
  }
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("category umbrella ordering", () => {
  it("appends new categories past the current max instead of colliding at 0", async () => {
    const c1 = await createCategory(admin, { name: `Umbrella A ${Date.now()}` });
    const c2 = await createCategory(admin, { name: `Umbrella B ${Date.now()}` });
    categoryIds.push(c1.id, c2.id);
    expect(c2.order).toBeGreaterThan(c1.order);
  });

  it("reorders categories by permuting the order values they occupy", async () => {
    const c1 = await createCategory(admin, { name: `Reorder A ${Date.now()}` });
    const c2 = await createCategory(admin, { name: `Reorder B ${Date.now()}` });
    const c3 = await createCategory(admin, { name: `Reorder C ${Date.now()}` });
    categoryIds.push(c1.id, c2.id, c3.id);

    await reorderCategories(admin, [c3.id, c1.id, c2.id]);

    const reordered = await db.category.findMany({
      where: { id: { in: [c1.id, c2.id, c3.id] } },
      orderBy: { order: "asc" },
      select: { id: true },
    });
    expect(reordered.map((c) => c.id)).toEqual([c3.id, c1.id, c2.id]);
  });

  it("blocks non-admins from reordering categories", async () => {
    const c1 = await createCategory(admin, { name: `Guarded ${Date.now()}` });
    categoryIds.push(c1.id);
    await expect(
      reorderCategories(instructor, [c1.id]),
    ).rejects.toBeInstanceOf(AuthorizationError);
    await expect(
      reorderCategories(student, [c1.id]),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rejects an empty or non-existent reorder list", async () => {
    await expect(reorderCategories(admin, [])).rejects.toBeInstanceOf(AppError);
    await expect(
      reorderCategories(admin, ["not-a-real-category-id"]),
    ).rejects.toBeInstanceOf(AppError);
  });
});

describe("grouped catalog browse", () => {
  it("groups published courses into sections by category, in category and course order, with an uncategorized bucket last", async () => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const essentials = await createCategory(admin, { name: `Essentials ${suffix}` });
    const tools = await createCategory(admin, { name: `Tools ${suffix}` });
    categoryIds.push(essentials.id, tools.id);
    // Essentials should render before Tools.
    await reorderCategories(admin, [essentials.id, tools.id]);

    const c1 = await publishedCourse(suffix, `Essentials Course One ${suffix}`, essentials.id);
    const c2 = await publishedCourse(suffix, `Tools Course ${suffix}`, tools.id);
    const c3 = await publishedCourse(suffix, `Uncategorized Course ${suffix}`);

    const { groups } = await browseCatalogGrouped();

    const essentialsGroup = groups.find((g) => g.category?.id === essentials.id);
    const toolsGroup = groups.find((g) => g.category?.id === tools.id);
    const uncategorizedGroup = groups.find((g) => g.category === null);

    expect(essentialsGroup?.courses.map((c) => c.id)).toContain(c1.id);
    expect(toolsGroup?.courses.map((c) => c.id)).toContain(c2.id);
    expect(uncategorizedGroup?.courses.map((c) => c.id)).toContain(c3.id);

    const essentialsIdx = groups.indexOf(essentialsGroup!);
    const toolsIdx = groups.indexOf(toolsGroup!);
    const uncategorizedIdx = groups.indexOf(uncategorizedGroup!);
    expect(essentialsIdx).toBeLessThan(toolsIdx);
    // The uncategorized bucket always trails the real umbrella categories.
    expect(uncategorizedIdx).toBeGreaterThan(toolsIdx);
  });

  it("omits categories with no published courses instead of showing empty sections", async () => {
    const empty = await createCategory(admin, { name: `Empty Umbrella ${Date.now()}` });
    categoryIds.push(empty.id);

    const { groups } = await browseCatalogGrouped();
    expect(groups.some((g) => g.category?.id === empty.id)).toBe(false);
  });

  it("moves a course into a renamed category's group via updateCategory", async () => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const original = await createCategory(admin, { name: `Original Name ${suffix}` });
    categoryIds.push(original.id);
    const course = await publishedCourse(suffix, `Renamed Umbrella Course ${suffix}`, original.id);

    const renamed = await updateCategory(admin, original.id, {
      name: `Renamed ${suffix}`,
    });

    const { groups } = await browseCatalogGrouped();
    const group = groups.find((g) => g.category?.id === renamed.id);
    expect(group?.category?.slug).toBe(renamed.slug);
    expect(group?.courses.map((c) => c.id)).toContain(course.id);
  });
});
