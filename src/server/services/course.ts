import { db } from "@/server/db";
import { authorize, type Principal } from "@/server/access/policy";
import {
  courseCreateSchema,
  courseUpdateSchema,
  type CourseCreateInput,
  type CourseUpdateInput,
} from "@/lib/validation";
import { AppError, NotFoundError, ConflictError } from "@/server/http";
import { slugify } from "@/lib/utils";

/** Load a course's authorization-relevant attributes, or throw 404. */
export async function loadCourseForAuthz(courseId: string) {
  const course = await db.course.findFirst({
    where: { id: courseId, deletedAt: null },
    select: { id: true, instructorId: true, status: true, visibility: true },
  });
  if (!course) throw new NotFoundError("Course not found.");
  return course;
}

/** Generate a slug unique across courses. */
async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "course";
  let candidate = base;
  let n = 1;
  while (await db.course.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${++n}`;
  }
  return candidate;
}

export async function createCourse(
  principal: Principal,
  input: CourseCreateInput,
) {
  authorize(principal, { type: "course:create" });
  const data = courseCreateSchema.parse(input);

  const instructorId = await resolveCourseOwner(principal, data.instructorId);

  return db.course.create({
    data: {
      title: data.title,
      slug: await uniqueSlug(data.title),
      summary: data.summary,
      description: data.description ?? "",
      categoryId: data.categoryId ?? null,
      coverImageUrl: data.coverImageUrl ?? null,
      instructorId,
      status: "DRAFT",
    },
  });
}

/**
 * Instructors always own the courses they create. Admins may instead assign
 * a course directly to a named instructor (so it shows up in that
 * instructor's own Studio) rather than defaulting to the admin's own
 * account.
 */
async function resolveCourseOwner(
  principal: Principal,
  requestedInstructorId: string | null | undefined,
): Promise<string> {
  if (principal.role !== "ADMIN" || !requestedInstructorId) {
    return principal.id;
  }
  const instructor = await db.user.findUnique({
    where: { id: requestedInstructorId },
    select: { id: true, role: true },
  });
  if (!instructor || instructor.role !== "INSTRUCTOR") {
    throw new AppError(
      "Selected instructor account not found.",
      422,
      "INVALID_INSTRUCTOR",
    );
  }
  return instructor.id;
}

export async function updateCourse(
  principal: Principal,
  courseId: string,
  input: CourseUpdateInput,
) {
  const course = await loadCourseForAuthz(courseId);
  authorize(principal, { type: "course:update", course });
  const data = courseUpdateSchema.parse(input);

  return db.course.update({
    where: { id: courseId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.summary !== undefined ? { summary: data.summary } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
      ...(data.coverImageUrl !== undefined
        ? { coverImageUrl: data.coverImageUrl }
        : {}),
      ...(data.completionThreshold !== undefined
        ? { completionThreshold: data.completionThreshold }
        : {}),
      ...(data.isRequiredSequential !== undefined
        ? { isRequiredSequential: data.isRequiredSequential }
        : {}),
    },
  });
}

/**
 * Toggle a course between Open (self-enrollable, today's behavior) and
 * Restricted (assignment-only) — specs/002-assign-courses FR-012, FR-018.
 * Does not touch any existing Enrollment either direction.
 */
export async function setCourseVisibility(
  principal: Principal,
  courseId: string,
  visibility: "OPEN" | "RESTRICTED",
) {
  const course = await loadCourseForAuthz(courseId);
  authorize(principal, { type: "course:visibility", course });
  return db.course.update({
    where: { id: courseId },
    data: { visibility },
  });
}

export async function deleteCourse(principal: Principal, courseId: string) {
  const course = await loadCourseForAuthz(courseId);
  authorize(principal, { type: "course:delete", course });
  // Soft delete so enrolled learners retain access to already-available content.
  await db.course.update({
    where: { id: courseId },
    data: { deletedAt: new Date(), status: "ARCHIVED" },
  });
}

/** Full course tree for the instructor builder. */
export async function getCourseForEditing(
  principal: Principal,
  courseId: string,
) {
  const authz = await loadCourseForAuthz(courseId);
  authorize(principal, { type: "course:read", course: authz });
  authorize(principal, { type: "course:update", course: authz });

  return db.course.findUnique({
    where: { id: courseId },
    include: {
      category: true,
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { deletedAt: null },
            orderBy: { order: "asc" },
            include: {
              contentBlocks: { orderBy: { order: "asc" } },
              videoQuestions: { orderBy: { atSec: "asc" } },
              quiz: { select: { id: true } },
              assignment: { select: { id: true } },
            },
          },
        },
      },
    },
  });
}

/** Courses owned by the acting instructor. */
export async function listInstructorCourses(principal: Principal) {
  return db.course.findMany({
    where: { instructorId: principal.id, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    include: {
      category: true,
      _count: { select: { modules: true, enrollments: true } },
    },
  });
}

export { ConflictError };
