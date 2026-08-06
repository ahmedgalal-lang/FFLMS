import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";
import type { CatalogQuery } from "@/lib/validation";
import type { PageParams } from "@/server/http";

/**
 * Public catalog search over PUBLISHED courses. Uses case-insensitive matching
 * on title/summary plus optional category filter. For the reference scale
 * (~1k courses) this is well under the 1s budget (SC-006); a GIN/tsvector index
 * is the drop-in upgrade path documented in data-model.md.
 */
export async function searchCatalog(query: CatalogQuery, page: PageParams) {
  const where: Prisma.CourseWhereInput = {
    status: "PUBLISHED",
    visibility: "OPEN",
    deletedAt: null,
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: "insensitive" } },
            { summary: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(query.category ? { category: { slug: query.category } } : {}),
  };

  const [items, total] = await Promise.all([
    db.course.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: page.skip,
      take: page.pageSize,
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        coverImageUrl: true,
        publishedAt: true,
        instructor: { select: { name: true } },
        category: { select: { name: true, slug: true } },
        _count: { select: { enrollments: true } },
      },
    }),
    db.course.count({ where }),
  ]);

  return { items, total };
}

/**
 * Full public detail for a published, OPEN course by slug. RESTRICTED courses
 * are never reachable here, even by direct link — assigned students reach
 * them via My Learning / the player instead (specs/002-assign-courses).
 */
export async function getPublicCourse(slug: string) {
  return db.course.findFirst({
    where: { slug, status: "PUBLISHED", visibility: "OPEN", deletedAt: null },
    include: {
      instructor: { select: { name: true, avatarUrl: true } },
      category: true,
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { deletedAt: null },
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              isRequired: true,
              estimatedMinutes: true,
              quiz: { select: { id: true } },
              assignment: { select: { id: true } },
            },
          },
        },
      },
      _count: { select: { enrollments: true } },
    },
  });
}

export async function listCategories() {
  return db.category.findMany({ orderBy: { name: "asc" } });
}
