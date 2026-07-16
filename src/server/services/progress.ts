import "server-only";
import { db } from "@/server/db";
import { authorize, type Actor } from "@/server/access/authorize";
import {
  computeProgressPercent,
  isCourseComplete,
  firstIncompleteLessonId,
  type LessonRef,
} from "@/server/services/progress-logic";

/** All non-deleted lessons of a course, in curriculum order. */
async function orderedLessons(courseId: string) {
  const modules = await db.module.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
    include: {
      lessons: {
        where: { deletedAt: null },
        orderBy: { order: "asc" },
        select: { id: true, isRequired: true },
      },
    },
  });
  return modules.flatMap((m) => m.lessons);
}

async function recompute(enrollmentId: string, courseId: string) {
  const lessons = await orderedLessons(courseId);
  const completed = await db.lessonProgress.findMany({
    where: { enrollmentId, completedAt: { not: null } },
    select: { lessonId: true },
  });
  const completedIds = completed.map((c) => c.lessonId);

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { completionThreshold: true },
  });
  const refs: LessonRef[] = lessons.map((l) => ({
    id: l.id,
    isRequired: l.isRequired,
  }));
  const percent = computeProgressPercent(refs, completedIds);
  const complete = isCourseComplete(percent, course?.completionThreshold ?? 100);

  await db.enrollment.update({
    where: { id: enrollmentId },
    data: {
      progressPercent: percent,
      status: complete ? "COMPLETED" : "ACTIVE",
      completedAt: complete ? new Date() : null,
    },
  });

  return { percent, courseCompleted: complete };
}

/**
 * Mark a lesson complete for the current student and recompute progress.
 * Only the student who owns the enrollment (or an admin) may write it.
 */
export async function markLessonComplete(
  actor: Actor | null,
  lessonId: string,
  lastPositionSec?: number,
) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { select: { courseId: true } } },
  });
  if (!lesson || lesson.deletedAt) throw new Error("Lesson not found");
  const courseId = lesson.module.courseId;

  const enrollment = actor
    ? await db.enrollment.findUnique({
        where: { studentId_courseId: { studentId: actor.id, courseId } },
      })
    : null;
  if (!enrollment) throw new Error("Not enrolled in this course");

  authorize(actor, "progress:write", { ownerId: enrollment.studentId });

  await db.lessonProgress.upsert({
    where: {
      enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId },
    },
    create: {
      enrollmentId: enrollment.id,
      lessonId,
      completedAt: new Date(),
      lastPositionSec: lastPositionSec ?? null,
    },
    update: { completedAt: new Date(), lastPositionSec: lastPositionSec ?? null },
  });

  return recompute(enrollment.id, courseId);
}

/** Player view: lessons + which are completed + resume target. */
export async function getCourseProgress(actor: Actor | null, courseId: string) {
  const lessons = await orderedLessons(courseId);
  const enrollment = actor
    ? await db.enrollment.findUnique({
        where: { studentId_courseId: { studentId: actor.id, courseId } },
      })
    : null;

  const completedIds = enrollment
    ? (
        await db.lessonProgress.findMany({
          where: { enrollmentId: enrollment.id, completedAt: { not: null } },
          select: { lessonId: true },
        })
      ).map((c) => c.lessonId)
    : [];

  const resumeLessonId = firstIncompleteLessonId(
    lessons.map((l) => l.id),
    completedIds,
  );

  return {
    enrollment,
    completedLessonIds: new Set(completedIds),
    resumeLessonId,
    progressPercent: enrollment?.progressPercent ?? 0,
  };
}
