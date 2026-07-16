import "server-only";
import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 12;

/** Public catalog: published courses with keyword + category filter, paginated. */
export async function listCatalog(opts: {
  q?: string;
  categorySlug?: string;
  page?: number;
}) {
  const page = Math.max(1, opts.page ?? 1);
  const where: Prisma.CourseWhereInput = {
    status: "PUBLISHED",
    deletedAt: null,
  };
  if (opts.q && opts.q.trim()) {
    const q = opts.q.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (opts.categorySlug) {
    where.category = { slug: opts.categorySlug };
  }

  const [items, total] = await Promise.all([
    db.course.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        category: true,
        instructor: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
    }),
    db.course.count({ where }),
  ]);

  return { items, page, pageSize: PAGE_SIZE, total };
}

export async function getPublishedCourseBySlug(slug: string) {
  return db.course.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null },
    include: {
      category: true,
      instructor: { select: { name: true } },
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { deletedAt: null },
            orderBy: { order: "asc" },
            select: { id: true, title: true, isRequired: true, estimatedMinutes: true },
          },
        },
      },
    },
  });
}

export async function listCategories() {
  return db.category.findMany({ orderBy: { name: "asc" } });
}
