import { db } from "@/server/db";
import { authorize, type Principal } from "@/server/access/policy";
import { loadCourseForAuthz } from "@/server/services/course";
import { AppError, NotFoundError } from "@/server/http";

/** Shape needed to evaluate the publish completeness gate (FR-008). */
export type PublishCandidate = {
  title: string;
  summary: string;
  modules: { lessons: { id: string; deletedAt: Date | null }[] }[];
};

/**
 * Pure completeness check — returns the list of unmet requirements. Empty array
 * means the course is publishable. Kept pure so it is exhaustively unit-tested.
 */
export function publishReadiness(course: PublishCandidate): string[] {
  const problems: string[] = [];
  if (!course.title?.trim()) problems.push("A title is required.");
  if (!course.summary?.trim()) problems.push("A summary is required.");

  const activeModules = course.modules.filter((m) =>
    m.lessons.some((l) => l.deletedAt === null),
  );
  if (course.modules.length === 0) {
    problems.push("Add at least one module.");
  }
  const totalLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.deletedAt === null).length,
    0,
  );
  if (totalLessons === 0) {
    problems.push("Add at least one lesson.");
  } else if (activeModules.length === 0) {
    problems.push("At least one module must contain a lesson.");
  }
  return problems;
}

export function isPublishable(course: PublishCandidate): boolean {
  return publishReadiness(course).length === 0;
}

/** Load the readiness of a course from the database (for UI + gate). */
export async function getPublishReadiness(
  principal: Principal,
  courseId: string,
) {
  const authz = await loadCourseForAuthz(courseId);
  authorize(principal, { type: "course:publish", course: authz });
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      title: true,
      summary: true,
      modules: {
        select: { lessons: { select: { id: true, deletedAt: true } } },
      },
    },
  });
  if (!course) throw new NotFoundError("Course not found.");
  return publishReadiness(course);
}

export async function publishCourse(principal: Principal, courseId: string) {
  const authz = await loadCourseForAuthz(courseId);
  authorize(principal, { type: "course:publish", course: authz });

  const problems = await getPublishReadiness(principal, courseId);
  if (problems.length > 0) {
    throw new AppError(
      `Cannot publish: ${problems.join(" ")}`,
      422,
      "PUBLISH_INCOMPLETE",
    );
  }
  return db.course.update({
    where: { id: courseId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
}

export async function unpublishCourse(principal: Principal, courseId: string) {
  const authz = await loadCourseForAuthz(courseId);
  authorize(principal, { type: "course:publish", course: authz });
  return db.course.update({
    where: { id: courseId },
    data: { status: "DRAFT" },
  });
}
