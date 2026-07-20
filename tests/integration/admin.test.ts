import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/server/db";
import type { Principal } from "@/server/access/policy";
import { AuthorizationError } from "@/server/access/policy";
import { AppError } from "@/server/http";
import {
  listUsers,
  changeUserRole,
  setUserStatus,
} from "@/server/services/admin";
import {
  submitForReview,
  listReviewQueue,
  approveCourse,
  rejectCourse,
} from "@/server/services/review";
import { createCourse } from "@/server/services/course";
import { addModule, addLesson } from "@/server/services/curriculum";

let admin: Principal;
let instructor: Principal;
let student: Principal;
let studentUserId: string;
let courseId: string;
const userIds: string[] = [];

beforeAll(async () => {
  const suffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const a = await db.user.create({ data: { email: `ad-${suffix}@t.test`, name: "Admin", role: "ADMIN" } });
  const i = await db.user.create({ data: { email: `in-${suffix}@t.test`, name: "Inst", role: "INSTRUCTOR" } });
  const s = await db.user.create({ data: { email: `st-${suffix}@t.test`, name: "Stud", role: "STUDENT" } });
  userIds.push(a.id, i.id, s.id);
  studentUserId = s.id;
  admin = { id: a.id, role: "ADMIN", status: "ACTIVE" };
  instructor = { id: i.id, role: "INSTRUCTOR", status: "ACTIVE" };
  student = { id: s.id, role: "STUDENT", status: "ACTIVE" };

  const course = await createCourse(instructor, {
    title: "Review Flow Course",
    summary: "Course used by the admin review integration test.",
    description: "",
  });
  courseId = course.id;
  const mod = await addModule(instructor, course.id, "M1");
  await addLesson(instructor, mod.id, "L1");
});

afterAll(async () => {
  await db.course.deleteMany({ where: { id: courseId } });
  await db.auditLog.deleteMany({ where: { actorId: { in: userIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("admin user management (US6, FR-003/033)", () => {
  it("only admins may list users", async () => {
    await expect(
      listUsers(instructor, {}, { page: 1, pageSize: 10, skip: 0 }),
    ).rejects.toBeInstanceOf(AuthorizationError);
    const { items } = await listUsers(admin, {}, { page: 1, pageSize: 50, skip: 0 });
    expect(items.length).toBeGreaterThan(0);
  });

  it("changes a role and writes an audit log", async () => {
    const updated = await changeUserRole(admin, studentUserId, "INSTRUCTOR");
    expect(updated.role).toBe("INSTRUCTOR");
    const log = await db.auditLog.findFirst({
      where: { action: "ROLE_CHANGED", targetId: studentUserId },
      orderBy: { createdAt: "desc" },
    });
    expect(log).not.toBeNull();
    expect((log?.metadata as { to?: string })?.to).toBe("INSTRUCTOR");
    // restore
    await changeUserRole(admin, studentUserId, "STUDENT");
  });

  it("suspends and reactivates, auditing each change", async () => {
    const s = await setUserStatus(admin, studentUserId, "SUSPENDED");
    expect(s.status).toBe("SUSPENDED");
    await setUserStatus(admin, studentUserId, "ACTIVE");
    const logs = await db.auditLog.count({
      where: { targetId: studentUserId, action: { in: ["USER_SUSPENDED", "USER_REACTIVATED"] } },
    });
    expect(logs).toBe(2);
  });

  it("prevents an admin from locking themselves out", async () => {
    await expect(changeUserRole(admin, admin.id, "STUDENT")).rejects.toBeInstanceOf(AppError);
    await expect(setUserStatus(admin, admin.id, "SUSPENDED")).rejects.toBeInstanceOf(AppError);
  });
});

describe("course review (US6, FR-025)", () => {
  it("instructor submits, appears in the admin queue", async () => {
    await submitForReview(instructor, courseId);
    const queue = await listReviewQueue(admin);
    expect(queue.some((c) => c.id === courseId)).toBe(true);
  });

  it("a student cannot see the review queue", async () => {
    await expect(listReviewQueue(student)).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rejecting returns it to draft, notifies, and audits with a reason", async () => {
    const rejected = await rejectCourse(admin, courseId, "Add more lessons.");
    expect(rejected.status).toBe("DRAFT");
    const note = await db.notification.findFirst({
      where: { userId: instructor.id, type: "COURSE_STATUS" },
      orderBy: { createdAt: "desc" },
    });
    expect(note?.body).toContain("Add more lessons.");
    const log = await db.auditLog.findFirst({
      where: { action: "COURSE_REJECTED", targetId: courseId },
    });
    expect((log?.metadata as { reason?: string })?.reason).toBe("Add more lessons.");
  });

  it("approving publishes the course", async () => {
    await submitForReview(instructor, courseId);
    const approved = await approveCourse(admin, courseId);
    expect(approved.status).toBe("PUBLISHED");
    expect(approved.publishedAt).toBeInstanceOf(Date);
  });
});
