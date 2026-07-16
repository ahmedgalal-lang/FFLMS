import { describe, it, expect } from "vitest";
import { can, type Actor } from "@/server/access/authorize";

const admin: Actor = { id: "u_admin", role: "ADMIN", status: "ACTIVE" };
const instructor: Actor = { id: "u_ins", role: "INSTRUCTOR", status: "ACTIVE" };
const other: Actor = { id: "u_ins2", role: "INSTRUCTOR", status: "ACTIVE" };
const student: Actor = { id: "u_stu", role: "STUDENT", status: "ACTIVE" };
const suspended: Actor = { id: "u_x", role: "INSTRUCTOR", status: "SUSPENDED" };

describe("authorize (FR-002, SC-005) — deny by default", () => {
  it("denies anonymous everything", () => {
    expect(can(null, "course:create")).toBe(false);
    expect(can(undefined, "course:enroll")).toBe(false);
  });

  it("denies suspended accounts", () => {
    expect(can(suspended, "course:create")).toBe(false);
  });

  it("lets instructors and admins create courses; not students", () => {
    expect(can(instructor, "course:create")).toBe(true);
    expect(can(admin, "course:create")).toBe(true);
    expect(can(student, "course:create")).toBe(false);
  });

  it("restricts course edits to the owner (or admin)", () => {
    const ctx = { ownerId: instructor.id };
    expect(can(instructor, "course:update", ctx)).toBe(true);
    expect(can(other, "course:update", ctx)).toBe(false);
    expect(can(admin, "course:update", ctx)).toBe(true);
  });

  it("restricts publish to the owning instructor or admin", () => {
    const ctx = { ownerId: instructor.id };
    expect(can(instructor, "course:publish", ctx)).toBe(true);
    expect(can(other, "course:publish", ctx)).toBe(false);
  });

  it("lets students enroll but not instructors", () => {
    expect(can(student, "course:enroll")).toBe(true);
    expect(can(instructor, "course:enroll")).toBe(false);
  });

  it("lets a student write only their own progress", () => {
    expect(can(student, "progress:write", { ownerId: student.id })).toBe(true);
    expect(can(student, "progress:write", { ownerId: "someone_else" })).toBe(false);
  });

  it("gates admin actions to admins only", () => {
    expect(can(admin, "admin:manageUsers")).toBe(true);
    expect(can(instructor, "admin:manageUsers")).toBe(false);
    expect(can(admin, "admin:reviewCourse")).toBe(true);
  });
});
