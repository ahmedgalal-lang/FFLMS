import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/server/db";
import type { Principal } from "@/server/access/policy";
import {
  saveVideoProgress,
  getVideoProgress,
} from "@/server/services/video-progress";
import { enroll } from "@/server/services/enrollment";
import { createCourse } from "@/server/services/course";
import { addModule, addLesson } from "@/server/services/curriculum";
import { publishCourse } from "@/server/services/publish";

let instructor: Principal;
let student: Principal;
let outsider: Principal;
let courseId: string;
let lessonId: string;
let enrollmentId: string;
const userIds: string[] = [];

beforeAll(async () => {
  const suffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const i = await db.user.create({
    data: { email: `vpi-${suffix}@t.test`, name: "VPI", role: "INSTRUCTOR" },
  });
  const s = await db.user.create({
    data: { email: `vps-${suffix}@t.test`, name: "VPS", role: "STUDENT" },
  });
  const o = await db.user.create({
    data: { email: `vpo-${suffix}@t.test`, name: "VPO", role: "STUDENT" },
  });
  userIds.push(i.id, s.id, o.id);
  instructor = { id: i.id, role: "INSTRUCTOR", status: "ACTIVE" };
  student = { id: s.id, role: "STUDENT", status: "ACTIVE" };
  outsider = { id: o.id, role: "STUDENT", status: "ACTIVE" };

  const course = await createCourse(instructor, {
    title: "Video Progress Course",
    summary: "Course for the video-progress integration test.",
    description: "",
  });
  courseId = course.id;
  const mod = await addModule(instructor, course.id, "M1");
  const l1 = await addLesson(instructor, mod.id, "L1");
  lessonId = l1.id;
  await publishCourse(instructor, course.id);
  const e = await enroll(student, courseId);
  enrollmentId = e.id;
});

afterAll(async () => {
  await db.course.deleteMany({ where: { id: courseId } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("video progress", () => {
  it("saves position and watched seconds, and reads them back", async () => {
    await saveVideoProgress(student, lessonId, {
      positionSec: 42,
      watchedSec: 40,
    });
    const p = await getVideoProgress(enrollmentId, lessonId);
    expect(p.positionSec).toBe(42);
    expect(p.watchedSec).toBe(40);
  });

  it("never lets watched seconds decrease (keeps the max)", async () => {
    await saveVideoProgress(student, lessonId, {
      positionSec: 100,
      watchedSec: 90,
    });
    // Seek back to the start: position moves, watched stays at the max.
    await saveVideoProgress(student, lessonId, {
      positionSec: 5,
      watchedSec: 5,
    });
    const p = await getVideoProgress(enrollmentId, lessonId);
    expect(p.positionSec).toBe(5);
    expect(p.watchedSec).toBe(90);
  });

  it("rejects a student who is not enrolled", async () => {
    await expect(
      saveVideoProgress(outsider, lessonId, { positionSec: 1, watchedSec: 1 }),
    ).rejects.toThrowError();
  });
});
