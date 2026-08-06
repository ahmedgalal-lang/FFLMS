import { db } from "@/server/db";
import { authorize, type Principal } from "@/server/access/policy";
import { loadCourseForAuthz } from "@/server/services/course";
import { hasRemainingAccess } from "@/server/services/course-assignment-calc";
import { notify } from "@/server/services/notification";
import { NotFoundError, AppError } from "@/server/http";

/**
 * Grants of course *access* (specs/002-assign-courses) — direct
 * student assignment. Unrelated to the coursework `Assignment` model/service
 * (`src/server/services/assignment.ts`), which is about gradable lesson
 * content, not who can access a course.
 */

async function loadStudent(studentId: string) {
  const student = await db.user.findUnique({
    where: { id: studentId },
    select: { id: true, role: true, status: true, name: true, email: true },
  });
  if (!student || student.role !== "STUDENT") {
    throw new AppError("Student account not found.", 404, "STUDENT_NOT_FOUND");
  }
  return student;
}

/** Resolve a student account by email — used by the Studio assignment panel,
 * which only knows the email an instructor typed in. */
export async function findStudentByEmail(email: string) {
  const student = await db.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, role: true, name: true, email: true },
  });
  if (!student || student.role !== "STUDENT") return null;
  return student;
}

/** Convenience wrapper for the assignment panel form: assign by email
 * instead of a pre-resolved studentId. */
export async function assignCourseToStudentByEmail(
  principal: Principal,
  courseId: string,
  email: string,
) {
  const student = await findStudentByEmail(email);
  if (!student) {
    throw new AppError("No student account found with that email.", 404, "STUDENT_NOT_FOUND");
  }
  return assignCourseToStudent(principal, courseId, student.id);
}

/**
 * Grant a student direct access to a course: authorizes, requires the course
 * be published, upserts the CourseAssignment (idempotent — re-assigning after
 * a revoke clears revokedAt instead of creating a second row), then upserts
 * an ACTIVE Enrollment so the student sees it in My Learning immediately
 * (auto-enroll — see specs/002-assign-courses/research.md Decision 1).
 */
export async function assignCourseToStudent(
  principal: Principal,
  courseId: string,
  studentId: string,
) {
  const course = await loadCourseForAuthz(courseId);
  authorize(principal, { type: "course-assignment:manage", course });
  if (course.status !== "PUBLISHED") {
    throw new AppError(
      "Only published courses can be assigned.",
      422,
      "COURSE_NOT_PUBLISHED",
    );
  }
  const student = await loadStudent(studentId);

  const assignment = await db.courseAssignment.upsert({
    where: { courseId_studentId: { courseId, studentId } },
    update: { revokedAt: null },
    create: { courseId, studentId, assignedById: principal.id },
  });

  await db.enrollment.upsert({
    where: { studentId_courseId: { studentId, courseId } },
    update: { status: "ACTIVE" },
    create: { studentId, courseId, status: "ACTIVE" },
  });

  await notify(studentId, {
    type: "ENROLLMENT",
    title: "You've been assigned a course",
    body: "A new course has been assigned to you. Start learning any time.",
    linkUrl: `/my-learning`,
  }).catch(() => undefined);

  return { assignment, student };
}

/** Revoke a student's direct assignment; cancels their Enrollment unless a
 * group still grants them access (see course-assignment-calc.ts). */
export async function revokeCourseFromStudent(
  principal: Principal,
  courseId: string,
  studentId: string,
) {
  const course = await loadCourseForAuthz(courseId);
  authorize(principal, { type: "course-assignment:manage", course });

  const existing = await db.courseAssignment.findUnique({
    where: { courseId_studentId: { courseId, studentId } },
  });
  if (!existing || existing.revokedAt) {
    throw new NotFoundError("Assignment not found.");
  }

  await db.courseAssignment.update({
    where: { courseId_studentId: { courseId, studentId } },
    data: { revokedAt: new Date() },
  });

  await reconcileEnrollmentAfterRevoke(studentId, courseId);
}

/**
 * After any grant is revoked (direct or, from group.ts, group-derived),
 * check whether the student retains access through another route; cancel
 * their Enrollment only if nothing remains. Progress/grades/certificates are
 * never touched — only Enrollment.status changes (FR-009).
 */
export async function reconcileEnrollmentAfterRevoke(
  studentId: string,
  courseId: string,
) {
  const [directAssignments, memberships, groupCourseAssignments] =
    await Promise.all([
      db.courseAssignment.findMany({
        where: { studentId, courseId },
        select: { studentId: true, courseId: true, revokedAt: true },
      }),
      db.groupMembership.findMany({
        where: { studentId },
        select: { studentId: true, groupId: true },
      }),
      db.groupCourseAssignment.findMany({
        where: { courseId },
        select: { groupId: true, courseId: true, revokedAt: true },
      }),
    ]);

  const stillHasAccess = hasRemainingAccess(studentId, courseId, {
    directAssignments,
    memberships,
    groupCourseAssignments,
  });

  if (!stillHasAccess) {
    await db.enrollment.updateMany({
      where: { studentId, courseId, status: { not: "CANCELLED" } },
      data: { status: "CANCELLED" },
    });
  }
}

/** Direct assignments currently on a course, for the instructor's assignment panel. */
export async function listCourseAssignments(
  principal: Principal,
  courseId: string,
) {
  const course = await loadCourseForAuthz(courseId);
  authorize(principal, { type: "course-assignment:manage", course });

  return db.courseAssignment.findMany({
    where: { courseId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    include: { student: { select: { id: true, name: true, email: true } } },
  });
}
