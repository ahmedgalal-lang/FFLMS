"use server";

import { revalidatePath } from "next/cache";
import type { Role, UserStatus } from "@prisma/client";
import { requirePrincipal } from "@/server/auth";
import {
  changeUserRole,
  setUserStatus,
  createUser,
  updateUserInfo,
  setUserPassword,
  deleteUser,
} from "@/server/services/admin";
import { approveCourse, rejectCourse, archiveCourse } from "@/server/services/review";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/server/services/category";
import { revokeCertificate, reinstateCertificate } from "@/server/services/certificate";
import {
  changeRoleSchema,
  setStatusSchema,
  rejectCourseSchema,
  categorySchema,
  adminCreateUserSchema,
  adminUpdateUserSchema,
  adminSetPasswordSchema,
} from "@/lib/validation";
import { AppError } from "@/server/http";
import { AuthorizationError } from "@/server/access/policy";

export type AdminState = { error?: string; ok?: boolean } | undefined;

function toState(err: unknown): AdminState {
  if (err instanceof AuthorizationError) return { error: err.message };
  if (err instanceof AppError) return { error: err.message };
  return { error: "Something went wrong. Please try again." };
}

export async function changeRoleAction(userId: string, role: Role): Promise<AdminState> {
  const principal = await requirePrincipal();
  const parsed = changeRoleSchema.safeParse({ role });
  if (!parsed.success) return { error: "Invalid role." };
  try {
    await changeUserRole(principal, userId, parsed.data.role);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function setStatusAction(
  userId: string,
  status: UserStatus,
): Promise<AdminState> {
  const principal = await requirePrincipal();
  const parsed = setStatusSchema.safeParse({ status });
  if (!parsed.success) return { error: "Invalid status." };
  try {
    await setUserStatus(principal, userId, parsed.data.status);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function createUserAction(input: unknown): Promise<AdminState> {
  const principal = await requirePrincipal();
  const parsed = adminCreateUserSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid user." };
  try {
    await createUser(principal, parsed.data);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function updateUserInfoAction(
  userId: string,
  input: unknown,
): Promise<AdminState> {
  const principal = await requirePrincipal();
  const parsed = adminUpdateUserSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid name." };
  try {
    await updateUserInfo(principal, userId, parsed.data);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function setUserPasswordAction(
  userId: string,
  input: unknown,
): Promise<AdminState> {
  const principal = await requirePrincipal();
  const parsed = adminSetPasswordSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid password." };
  try {
    await setUserPassword(principal, userId, parsed.data.newPassword);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function deleteUserAction(userId: string): Promise<AdminState> {
  const principal = await requirePrincipal();
  try {
    await deleteUser(principal, userId);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function approveCourseAction(courseId: string): Promise<AdminState> {
  const principal = await requirePrincipal();
  try {
    await approveCourse(principal, courseId);
    revalidatePath("/admin/review");
    revalidatePath("/courses");
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function rejectCourseAction(
  courseId: string,
  reason: string,
): Promise<AdminState> {
  const principal = await requirePrincipal();
  const parsed = rejectCourseSchema.safeParse({ reason });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Give a reason." };
  try {
    await rejectCourse(principal, courseId, parsed.data.reason);
    revalidatePath("/admin/review");
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function archiveCourseAction(courseId: string): Promise<AdminState> {
  const principal = await requirePrincipal();
  try {
    await archiveCourse(principal, courseId);
    revalidatePath("/admin/review");
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function createCategoryAction(input: unknown): Promise<AdminState> {
  const principal = await requirePrincipal();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid category." };
  try {
    await createCategory(principal, parsed.data);
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function updateCategoryAction(
  categoryId: string,
  input: unknown,
): Promise<AdminState> {
  const principal = await requirePrincipal();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid category." };
  try {
    await updateCategory(principal, categoryId, parsed.data);
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function deleteCategoryAction(categoryId: string): Promise<AdminState> {
  const principal = await requirePrincipal();
  try {
    await deleteCategory(principal, categoryId);
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function revokeCertificateAdminAction(certificateId: string): Promise<AdminState> {
  const principal = await requirePrincipal();
  try {
    await revokeCertificate(principal, certificateId);
    revalidatePath("/admin/certificates");
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function reinstateCertificateAdminAction(certificateId: string): Promise<AdminState> {
  const principal = await requirePrincipal();
  try {
    await reinstateCertificate(principal, certificateId);
    revalidatePath("/admin/certificates");
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}
