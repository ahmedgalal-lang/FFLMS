import "server-only";
import { db } from "@/server/db";
import { authorize, type Actor } from "@/server/access/authorize";

/**
 * Load a single lesson's content for a learner, enforcing that the actor is
 * enrolled in the course the lesson belongs to (deny-by-default).
 */
export async function getLessonForLearner(
  actor: Actor | null,
  lessonId: string,
) {
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, deletedAt: null },
    include: {
      contentBlocks: { orderBy: { order: "asc" } },
      module: { select: { courseId: true, title: true } },
    },
  });
  if (!lesson) return null;

  const enrollment = actor
    ? await db.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: actor.id,
            courseId: lesson.module.courseId,
          },
        },
      })
    : null;
  if (!enrollment) return null;

  // A student may only read progress/content for their own enrollment.
  authorize(actor, "progress:write", { ownerId: enrollment.studentId });

  return lesson;
}
