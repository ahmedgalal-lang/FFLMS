import { db } from "@/server/db";
import { authorize, type Principal } from "@/server/access/policy";
import { NotFoundError } from "@/server/http";
import { getResumeLessonId, getCompletedSet } from "@/server/services/progress";
import { getVideoProgress } from "@/server/services/video-progress";

/**
 * Load everything the course player needs for an enrolled student: the full
 * curriculum, which lessons are complete, the current lesson's content, and the
 * resume point. Authorizes that the acting principal owns the enrollment.
 */
export async function loadPlayer(
  principal: Principal,
  slug: string,
  lessonId?: string,
) {
  const course = await db.course.findFirst({
    where: { slug, deletedAt: null },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { deletedAt: null },
            orderBy: { order: "asc" },
            select: { id: true, title: true, isRequired: true, moduleId: true },
          },
        },
      },
    },
  });
  if (!course) throw new NotFoundError("Course not found.");

  const enrollment = await db.enrollment.findUnique({
    where: {
      studentId_courseId: { studentId: principal.id, courseId: course.id },
    },
    select: { id: true, studentId: true, progressPercent: true, status: true },
  });
  if (!enrollment) throw new NotFoundError("You are not enrolled in this course.");
  authorize(principal, {
    type: "enrollment:read",
    enrollment: { studentId: enrollment.studentId },
  });

  const [completed, resumeId] = await Promise.all([
    getCompletedSet(enrollment.id),
    getResumeLessonId(enrollment.id, course.id),
  ]);

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const currentId =
    lessonId ?? resumeId ?? allLessons[0]?.id ?? null;

  const currentLesson = currentId
    ? await db.lesson.findFirst({
        where: { id: currentId, deletedAt: null },
        include: {
          contentBlocks: { orderBy: { order: "asc" } },
          videoQuestions: { orderBy: { atSec: "asc" } },
          quiz: { select: { id: true, title: true } },
          assignment: {
            select: {
              id: true,
              title: true,
              instructions: true,
              dueAt: true,
              allowText: true,
              allowFile: true,
              maxPoints: true,
            },
          },
        },
      })
    : null;

  // Saved video playback state (resume point + watched seconds) for gating.
  const videoProgress =
    currentLesson && currentId
      ? await getVideoProgress(enrollment.id, currentId)
      : { positionSec: 0, watchedSec: 0 };

  // The acting student's submission for the current lesson's assignment, if any.
  const mySubmission = currentLesson?.assignment
    ? await db.submission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId: currentLesson.assignment.id,
            studentId: principal.id,
          },
        },
        select: {
          id: true,
          text: true,
          fileUrl: true,
          status: true,
          isLate: true,
          score: true,
          feedback: true,
        },
      })
    : null;

  return {
    course,
    enrollment,
    completedIds: completed,
    currentLesson,
    videoProgress,
    mySubmission,
    isCurrentComplete: currentId ? completed.has(currentId) : false,
  };
}
