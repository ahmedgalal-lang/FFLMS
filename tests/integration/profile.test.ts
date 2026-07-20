import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/server/db";
import type { Principal } from "@/server/access/policy";
import { AuthorizationError } from "@/server/access/policy";
import { AppError } from "@/server/http";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import {
  updateMyProfile,
  changeMyPassword,
  getMyProfile,
} from "@/server/services/profile";
import {
  createUser,
  updateUserInfo,
  setUserPassword,
} from "@/server/services/admin";

let admin: Principal;
let student: Principal;
let studentId: string;
const userIds: string[] = [];

beforeAll(async () => {
  const suffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const a = await db.user.create({ data: { email: `pa-${suffix}@t.test`, name: "PAdmin", role: "ADMIN" } });
  const s = await db.user.create({
    data: { email: `ps-${suffix}@t.test`, name: "PStudent", role: "STUDENT", passwordHash: await hashPassword("original8") },
  });
  userIds.push(a.id, s.id);
  studentId = s.id;
  admin = { id: a.id, role: "ADMIN", status: "ACTIVE" };
  student = { id: s.id, role: "STUDENT", status: "ACTIVE" };
});

afterAll(async () => {
  await db.auditLog.deleteMany({ where: { actorId: { in: userIds } } });
  await db.user.deleteMany({ where: { id: { in: [...userIds, "willbe-created"] } } });
  await db.user.deleteMany({ where: { email: { contains: "@created.test" } } });
  await db.$disconnect();
});

describe("self-service profile", () => {
  it("updates name, bio, and avatar", async () => {
    const updated = await updateMyProfile(student, {
      name: "Pat Student",
      bio: "I love learning.",
      avatarUrl: "https://example.com/a.png",
    });
    expect(updated.name).toBe("Pat Student");
    expect(updated.bio).toBe("I love learning.");
    expect(updated.avatarUrl).toBe("https://example.com/a.png");
  });

  it("changes password only with the correct current password", async () => {
    await expect(
      changeMyPassword(student, { currentPassword: "wrong", newPassword: "newpass12" }),
    ).rejects.toBeInstanceOf(AppError);

    const res = await changeMyPassword(student, {
      currentPassword: "original8",
      newPassword: "newpass12",
    });
    expect(res.ok).toBe(true);

    const user = await db.user.findUniqueOrThrow({ where: { id: studentId } });
    expect(await verifyPassword(user.passwordHash!, "newpass12")).toBe(true);
  });

  it("exposes hasPassword in the profile", async () => {
    const p = await getMyProfile(student);
    expect(p.hasPassword).toBe(true);
    expect(p).not.toHaveProperty("passwordHash");
  });
});

describe("admin user CRUD", () => {
  it("creates a user with an initial password (login works)", async () => {
    const created = await createUser(admin, {
      name: "New Person",
      email: "newp@created.test",
      role: "INSTRUCTOR",
      password: "welcome123",
    });
    expect(created.role).toBe("INSTRUCTOR");
    const user = await db.user.findUniqueOrThrow({ where: { id: created.id } });
    expect(await verifyPassword(user.passwordHash!, "welcome123")).toBe(true);
  });

  it("rejects duplicate emails", async () => {
    await expect(
      createUser(admin, { name: "Dup", email: "newp@created.test", role: "STUDENT", password: "welcome123" }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("lets an admin reset a user's password and edit their name", async () => {
    await updateUserInfo(admin, studentId, { name: "Renamed Student" });
    await setUserPassword(admin, studentId, "adminset99");
    const user = await db.user.findUniqueOrThrow({ where: { id: studentId } });
    expect(user.name).toBe("Renamed Student");
    expect(await verifyPassword(user.passwordHash!, "adminset99")).toBe(true);
  });

  it("blocks non-admins from user CRUD", async () => {
    await expect(
      createUser(student, { name: "X", email: "x@created.test", role: "STUDENT", password: "welcome123" }),
    ).rejects.toBeInstanceOf(AuthorizationError);
    await expect(setUserPassword(student, studentId, "hackpass1")).rejects.toBeInstanceOf(
      AuthorizationError,
    );
  });
});
