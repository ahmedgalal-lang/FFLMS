import { db } from "@/server/db";
import { authorize, type Principal } from "@/server/access/policy";
import { NotFoundError, AppError } from "@/server/http";
import { loadCourseForAuthz } from "@/server/services/course";
import { getPublishReadiness } from "@/server/services/publish";
import { writeAudit } from "@/server/services/admin";

/**
 * Course review workflow (FR-025). Instructors submit a complete course for
 * review; admins approve (→ Published), reject (→ Draft, with a reason), or
 * archive. Admin decisions are audited (FR-033) and notify the instructor.
 */

/** Instructor submits their own course for admin review. */
export async function submitForReview(principal: Principal, courseId: string) {
  const course = await loadCourseForAuthz(courseId);
  authorize(principal, { type: "course:publish", course });
  if (course.status !== "DRAFT") {
    throw new AppError("Only draft courses can be submitted for review.", 422, "BAD_STATE");
  }
  const problems = await getPublishReadiness(principal, courseId);
  if (problems.length > 0) {
    throw new AppError(`Cannot submit: ${problems.join(" ")}`, 422, "INCOMPLETE");
  }
  return db.course.update({
    where: { id: courseId },
    data: { status: "IN_REVIEW" },
  });
}

export async function listReviewQueue(principal: Principal) {
  authorize(principal, { type: "admin:review" });
  return db.course.findMany({
    where: { status: "IN_REVIEW", deletedAt: null },
    orderBy: { updatedAt: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      updatedAt: true,
      instructor: { select: { name: true, email: true } },
      _count: { select: { modules: true } },
    },
  });
}

async function loadReviewable(courseId: string) {
  const course = await db.course.findFirst({
    where: { id: courseId, deletedAt: null },
    select: { id: true, status: true, instructorId: true, title: true },
  });
  if (!course) throw new NotFoundError("Course not found.");
  return course;
}

export async function approveCourse(principal: Principal, courseId: string) {
  authorize(principal, { type: "admin:review" });
  const course = await loadReviewable(courseId);
  if (course.status !== "IN_REVIEW") {
    throw new AppError("Only courses in review can be approved.", 422, "BAD_STATE");
  }
  const updated = await db.course.update({
    where: { id: courseId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
  await writeAudit(principal.id, "COURSE_APPROVED", "Course", courseId);
  await db.notification
    .create({
      data: {
        userId: course.instructorId,
        type: "COURSE_STATUS",
        title: "Course approved",
        body: `"${course.title}" has been approved and published.`,
        linkUrl: `/studio/${courseId}`,
      },
    })
    .catch(() => undefined);
  return updated;
}

export async function rejectCourse(
  principal: Principal,
  courseId: string,
  reason: string,
) {
  authorize(principal, { type: "admin:review" });
  const course = await loadReviewable(courseId);
  if (course.status !== "IN_REVIEW") {
    throw new AppError("Only courses in review can be rejected.", 422, "BAD_STATE");
  }
  const updated = await db.course.update({
    where: { id: courseId },
    data: { status: "DRAFT" },
  });
  await writeAudit(principal.id, "COURSE_REJECTED", "Course", courseId, { reason });
  await db.notification
    .create({
      data: {
        userId: course.instructorId,
        type: "COURSE_STATUS",
        title: "Course needs changes",
        body: `"${course.title}" was not approved: ${reason}`,
        linkUrl: `/studio/${courseId}`,
      },
    })
    .catch(() => undefined);
  return updated;
}

export async function archiveCourse(principal: Principal, courseId: string) {
  authorize(principal, { type: "admin:review" });
  const course = await loadReviewable(courseId);
  const updated = await db.course.update({
    where: { id: courseId },
    data: { status: "ARCHIVED" },
  });
  await writeAudit(principal.id, "COURSE_ARCHIVED", "Course", courseId, {
    from: course.status,
  });
  return updated;
}
