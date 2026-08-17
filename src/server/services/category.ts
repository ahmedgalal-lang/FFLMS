import { db } from "@/server/db";
import { authorize, type Principal } from "@/server/access/policy";
import { NotFoundError, ConflictError, AppError } from "@/server/http";
import { categorySchema, type CategoryInput } from "@/lib/validation";
import { slugify } from "@/lib/utils";

/** Category/taxonomy management (FR-025). Admin-only mutations. */

export async function listCategoriesWithCounts(principal: Principal) {
  authorize(principal, { type: "admin:categories" });
  return db.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { courses: true } } },
  });
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
  return db.category.update({
    where: { id: categoryId },
    data: {
      name: data.name,
      slug: slugify(data.name),
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
