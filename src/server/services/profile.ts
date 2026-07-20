import { db } from "@/server/db";
import type { Principal } from "@/server/access/policy";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { NotFoundError, AppError } from "@/server/http";
import {
  profileUpdateSchema,
  changePasswordSchema,
  type ProfileUpdateInput,
  type ChangePasswordInput,
} from "@/lib/validation";

/** The acting user's own profile. */
export async function getMyProfile(principal: Principal) {
  const user = await db.user.findUnique({
    where: { id: principal.id },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      avatarUrl: true,
      role: true,
      passwordHash: true,
    },
  });
  if (!user) throw new NotFoundError("Profile not found.");
  const { passwordHash, ...rest } = user;
  return { ...rest, hasPassword: passwordHash != null };
}

/** Update the acting user's own basic info (name, bio, avatar). */
export async function updateMyProfile(
  principal: Principal,
  input: ProfileUpdateInput,
) {
  const data = profileUpdateSchema.parse(input);
  return db.user.update({
    where: { id: principal.id },
    data: {
      name: data.name,
      bio: data.bio ?? null,
      ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
    },
    select: { id: true, name: true, bio: true, avatarUrl: true },
  });
}

/** Change the acting user's own password, verifying the current one. */
export async function changeMyPassword(
  principal: Principal,
  input: ChangePasswordInput,
) {
  const data = changePasswordSchema.parse(input);
  const user = await db.user.findUnique({
    where: { id: principal.id },
    select: { passwordHash: true },
  });
  if (!user) throw new NotFoundError("Profile not found.");

  if (!user.passwordHash) {
    throw new AppError(
      "Your account uses a social login and has no password to change.",
      422,
      "NO_PASSWORD",
    );
  }
  const ok = await verifyPassword(user.passwordHash, data.currentPassword);
  if (!ok) {
    throw new AppError("Your current password is incorrect.", 422, "BAD_PASSWORD");
  }

  await db.user.update({
    where: { id: principal.id },
    data: { passwordHash: await hashPassword(data.newPassword) },
  });
  return { ok: true };
}
