"use server";

import { revalidatePath } from "next/cache";
import { requirePrincipal } from "@/server/auth";
import { updateMyProfile, changeMyPassword } from "@/server/services/profile";
import { profileUpdateSchema, changePasswordSchema } from "@/lib/validation";
import { AppError } from "@/server/http";

export type ProfileState = { error?: string; ok?: boolean } | undefined;

function toState(err: unknown): ProfileState {
  if (err instanceof AppError) return { error: err.message };
  return { error: "Something went wrong. Please try again." };
}

export async function updateProfileAction(input: {
  name: string;
  bio?: string | null;
  avatarUrl?: string | null;
}): Promise<ProfileState> {
  const principal = await requirePrincipal();
  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }
  try {
    await updateMyProfile(principal, parsed.data);
    revalidatePath("/profile");
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<ProfileState> {
  const principal = await requirePrincipal();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password." };
  }
  try {
    await changeMyPassword(principal, parsed.data);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}
