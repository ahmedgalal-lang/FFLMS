import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/server/db";
import type { Principal } from "@/server/access/policy";
import { AuthorizationError } from "@/server/access/policy";
import { createCourse, setCourseVisibility } from "@/server/services/course";
import { addModule, addLesson } from "@/server/services/curriculum";
import { publishCourse } from "@/server/services/publish";
import { assignCourseToStudent } from "@/server/services/course-assignment";
import {
  createGroup,
  addGroupMember,
  removeGroupMember,
  assignCourseToGroup,
  revokeCourseFromGroup,
  deleteGroup,
  getGroup,
} from "@/server/services/group";

let admin: Principal;
let instructor: Principal;
let otherInstructor: Principal;
let courseId: string;
let suffix: string;
let studentTag = 0;
const userIds: string[] = [];
const courseIds: string[] = [];
const groupIds: string[] = [];

/** A fresh student dedicated to one test — never reused across tests, so
 * group-derived access from an earlier test can never leak into another. */
async function newStudent(): Promise<Principal> {
  const u = await db.user.create({
    data: {
      email: `grp-s${studentTag++}-${suffix}@t.test`,
      name: `Student ${studentTag}`,
      role: "STUDENT",
    },
  });
  userIds.push(u.id);
  return { id: u.id, role: "STUDENT", status: "ACTIVE" };
}

beforeAll(async () => {
  suffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const a = await db.user.create({
    data: { email: `grp-admin-${suffix}@t.test`, name: "Admin", role: "ADMIN" },
  });
  const i = await db.user.create({
    data: { email: `grp-inst-${suffix}@t.test`, name: "Inst", role: "INSTRUCTOR" },
  });
  const i2 = await db.user.create({
    data: { email: `grp-inst2-${suffix}@t.test`, name: "Inst2", role: "INSTRUCTOR" },
  });
  userIds.push(a.id, i.id, i2.id);
  admin = { id: a.id, role: "ADMIN", status: "ACTIVE" };
  instructor = { id: i.id, role: "INSTRUCTOR", status: "ACTIVE" };
  otherInstructor = { id: i2.id, role: "INSTRUCTOR", status: "ACTIVE" };

  const course = await createCourse(instructor, {
    title: "Group Assignment Test Course",
    summary: "Course for the group integration test.",
    description: "",
  });
  courseId = course.id;
  courseIds.push(courseId);
  const mod = await addModule(instructor, course.id, "M1");
  await addLesson(instructor, mod.id, "L1");
  await publishCourse(instructor, course.id);
  await setCourseVisibility(instructor, course.id, "RESTRICTED");
});

afterAll(async () => {
  await db.group.deleteMany({ where: { id: { in: groupIds } } });
  await db.course.deleteMany({ where: { id: { in: courseIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("groups (US2, FR-005–FR-007, FR-010)", () => {
  it("creates a group, adds members, assigns a course — every current member is enrolled", async () => {
    const s1 = await newStudent();
    const s2 = await newStudent();
    const group = await createGroup(instructor, "Cohort A");
    groupIds.push(group.id);

    await addGroupMember(instructor, group.id, s1.id);
    await addGroupMember(instructor, group.id, s2.id);
    await assignCourseToGroup(instructor, group.id, courseId);

    for (const s of [s1, s2]) {
      const enrollment = await db.enrollment.findUnique({
        where: { studentId_courseId: { studentId: s.id, courseId } },
      });
      expect(enrollment?.status).toBe("ACTIVE");
    }
  });

  it("adding a member after the course was already assigned auto-enrolls them", async () => {
    const s = await newStudent();
    const group = await createGroup(instructor, "Cohort B");
    groupIds.push(group.id);
    await assignCourseToGroup(instructor, group.id, courseId);

    await addGroupMember(instructor, group.id, s.id);

    const enrollment = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: s.id, courseId } },
    });
    expect(enrollment?.status).toBe("ACTIVE");
  });

  it("removing a member revokes their group-derived access", async () => {
    const s = await newStudent();
    const group = await createGroup(instructor, "Cohort C");
    groupIds.push(group.id);
    await addGroupMember(instructor, group.id, s.id);
    await assignCourseToGroup(instructor, group.id, courseId);

    await removeGroupMember(instructor, group.id, s.id);

    const enrollment = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: s.id, courseId } },
    });
    expect(enrollment?.status).toBe("CANCELLED");
  });

  it("a student who is directly assigned AND removed from a group keeps access (multiple routes)", async () => {
    const s = await newStudent();
    const group = await createGroup(instructor, "Cohort D");
    groupIds.push(group.id);
    await addGroupMember(instructor, group.id, s.id);
    await assignCourseToGroup(instructor, group.id, courseId);
    await assignCourseToStudent(instructor, courseId, s.id);

    await removeGroupMember(instructor, group.id, s.id);

    const enrollment = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: s.id, courseId } },
    });
    expect(enrollment?.status).toBe("ACTIVE");
  });

  it("a student in two groups keeps access after leaving just one", async () => {
    const s = await newStudent();
    const groupA = await createGroup(instructor, "Cohort E1");
    const groupB = await createGroup(instructor, "Cohort E2");
    groupIds.push(groupA.id, groupB.id);
    await addGroupMember(instructor, groupA.id, s.id);
    await addGroupMember(instructor, groupB.id, s.id);
    await assignCourseToGroup(instructor, groupA.id, courseId);
    await assignCourseToGroup(instructor, groupB.id, courseId);

    await removeGroupMember(instructor, groupA.id, s.id);

    const enrollment = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: s.id, courseId } },
    });
    expect(enrollment?.status).toBe("ACTIVE");
  });

  it("assigning the same course to a group twice is idempotent", async () => {
    const group = await createGroup(instructor, "Cohort F");
    groupIds.push(group.id);
    await assignCourseToGroup(instructor, group.id, courseId);
    await assignCourseToGroup(instructor, group.id, courseId);
    const count = await db.groupCourseAssignment.count({
      where: { groupId: group.id, courseId },
    });
    expect(count).toBe(1);
  });

  it("an admin can manage any group; a non-owning instructor cannot", async () => {
    const s = await newStudent();
    const group = await createGroup(instructor, "Cohort G");
    groupIds.push(group.id);

    await expect(
      addGroupMember(otherInstructor, group.id, s.id),
    ).rejects.toBeInstanceOf(AuthorizationError);

    await expect(getGroup(admin, group.id)).resolves.toBeDefined();
  });
});

describe("revokeCourseFromGroup / deleteGroup (US3, FR-011, edge case)", () => {
  it("revoking a group's course assignment cancels every member's Enrollment (unless another route remains)", async () => {
    const s = await newStudent();
    const group = await createGroup(instructor, "Cohort H");
    groupIds.push(group.id);
    await addGroupMember(instructor, group.id, s.id);
    await assignCourseToGroup(instructor, group.id, courseId);

    await revokeCourseFromGroup(instructor, group.id, courseId);

    const enrollment = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: s.id, courseId } },
    });
    expect(enrollment?.status).toBe("CANCELLED");
  });

  it("deleting a group with an assigned course revokes members' group-derived access", async () => {
    const s = await newStudent();
    const group = await createGroup(instructor, "Cohort I");
    await addGroupMember(instructor, group.id, s.id);
    await assignCourseToGroup(instructor, group.id, courseId);

    await deleteGroup(instructor, group.id);

    const enrollment = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: s.id, courseId } },
    });
    expect(enrollment?.status).toBe("CANCELLED");

    const gone = await db.group.findUnique({ where: { id: group.id } });
    expect(gone).toBeNull();
  });
});
