import { db } from "@/server/db";
import { authorize, type Principal } from "@/server/access/policy";
import { NotFoundError } from "@/server/http";
import { loadCourseForAuthz } from "@/server/services/course";
import { loadActiveEnrollmentForAuthz } from "@/server/services/enrollment";

/**
 * Per-course gradebook aggregation (FR-022). For each enrolled student it
 * collects the best quiz score (percentage) per quiz and the assignment score
 * per assignment, plus an overall average across all assessments.
 */

export type AssessmentColumn = {
  id: string;
  kind: "QUIZ" | "ASSIGNMENT";
  title: string;
  lessonTitle: string;
  maxPoints: number | null; // assignments only
};

export type GradebookCell = {
  /** 0–100 percentage, or null when not yet attempted/submitted. */
  percent: number | null;
  /** Human label, e.g. "88%" or "44/50". */
  label: string;
};

export type GradebookRow = {
  student: { id: string; name: string; email: string };
  progressPercent: number;
  status: string;
  cells: Record<string, GradebookCell>;
  average: number | null;
};

export async function getGradebook(principal: Principal, courseId: string) {
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
            select: {
              title: true,
              quiz: { select: { id: true, title: true } },
              assignment: {
                select: { id: true, title: true, maxPoints: true },
              },
            },
          },
        },
      },
    },
  });
  if (!course) throw new NotFoundError("Course not found.");

  // Build the ordered assessment columns.
  const assessments: AssessmentColumn[] = [];
  const quizIds: string[] = [];
  const assignmentIds: string[] = [];
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      if (lesson.quiz) {
        assessments.push({
          id: lesson.quiz.id,
          kind: "QUIZ",
          title: lesson.quiz.title,
          lessonTitle: lesson.title,
          maxPoints: null,
        });
        quizIds.push(lesson.quiz.id);
      }
      if (lesson.assignment) {
        assessments.push({
          id: lesson.assignment.id,
          kind: "ASSIGNMENT",
          title: lesson.assignment.title,
          lessonTitle: lesson.title,
          maxPoints: lesson.assignment.maxPoints,
        });
        assignmentIds.push(lesson.assignment.id);
      }
    }
  }

  const [enrollments, attempts, submissions] = await Promise.all([
    db.enrollment.findMany({
      where: { courseId },
      orderBy: { enrolledAt: "asc" },
      select: {
        studentId: true,
        progressPercent: true,
        status: true,
        student: { select: { id: true, name: true, email: true } },
      },
    }),
    quizIds.length
      ? db.quizAttempt.findMany({
          where: {
            quizId: { in: quizIds },
            status: { in: ["GRADED", "EXPIRED"] },
          },
          select: { quizId: true, studentId: true, score: true },
        })
      : Promise.resolve([]),
    assignmentIds.length
      ? db.submission.findMany({
          where: { assignmentId: { in: assignmentIds }, status: "GRADED" },
          select: { assignmentId: true, studentId: true, score: true },
        })
      : Promise.resolve([]),
  ]);

  // Best quiz score per (student, quiz).
  const bestQuiz = new Map<string, number>(); // key: studentId|quizId
  for (const a of attempts) {
    if (a.score == null) continue;
    const key = `${a.studentId}|${a.quizId}`;
    bestQuiz.set(key, Math.max(bestQuiz.get(key) ?? 0, a.score));
  }
  // Assignment score per (student, assignment).
  const asgScore = new Map<string, number | null>();
  const asgMax = new Map(
    assessments
      .filter((c) => c.kind === "ASSIGNMENT")
      .map((c) => [c.id, c.maxPoints ?? 100]),
  );
  for (const s of submissions) {
    asgScore.set(`${s.studentId}|${s.assignmentId}`, s.score);
  }

  const rows: GradebookRow[] = enrollments.map((enr) => {
    const cells: Record<string, GradebookCell> = {};
    const percents: number[] = [];

    for (const col of assessments) {
      if (col.kind === "QUIZ") {
        const pct = bestQuiz.get(`${enr.studentId}|${col.id}`);
        cells[col.id] =
          pct == null
            ? { percent: null, label: "—" }
            : { percent: pct, label: `${pct}%` };
        if (pct != null) percents.push(pct);
      } else {
        const raw = asgScore.get(`${enr.studentId}|${col.id}`);
        const max = asgMax.get(col.id) ?? 100;
        if (raw == null) {
          cells[col.id] = { percent: null, label: "—" };
        } else {
          const pct = max > 0 ? Math.round((raw / max) * 100) : 0;
          cells[col.id] = { percent: pct, label: `${raw}/${max}` };
          percents.push(pct);
        }
      }
    }

    const average =
      percents.length > 0
        ? Math.round(percents.reduce((s, p) => s + p, 0) / percents.length)
        : null;

    return {
      student: enr.student,
      progressPercent: enr.progressPercent,
      status: enr.status,
      cells,
      average,
    };
  });

  return { course: { id: course.id, title: course.title }, assessments, rows };
}

/** A single student's own grades across a course (their grades view). */
export async function getMyGrades(principal: Principal, courseId: string) {
  try {
    await loadActiveEnrollmentForAuthz(principal.id, courseId);
  } catch {
    throw new NotFoundError("You are not enrolled in this course.");
  }

  const [attempts, submissions] = await Promise.all([
    db.quizAttempt.findMany({
      where: {
        studentId: principal.id,
        status: { in: ["GRADED", "EXPIRED"] },
        quiz: { lesson: { module: { courseId } } },
      },
      orderBy: { submittedAt: "desc" },
      select: {
        score: true,
        passed: true,
        submittedAt: true,
        quiz: { select: { title: true } },
      },
    }),
    db.submission.findMany({
      where: {
        studentId: principal.id,
        assignment: { lesson: { module: { courseId } } },
      },
      orderBy: { submittedAt: "desc" },
      select: {
        score: true,
        feedback: true,
        status: true,
        submittedAt: true,
        assignment: { select: { title: true, maxPoints: true } },
      },
    }),
  ]);

  return { attempts, submissions };
}
