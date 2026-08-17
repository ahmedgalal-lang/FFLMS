import { db } from "@/server/db";
import { authorize, type Principal } from "@/server/access/policy";
import { NotFoundError, ConflictError, AppError } from "@/server/http";
import { categorySchema, type CategoryInput } from "@/lib/validation";
import { slugify } from "@/lib/utils";

/** Category/taxonomy management (FR-025). Admin-only mutations. */

/**
 * Every umbrella category with its courses nested underneath (all
 * non-deleted courses, any status — this is the authoring/admin view, not
 * the public catalog), plus a separate bucket for courses with no category
 * yet, so the admin page can both show and move courses between umbrellas.
 */
export async function listCategoriesWithCourses(principal: Principal) {
  authorize(principal, { type: "admin:categories" });
  const [categories, courses] = await Promise.all([
    db.category.findMany({ orderBy: { order: "asc" } }),
    db.course.findMany({
      where: { deletedAt: null },
      orderBy: { order: "asc" },
      select: { id: true, title: true, status: true, categoryId: true },
    }),
  ]);

  type CategoryCourse = (typeof courses)[number];
  const byCategoryId = new Map<string, CategoryCourse[]>();
  const uncategorized: CategoryCourse[] = [];
  for (const course of courses) {
    if (course.categoryId) {
      const bucket = byCategoryId.get(course.categoryId) ?? [];
      bucket.push(course);
      byCategoryId.set(course.categoryId, bucket);
    } else {
      uncategorized.push(course);
    }
  }

  return {
    categories: categories.map((category) => ({
      ...category,
      courses: byCategoryId.get(category.id) ?? [],
    })),
    uncategorized,
  };
}

/**
 * Move a course to a different umbrella category (or null to uncategorize)
 * from the admin categories page. Admin-only — reordering/reassigning
 * across instructors is not something an owning instructor gets to do from
 * this screen (they set a course's category from Studio settings instead).
 */
export async function setCourseCategory(
  principal: Principal,
  courseId: string,
  categoryId: string | null,
) {
  authorize(principal, { type: "admin:categories" });
  const course = await db.course.findFirst({
    where: { id: courseId, deletedAt: null },
    select: { id: true },
  });
  if (!course) throw new NotFoundError("Course not found.");
  if (categoryId) {
    const category = await db.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new NotFoundError("Category not found.");
  }
  return db.course.update({ where: { id: courseId }, data: { categoryId } });
}

export async function createCategory(principal: Principal, input: CategoryInput) {
  authorize(principal, { type: "admin:categories" });
  const data = categorySchema.parse(input);
  const slug = slugify(data.name);
  const existing = await db.category.findFirst({
    where: { OR: [{ name: data.name }, { slug }] },
  });
  if (existing) throw new ConflictError("A category with that name already exists.");
  // Append at the end of the umbrella order, same append-at-end pattern as
  // course ordering — new categories otherwise all default to 0 and collide.
  const { _max } = await db.category.aggregate({ _max: { order: true } });
  const order = (_max.order ?? -1) + 1;
  return db.category.create({
    data: { name: data.name, slug, description: data.description ?? null, order },
  });
}

/**
 * Reorder umbrella categories by a full ordered list of ids — drives the
 * grouped section order on the public catalog. Admin-only (categories are
 * platform-wide, not owned by an instructor). Permutes just the given
 * categories among the order values they already occupy, same as
 * reorderCourses.
 */
export async function reorderCategories(principal: Principal, orderedIds: string[]) {
  authorize(principal, { type: "admin:categories" });
  if (orderedIds.length === 0) {
    throw new AppError("Reorder list must not be empty.");
  }
  const categories = await db.category.findMany({
    where: { id: { in: orderedIds } },
    select: { id: true, order: true },
  });
  if (categories.length !== orderedIds.length) {
    throw new AppError("Reorder list must match existing categories.");
  }
  const slots = categories.map((c) => c.order).sort((a, b) => a - b);
  await db.$transaction(
    orderedIds.map((id, i) =>
      db.category.update({ where: { id }, data: { order: slots[i]! } }),
    ),
  );
}

export async function updateCategory(
  principal: Principal,
  categoryId: string,
  input: CategoryInput,
) {
  authorize(principal, { type: "admin:categories" });
  const data = categorySchema.parse(input);
  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category) throw new NotFoundError("Category not found.");
  const slug = slugify(data.name);
  const collision = await db.category.findFirst({
    where: { id: { not: categoryId }, OR: [{ name: data.name }, { slug }] },
  });
  if (collision) throw new ConflictError("A category with that name already exists.");
  return db.category.update({
    where: { id: categoryId },
    data: {
      name: data.name,
      slug,
      description: data.description ?? null,
    },
  });
}

export async function deleteCategory(principal: Principal, categoryId: string) {
  authorize(principal, { type: "admin:categories" });
  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category) throw new NotFoundError("Category not found.");
  // Courses in this category have their categoryId set null (schema: optional FK).
  await db.category.delete({ where: { id: categoryId } });
}
