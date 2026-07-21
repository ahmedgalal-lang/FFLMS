import { db } from "@/server/db";
import { authorize, type Principal } from "@/server/access/policy";
import { NotFoundError } from "@/server/http";
import { loadCourseForAuthz } from "@/server/services/course";

/**
 * Course + organization analytics (FR-030). Course analytics are readable by the
 * owning instructor (via gradebook:read); org reports by admins (admin:reports).
 */

export type LessonDropoff = {
  lessonId: string;
  title: string;
  completed: number;
  completionRate: number; // % of active enrollments
};

export async function getCourseAnalytics(
  principal: Principal,
  courseId: string,
) {
  const authz = await loadCourseForAuthz(courseId);
  authorize(principal, { type: "gradebook:read", course: authz });

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      modules: {
        orderBy: { order: "asc" },
        select: {
          lessons: {
            where: { deletedAt: null },
            orderBy: { order: "asc" },
            select: { id: true, title: true },
          },
        },
      },
    },
  });
  if (!course) throw new NotFoundError("Course not found.");

  const lessons = course.modules.flatMap((m) => m.lessons);
  const lessonIds = lessons.map((l) => l.id);

  const [total, completed, progressGroups, quizAgg, subAgg] = await Promise.all([
    db.enrollment.count({ where: { courseId } }),
    db.enrollment.count({ where: { courseId, status: "COMPLETED" } }),
    lessonIds.length
      ? db.lessonProgress.groupBy({
          by: ["lessonId"],
          where: { lessonId: { in: lessonIds }, completedAt: { not: null } },
          _count: { lessonId: true },
        })
      : Promise.resolve([]),
    db.quizAttempt.aggregate({
      where: {
        status: { in: ["GRADED", "EXPIRED"] },
        quiz: { lesson: { module: { courseId } } },
      },
      _avg: { score: true },
      _count: { _all: true },
    }),
    db.submission.aggregate({
      where: {
        status: "GRADED",
        assignment: { lesson: { module: { courseId } } },
      },
      _avg: { score: true },
      _count: { _all: true },
    }),
  ]);

  const completedByLesson = new Map(
    progressGroups.map((g) => [g.lessonId, g._count.lessonId]),
  );
  const dropoff: LessonDropoff[] = lessons.map((l) => {
    const done = completedByLesson.get(l.id) ?? 0;
    return {
      lessonId: l.id,
      title: l.title,
      completed: done,
      completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });

  return {
    course: { id: course.id, title: course.title },
    enrollments: { total, completed, active: total - completed },
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    avgQuizScore:
      quizAgg._avg.score != null ? Math.round(quizAgg._avg.score) : null,
    quizAttempts: quizAgg._count._all,
    avgAssignmentScore:
      subAgg._avg.score != null ? Math.round(subAgg._avg.score) : null,
    gradedSubmissions: subAgg._count._all,
    lessonDropoff: dropoff,
  };
}

/** Organization-wide reports for admins (FR-030/026). */
export async function getOrgReports(principal: Principal) {
  authorize(principal, { type: "admin:reports" });

  const [
    totalUsers,
    totalEnrollments,
    totalCompletions,
    publishedCourses,
    certificates,
    topCoursesRaw,
  ] = await Promise.all([
    db.user.count(),
    db.enrollment.count(),
    db.enrollment.count({ where: { status: "COMPLETED" } }),
    db.course.count({ where: { status: "PUBLISHED", deletedAt: null } }),
    db.certificate.count({ where: { revokedAt: null } }),
    db.enrollment.groupBy({
      by: ["courseId"],
      _count: { courseId: true },
      orderBy: { _count: { courseId: "desc" } },
      take: 5,
    }),
  ]);

  const topCourses = await Promise.all(
    topCoursesRaw.map(async (g) => {
      const course = await db.course.findUnique({
        where: { id: g.courseId },
        select: { title: true },
      });
      return {
        title: course?.title ?? "(deleted)",
        enrollments: g._count.courseId,
      };
    }),
  );

  return {
    totalUsers,
    totalEnrollments,
    totalCompletions,
    publishedCourses,
    certificates,
    overallCompletionRate:
      totalEnrollments > 0
        ? Math.round((totalCompletions / totalEnrollments) * 100)
        : 0,
    topCourses,
  };
}
