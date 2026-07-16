import "server-only";
import { db } from "@/server/db";
import { authorize, type Actor } from "@/server/access/authorize";
import { slugify } from "@/lib/slug";
import { courseInputSchema, type CourseInput } from "@/lib/validation/course";

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const root = slugify(base) || "course";
  let candidate = root;
  let n = 1;
  // Loop until free. Small catalog scale for MVP; indexed unique lookup.
  while (true) {
    const existing = await db.course.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === ignoreId) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
}

export async function createCourse(actor: Actor | null, raw: CourseInput) {
  authorize(actor, "course:create");
  const input = courseInputSchema.parse(raw);
  const slug = await uniqueSlug(input.title);

  return db.course.create({
    data: {
      title: input.title,
      slug,
      summary: input.summary,
      description: input.description,
      categoryId: input.categoryId || null,
      coverImageUrl: input.coverImageUrl || null,
      instructorId: actor.id,
    },
  });
}

export async function updateCourse(
  actor: Actor | null,
  courseId: string,
  raw: CourseInput,
) {
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) throw new Error("Course not found");
  authorize(actor, "course:update", { ownerId: course.instructorId });
  const input = courseInputSchema.parse(raw);

  return db.course.update({
    where: { id: courseId },
    data: {
      title: input.title,
      summary: input.summary,
      description: input.description,
      categoryId: input.categoryId || null,
      coverImageUrl: input.coverImageUrl || null,
    },
  });
}

/** Full authoring view of a course the actor owns (or admin). */
export async function getCourseForEditor(actor: Actor | null, courseId: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      category: true,
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: { contentBlocks: { orderBy: { order: "asc" } } },
          },
        },
      },
    },
  });
  if (!course) return null;
  authorize(actor, "course:update", { ownerId: course.instructorId });
  return course;
}

export async function listInstructorCourses(actor: Actor | null) {
  if (!actor) return [];
  return db.course.findMany({
    where: { instructorId: actor.id, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    include: { category: true, _count: { select: { enrollments: true } } },
  });
}
