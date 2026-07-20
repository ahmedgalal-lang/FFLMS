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

/** "My Learning" — the student's enrollments with course + progress. */
export async function listMyEnrollments(principal: Principal) {
  return db.enrollment.findMany({
    where: { studentId: principal.id },
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
