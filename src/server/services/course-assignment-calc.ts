/**
 * Pure course-access reconciliation (Constitution Principle IV;
 * specs/002-assign-courses FR-008, FR-011).
 *
 * A student's access to a RESTRICTED course comes from two possible routes:
 * a direct CourseAssignment, or membership in a Group that has a
 * GroupCourseAssignment for that course. This module answers "does the
 * student still have ANY route to a course" given the current state of both,
 * with no database access — the DB-touching callers in course-assignment.ts
 * and group.ts use this to decide whether to upsert or cancel the student's
 * Enrollment when a grant or a group membership changes.
 *
 * Not to be confused with the coursework `Assignment` model/grading logic —
 * this is purely about course *access*.
 */

export type DirectAssignmentRef = {
  studentId: string;
  courseId: string;
  revokedAt: Date | null;
};

export type GroupMembershipRef = {
  studentId: string;
  groupId: string;
};

export type GroupCourseAssignmentRef = {
  groupId: string;
  courseId: string;
  revokedAt: Date | null;
};

/**
 * Whether `studentId` currently has any route (direct or group-derived) to
 * `courseId`, given the full set of relevant assignment/membership rows.
 * Callers pass only the rows relevant to this student/course to keep the
 * inputs small, but the function itself doesn't assume pre-filtering.
 */
export function hasRemainingAccess(
  studentId: string,
  courseId: string,
  state: {
    directAssignments: DirectAssignmentRef[];
    memberships: GroupMembershipRef[];
    groupCourseAssignments: GroupCourseAssignmentRef[];
  },
): boolean {
  const hasDirect = state.directAssignments.some(
    (a) =>
      a.studentId === studentId && a.courseId === courseId && a.revokedAt === null,
  );
  if (hasDirect) return true;

  const activeGroupIdsForCourse = new Set(
    state.groupCourseAssignments
      .filter((ga) => ga.courseId === courseId && ga.revokedAt === null)
      .map((ga) => ga.groupId),
  );
  if (activeGroupIdsForCourse.size === 0) return false;

  return state.memberships.some(
    (m) => m.studentId === studentId && activeGroupIdsForCourse.has(m.groupId),
  );
}
