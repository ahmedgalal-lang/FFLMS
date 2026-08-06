import { db } from "@/server/db";
import { authorize, type Principal } from "@/server/access/policy";
import { loadCourseForAuthz } from "@/server/services/course";
import {
  reconcileEnrollmentAfterRevoke,
  findStudentByEmail,
} from "@/server/services/course-assignment";
import { notify } from "@/server/services/notification";
import { NotFoundError, AppError } from "@/server/http";

/**
 * Named, reusable student cohorts (specs/002-assign-courses). A group's
 * membership is live: joining grants access to every course currently
 * assigned to the group, leaving revokes access granted through that group
 * (unless another route — a direct assignment or a different group —
 * still applies). See course-assignment-calc.ts for the shared
 * reconciliation logic.
 */

/** Load a group's authorization-relevant attributes, or throw 404. */
async function loadGroupForAuthz(groupId: string) {
  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { id: true, ownerId: true, name: true },
  });
  if (!group) throw new NotFoundError("Group not found.");
  return group;
}

async function loadStudent(studentId: string) {
  const student = await db.user.findUnique({
    where: { id: studentId },
    select: { id: true, role: true, name: true, email: true },
  });
  if (!student || student.role !== "STUDENT") {
    throw new AppError("Student account not found.", 404, "STUDENT_NOT_FOUND");
  }
  return student;
}

export async function createGroup(principal: Principal, name: string) {
  // Any instructor (or admin) may create a group — creation has no owning
  // resource yet to check against, ownership starts here.
  if (principal.role !== "INSTRUCTOR" && principal.role !== "ADMIN") {
    throw new AppError("Only instructors or admins can create groups.", 403, "FORBIDDEN");
  }
  return db.group.create({
    data: { name, ownerId: principal.id },
  });
}

/** Groups owned by the acting instructor/admin. */
export async function listGroups(principal: Principal) {
  if (principal.role !== "INSTRUCTOR" && principal.role !== "ADMIN") {
    throw new AppError("Only instructors or admins can view groups.", 403, "FORBIDDEN");
  }
  const where = principal.role === "ADMIN" ? {} : { ownerId: principal.id };
  return db.group.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { memberships: true, courseAssignments: true } },
    },
  });
}

/** A single group's current members and assigned courses. */
export async function getGroup(principal: Principal, groupId: string) {
  const group = await loadGroupForAuthz(groupId);
  authorize(principal, { type: "group:manage", group });

  const [memberships, courseAssignments] = await Promise.all([
    db.groupMembership.findMany({
      where: { groupId },
      orderBy: { addedAt: "desc" },
      include: { student: { select: { id: true, name: true, email: true } } },
    }),
    db.groupCourseAssignment.findMany({
      where: { groupId, revokedAt: null },
      orderBy: { createdAt: "desc" },
      include: { course: { select: { id: true, title: true, slug: true } } },
    }),
  ]);

  return { group, memberships, courseAssignments };
}

/**
 * Add a student to a group: upserts the GroupMembership (idempotent), then
 * grants access to every course currently assigned to the group by
 * upserting an ACTIVE Enrollment for each (FR-007).
 */
export async function addGroupMember(
  principal: Principal,
  groupId: string,
  studentId: string,
) {
  const group = await loadGroupForAuthz(groupId);
  authorize(principal, { type: "group:manage", group });
  const student = await loadStudent(studentId);

  await db.groupMembership.upsert({
    where: { groupId_studentId: { groupId, studentId } },
    update: {},
    create: { groupId, studentId },
  });

  const assignments = await db.groupCourseAssignment.findMany({
    where: { groupId, revokedAt: null },
    select: { courseId: true },
  });

  for (const { courseId } of assignments) {
    await db.enrollment.upsert({
      where: { studentId_courseId: { studentId, courseId } },
      update: { status: "ACTIVE" },
      create: { studentId, courseId, status: "ACTIVE" },
    });
  }

  if (assignments.length > 0) {
    await notify(studentId, {
      type: "ENROLLMENT",
      title: "You've been assigned new courses",
      body: `You were added to "${group.name}" and now have access to ${assignments.length} course(s).`,
      linkUrl: "/my-learning",
    }).catch(() => undefined);
  }

  return student;
}

/** Convenience wrapper for the group page's form: add by email instead of
 * a pre-resolved studentId. */
export async function addGroupMemberByEmail(
  principal: Principal,
  groupId: string,
  email: string,
) {
  const student = await findStudentByEmail(email);
  if (!student) {
    throw new AppError("No student account found with that email.", 404, "STUDENT_NOT_FOUND");
  }
  return addGroupMember(principal, groupId, student.id);
}

/**
 * Remove a student from a group: deletes the membership, then for every
 * course the group grants, cancels the student's Enrollment unless they
 * retain access through another route (FR-008).
 */
export async function removeGroupMember(
  principal: Principal,
  groupId: string,
  studentId: string,
) {
  const group = await loadGroupForAuthz(groupId);
  authorize(principal, { type: "group:manage", group });

  const existing = await db.groupMembership.findUnique({
    where: { groupId_studentId: { groupId, studentId } },
  });
  if (!existing) throw new NotFoundError("Membership not found.");

  const affectedCourses = await db.groupCourseAssignment.findMany({
    where: { groupId, revokedAt: null },
    select: { courseId: true },
  });

  await db.groupMembership.delete({
    where: { groupId_studentId: { groupId, studentId } },
  });

  for (const { courseId } of affectedCourses) {
    await reconcileEnrollmentAfterRevoke(studentId, courseId);
  }
}

/**
 * Assign a course to a group: authorizes against the COURSE (owner or
 * admin), requires it be published, upserts the GroupCourseAssignment, then
 * grants access to every CURRENT member by upserting an ACTIVE Enrollment
 * each. Members added later are handled by addGroupMember's own upsert loop.
 */
export async function assignCourseToGroup(
  principal: Principal,
  groupId: string,
  courseId: string,
) {
  const group = await loadGroupForAuthz(groupId);
  const course = await loadCourseForAuthz(courseId);
  authorize(principal, { type: "course-assignment:manage", course });
  if (course.status !== "PUBLISHED") {
    throw new AppError(
      "Only published courses can be assigned.",
      422,
      "COURSE_NOT_PUBLISHED",
    );
  }

  await db.groupCourseAssignment.upsert({
    where: { groupId_courseId: { groupId, courseId } },
    update: { revokedAt: null },
    create: { groupId, courseId, assignedById: principal.id },
  });

  const members = await db.groupMembership.findMany({
    where: { groupId },
    select: { studentId: true },
  });

  for (const { studentId } of members) {
    await db.enrollment.upsert({
      where: { studentId_courseId: { studentId, courseId } },
      update: { status: "ACTIVE" },
      create: { studentId, courseId, status: "ACTIVE" },
    });
    await notify(studentId, {
      type: "ENROLLMENT",
      title: "You've been assigned a course",
      body: `A new course was assigned to your group "${group.name}".`,
      linkUrl: "/my-learning",
    }).catch(() => undefined);
  }

  return group;
}

/**
 * Revoke a course from a group entirely: for every current member, checks
 * whether they retain access through another route before cancelling their
 * Enrollment (FR-011, edge case "group deleted while it has an assigned
 * course" uses this same reconciliation).
 */
export async function revokeCourseFromGroup(
  principal: Principal,
  groupId: string,
  courseId: string,
) {
  const course = await loadCourseForAuthz(courseId);
  authorize(principal, { type: "course-assignment:manage", course });

  const existing = await db.groupCourseAssignment.findUnique({
    where: { groupId_courseId: { groupId, courseId } },
  });
  if (!existing || existing.revokedAt) {
    throw new NotFoundError("Group course assignment not found.");
  }

  await db.groupCourseAssignment.update({
    where: { groupId_courseId: { groupId, courseId } },
    data: { revokedAt: new Date() },
  });

  const members = await db.groupMembership.findMany({
    where: { groupId },
    select: { studentId: true },
  });
  for (const { studentId } of members) {
    await reconcileEnrollmentAfterRevoke(studentId, courseId);
  }
}

/**
 * Delete a group entirely: reconcile every current member's access to every
 * course the group granted, then remove the group (cascades memberships and
 * course-assignment rows) — spec edge case "group deleted while it has an
 * assigned course".
 */
export async function deleteGroup(principal: Principal, groupId: string) {
  const group = await loadGroupForAuthz(groupId);
  authorize(principal, { type: "group:manage", group });

  const [members, assignments] = await Promise.all([
    db.groupMembership.findMany({ where: { groupId }, select: { studentId: true } }),
    db.groupCourseAssignment.findMany({
      where: { groupId, revokedAt: null },
      select: { courseId: true },
    }),
  ]);

  await db.group.delete({ where: { id: groupId } });

  for (const { studentId } of members) {
    for (const { courseId } of assignments) {
      await reconcileEnrollmentAfterRevoke(studentId, courseId);
    }
  }
}
