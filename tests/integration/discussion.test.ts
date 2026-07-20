import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/server/db";
import type { Principal } from "@/server/access/policy";
import { AuthorizationError } from "@/server/access/policy";
import { createCourse } from "@/server/services/course";
import { addModule, addLesson } from "@/server/services/curriculum";
import { publishCourse } from "@/server/services/publish";
import { enroll } from "@/server/services/enrollment";
import {
  createThread,
  listThreads,
  getThread,
  addPost,
} from "@/server/services/discussion";
import { createAnnouncement } from "@/server/services/announcement";
import {
  listNotifications,
  markAllRead,
  unreadCount,
} from "@/server/services/notification";

let instructor: Principal;
let student: Principal;
let outsider: Principal;
let courseId: string;
const userIds: string[] = [];

beforeAll(async () => {
  const suffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const i = await db.user.create({ data: { email: `di-${suffix}@t.test`, name: "DInst", role: "INSTRUCTOR" } });
  const s = await db.user.create({ data: { email: `ds-${suffix}@t.test`, name: "DStud", role: "STUDENT" } });
  const o = await db.user.create({ data: { email: `do-${suffix}@t.test`, name: "DOut", role: "STUDENT" } });
  userIds.push(i.id, s.id, o.id);
  instructor = { id: i.id, role: "INSTRUCTOR", status: "ACTIVE" };
  student = { id: s.id, role: "STUDENT", status: "ACTIVE" };
  outsider = { id: o.id, role: "STUDENT", status: "ACTIVE" };

  const course = await createCourse(instructor, {
    title: "Discussion Course",
    summary: "Course for discussion integration tests.",
    description: "",
  });
  courseId = course.id;
  const mod = await addModule(instructor, course.id, "M1");
  await addLesson(instructor, mod.id, "L1");
  await publishCourse(instructor, course.id);
  await enroll(student, course.id);
});

afterAll(async () => {
  await db.course.deleteMany({ where: { id: courseId } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("discussions (US7, FR-027)", () => {
  it("an enrolled student can create a thread; a non-enrolled user cannot", async () => {
    const thread = await createThread(student, {
      courseId,
      title: "How do server components work?",
      body: "Can someone explain?",
    });
    expect(thread.id).toBeTruthy();

    await expect(
      createThread(outsider, { courseId, title: "Sneaky", body: "no access" }),
    ).rejects.toBeInstanceOf(AuthorizationError);

    const threads = await listThreads(instructor, courseId);
    expect(threads.some((t) => t.id === thread.id)).toBe(true);
  });

  it("an instructor reply notifies the thread's author (FR-028)", async () => {
    await markAllRead(student);
    const thread = await createThread(student, {
      courseId,
      title: "Need help with quizzes",
      body: "How are they graded?",
    });
    await addPost(instructor, { threadId: thread.id, body: "They auto-grade." });

    const { items } = await listNotifications(student, { page: 1, pageSize: 10, skip: 0 });
    const reply = items.find((n) => n.type === "DISCUSSION_REPLY");
    expect(reply).toBeTruthy();
    expect(await unreadCount(student)).toBeGreaterThan(0);

    const full = await getThread(student, thread.id);
    expect(full.posts).toHaveLength(2);
  });

  it("a student replying to their own thread does not notify themselves", async () => {
    await markAllRead(student);
    const thread = await createThread(student, {
      courseId,
      title: "Self reply thread",
      body: "first post",
    });
    await addPost(student, { threadId: thread.id, body: "following up" });
    expect(await unreadCount(student)).toBe(0);
  });
});

describe("announcements (US7, FR-029)", () => {
  it("broadcasting notifies every enrolled student", async () => {
    await markAllRead(student);
    await createAnnouncement(instructor, {
      courseId,
      title: "Welcome",
      body: "Glad you're here!",
    });
    const { items } = await listNotifications(student, { page: 1, pageSize: 10, skip: 0 });
    expect(items.some((n) => n.type === "ANNOUNCEMENT")).toBe(true);
  });

  it("only the course instructor may post announcements", async () => {
    await expect(
      createAnnouncement(student, { courseId, title: "Nope", body: "no" }),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });
});
