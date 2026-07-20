import { db } from "@/server/db";
import { authorize, type Principal } from "@/server/access/policy";
import { NotFoundError, ConflictError } from "@/server/http";
import { categorySchema, type CategoryInput } from "@/lib/validation";
import { slugify } from "@/lib/utils";

/** Category/taxonomy management (FR-025). Admin-only mutations. */

export async function listCategoriesWithCounts(principal: Principal) {
  authorize(principal, { type: "admin:categories" });
  return db.category.findMany({
    orderBy: { name: "asc" },
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
  return db.category.create({
    data: { name: data.name, slug, description: data.description ?? null },
  });
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
