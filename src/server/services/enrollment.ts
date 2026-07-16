import "server-only";
import { db } from "@/server/db";
import { authorize, type Actor } from "@/server/access/authorize";

/**
 * Enroll a student in a published course. Idempotent per (student, course)
 * (spec FR-011): a second call returns the existing active enrollment.
 */
export async function enroll(actor: Actor | null, courseId: string) {
  authorize(actor, "course:enroll");

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course || course.status !== "PUBLISHED" || course.deletedAt) {
    throw new Error("Course is not available for enrollment");
  }

  const existing = await db.enrollment.findUnique({
    where: { studentId_courseId: { studentId: actor!.id, courseId } },
  });
  if (existing) return { enrollment: existing, created: false };

  const enrollment = await db.enrollment.create({
    data: { studentId: actor!.id, courseId },
  });
  return { enrollment, created: true };
}

/** "My Learning" list for the current student. */
export async function listMyEnrollments(actor: Actor | null) {
  if (!actor) return [];
  return db.enrollment.findMany({
    where: { studentId: actor.id },
    orderBy: { enrolledAt: "desc" },
    include: {
      course: {
        include: { instructor: { select: { name: true } }, category: true },
      },
    },
  });
}

export async function getEnrollment(actor: Actor | null, courseId: string) {
  if (!actor) return null;
  return db.enrollment.findUnique({
    where: { studentId_courseId: { studentId: actor.id, courseId } },
  });
}
