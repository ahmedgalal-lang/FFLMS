import { db } from "@/server/db";
import { authorize, type Principal } from "@/server/access/policy";
import { NotFoundError, AppError } from "@/server/http";
import {
  computeProgressPercent,
  firstIncompleteLessonId,
  type LessonRef,
} from "@/server/services/progress-calc";

/** Load the active (non-deleted) lessons of a course in curriculum order. */
async function loadOrderedLessons(courseId: string): Promise<LessonRef[]> {
  const modules = await db.module.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
    select: {
      lessons: {
        where: { deletedAt: null },
        orderBy: { order: "asc" },
        select: { id: true, isRequired: true },
      },
    },
  });
  return modules.flatMap((m) => m.lessons);
}

/** Completed lesson ids for an enrollment. */
async function completedLessonIds(enrollmentId: string): Promise<string[]> {
  const rows = await db.lessonProgress.findMany({
    where: { enrollmentId, completedAt: { not: null } },
    select: { lessonId: true },
  });
  return rows.map((r) => r.lessonId);
}

/**
 * Mark a lesson complete for the acting student and recompute course progress.
 * Idempotent — completing an already-complete lesson is a no-op that still
 * returns the current progress. Triggers course completion + certificate when
 * the threshold is met (FR-016).
 */
export async function markLessonComplete(
  principal: Principal,
  lessonId: string,
  lastPositionSec?: number,
) {
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, deletedAt: null },
    select: { id: true, module: { select: { courseId: true } } },
  });
  if (!lesson) throw new NotFoundError("Lesson not found.");
  const courseId = lesson.module.courseId;

  const enrollment = await db.enrollment.findUnique({
    where: { studentId_courseId: { studentId: principal.id, courseId } },
    select: { id: true, studentId: true },
  });
  if (!enrollment) {
    throw new AppError("You must enrol in this course first.", 403, "NOT_ENROLLED");
  }
  authorize(principal, {
    type: "lesson:complete",
    enrollment: { studentId: enrollment.studentId },
  });

  await db.lessonProgress.upsert({
    where: {
      enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId },
    },
    update: {
      completedAt: new Date(),
      ...(lastPositionSec !== undefined ? { lastPositionSec } : {}),
    },
    create: {
      enrollmentId: enrollment.id,
      lessonId,
      completedAt: new Date(),
      lastPositionSec: lastPositionSec ?? null,
    },
  });

  return recomputeProgress(enrollment.id, courseId);
}

/** Recompute and persist an enrollment's progress; complete course if eligible. */
export async function recomputeProgress(enrollmentId: string, courseId: string) {
  const [lessons, completed, course] = await Promise.all([
    loadOrderedLessons(courseId),
    completedLessonIds(enrollmentId),
    db.course.findUnique({
      where: { id: courseId },
      select: { completionThreshold: true },
    }),
  ]);

  const percent = computeProgressPercent(lessons, completed);
  const threshold = course?.completionThreshold ?? 100;
  const complete = percent >= threshold && lessons.length > 0;

  const enrollment = await db.enrollment.update({
    where: { id: enrollmentId },
    data: {
      progressPercent: percent,
      ...(complete
        ? { status: "COMPLETED", completedAt: new Date() }
        : { status: "ACTIVE", completedAt: null }),
    },
    select: { id: true, studentId: true, status: true, progressPercent: true },
  });

  if (complete) {
    await issueCertificateIfEligible(enrollment.studentId, courseId);
  }
  return { progressPercent: percent, completed: complete };
}

/** Resume point: first incomplete lesson id, or null when done. */
export async function getResumeLessonId(
  enrollmentId: string,
  courseId: string,
): Promise<string | null> {
  const [lessons, completed] = await Promise.all([
    loadOrderedLessons(courseId),
    completedLessonIds(enrollmentId),
  ]);
  return firstIncompleteLessonId(lessons, completed);
}

/** Set of completed lesson ids for rendering the player checklist. */
export async function getCompletedSet(enrollmentId: string) {
  return new Set(await completedLessonIds(enrollmentId));
}

async function issueCertificateIfEligible(studentId: string, courseId: string) {
  const existing = await db.certificate.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (existing) return existing;
  const code = cryptoRandomCode();
  return db.certificate
    .create({
      data: { studentId, courseId, verificationCode: code },
    })
    .catch(() => undefined); // unique race → certificate already exists
}

/** 128-bit unguessable, URL-safe verification code (SC-008). */
function cryptoRandomCode(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
