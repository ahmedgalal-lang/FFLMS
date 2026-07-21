import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/server/db";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { AppError } from "@/server/http";
import {
  requestPasswordReset,
  resetPassword,
} from "@/server/services/password-reset";

let email: string;
const userIds: string[] = [];

beforeAll(async () => {
  const suffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  email = `pr-${suffix}@t.test`;
  const u = await db.user.create({
    data: { email, name: "PR User", role: "STUDENT", passwordHash: await hashPassword("original8") },
  });
  userIds.push(u.id);
});

afterAll(async () => {
  await db.verificationToken.deleteMany({ where: { identifier: { contains: email } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("password reset (T076)", () => {
  it("creates a reset token on request", async () => {
    await requestPasswordReset(email);
    const token = await db.verificationToken.findFirst({
      where: { identifier: `pwreset:${email}` },
    });
    expect(token).not.toBeNull();
  });

  it("is a silent no-op for unknown emails (no token, no throw)", async () => {
    await expect(requestPasswordReset("nobody@nowhere.test")).resolves.toBeUndefined();
    const count = await db.verificationToken.count({
      where: { identifier: "pwreset:nobody@nowhere.test" },
    });
    expect(count).toBe(0);
  });

  it("resets the password with a valid token", async () => {
    await requestPasswordReset(email);
    const record = await db.verificationToken.findFirstOrThrow({
      where: { identifier: `pwreset:${email}` },
    });
    const res = await resetPassword({ email, token: record.token, password: "brandnew9" });
    expect(res.ok).toBe(true);

    const user = await db.user.findUniqueOrThrow({ where: { email } });
    expect(await verifyPassword(user.passwordHash!, "brandnew9")).toBe(true);

    // Token is consumed.
    const remaining = await db.verificationToken.count({
      where: { identifier: `pwreset:${email}` },
    });
    expect(remaining).toBe(0);
  });

  it("rejects an invalid token", async () => {
    await expect(
      resetPassword({ email, token: "0".repeat(40), password: "whatever9" }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects an expired token", async () => {
    await requestPasswordReset(email);
    const record = await db.verificationToken.findFirstOrThrow({
      where: { identifier: `pwreset:${email}` },
    });
    await db.verificationToken.update({
      where: { identifier_token: { identifier: record.identifier, token: record.token } },
      data: { expires: new Date(Date.now() - 1000) },
    });
    await expect(
      resetPassword({ email, token: record.token, password: "expired99" }),
    ).rejects.toMatchObject({ code: "BAD_TOKEN" });
  });
});
