import { db } from "@/server/db";
import { authorize, type Principal } from "@/server/access/policy";
import { NotFoundError } from "@/server/http";

/**
 * Persist a learner's video playback state for a lesson: the resume position
 * and the accumulated watched seconds (used for watch-gating). Watched time
 * only ever increases — we keep the max so seeking backward can't reduce it.
 */
export async function saveVideoProgress(
  principal: Principal,
  lessonId: string,
  input: { positionSec: number; watchedSec: number },
) {
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, deletedAt: null },
    select: { module: { select: { courseId: true } } },
  });
  if (!lesson) throw new NotFoundError("Lesson not found.");

  const enrollment = await db.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: principal.id,
        courseId: lesson.module.courseId,
      },
    },
    select: { id: true, studentId: true },
  });
  if (!enrollment) throw new NotFoundError("You are not enrolled in this course.");
  authorize(principal, {
    type: "enrollment:read",
    enrollment: { studentId: enrollment.studentId },
  });

  const position = Math.max(0, Math.round(input.positionSec));
  const watched = Math.max(0, Math.round(input.watchedSec));

  const existing = await db.lessonProgress.findUnique({
    where: {
      enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId },
    },
    select: { videoWatchedSec: true },
  });

  await db.lessonProgress.upsert({
    where: {
      enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId },
    },
    create: {
      enrollmentId: enrollment.id,
      lessonId,
      lastPositionSec: position,
      videoWatchedSec: watched,
    },
    update: {
      lastPositionSec: position,
      videoWatchedSec: Math.max(existing?.videoWatchedSec ?? 0, watched),
    },
  });

  return { ok: true as const };
}

/** The acting student's saved video state for a lesson (0s if none yet). */
export async function getVideoProgress(enrollmentId: string, lessonId: string) {
  const p = await db.lessonProgress.findUnique({
    where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
    select: { lastPositionSec: true, videoWatchedSec: true },
  });
  return {
    positionSec: p?.lastPositionSec ?? 0,
    watchedSec: p?.videoWatchedSec ?? 0,
  };
}
