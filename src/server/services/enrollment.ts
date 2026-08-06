import { db } from "@/server/db";
import { authorize, type Principal } from "@/server/access/policy";
import { NotFoundError } from "@/server/http";
import { loadCourseForAuthz } from "@/server/services/course";

/**
 * Enroll a student in a published course. Idempotent: enrolling twice returns
 * the existing active enrollment rather than creating a duplicate (FR-011),
 * enforced by the unique (studentId, courseId) constraint + upsert.
 */
export async function enroll(principal: Principal, courseId: string) {
  const course = await loadCourseForAuthz(courseId);
  authorize(principal, { type: "enrollment:create", course });

  const enrollment = await db.enrollment.upsert({
    where: {
      studentId_courseId: { studentId: principal.id, courseId },
    },
    update: {}, // idempotent — do not reset progress on re-enroll
    create: { studentId: principal.id, courseId, status: "ACTIVE" },
  });

  // Best-effort enrollment notification.
  await db.notification.create({
    data: {
      userId: principal.id,
      type: "ENROLLMENT",
      title: "You're enrolled",
      body: "Your enrollment is confirmed. Start learning any time.",
      linkUrl: `/my-learning`,
    },
  }).catch(() => undefined);

  return enrollment;
}

export async function getEnrollment(principal: Principal, courseId: string) {
  return db.enrollment.findUnique({
    where: { studentId_courseId: { studentId: principal.id, courseId } },
  });
}

/**
 * Load a student's enrollment for a course, treating a revoked
 * (CANCELLED — see specs/002-assign-courses) enrollment as not found. This is
 * the shared ownership-check loader every learning feature (attempts,
 * submissions, video progress, discussions, gradebook, the player) should use
 * instead of a raw `db.enrollment.findUnique`, so a course-assignment revoke
 * actually blocks continued access everywhere, not just in My Learning.
 */
export async function loadActiveEnrollmentForAuthz(
  studentId: string,
  courseId: string,
) {
  const enrollment = await db.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (!enrollment || enrollment.status === "CANCELLED") {
    throw new NotFoundError("Enrollment not found.");
  }
  return enrollment;
}

/** "My Learning" — the student's enrollments with course + progress. */
export async function listMyEnrollments(principal: Principal) {
  return db.enrollment.findMany({
    where: { studentId: principal.id, status: { not: "CANCELLED" } },
    orderBy: { enrolledAt: "desc" },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          coverImageUrl: true,
          instructor: { select: { name: true } },
        },
      },
    },
  });
}

/** Load an enrollment by id and authorize the acting student owns it. */
export async function loadOwnedEnrollment(
  principal: Principal,
  enrollmentId: string,
) {
  const enrollment = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, studentId: true, courseId: true },
  });
  if (!enrollment) throw new NotFoundError("Enrollment not found.");
  authorize(principal, {
    type: "enrollment:read",
    enrollment: { studentId: enrollment.studentId },
  });
  return enrollment;
}
