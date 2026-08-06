"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePrincipal } from "@/server/auth";
import {
  createGroup,
  addGroupMemberByEmail,
  removeGroupMember,
  assignCourseToGroup,
  revokeCourseFromGroup,
  deleteGroup,
} from "@/server/services/group";
import { groupCreateSchema } from "@/lib/validation";
import { AppError, NotFoundError } from "@/server/http";
import { AuthorizationError } from "@/server/access/policy";

export type GroupActionState = { error?: string; ok?: boolean } | undefined;

function toState(err: unknown): GroupActionState {
  if (err instanceof AuthorizationError) return { error: err.message };
  if (err instanceof AppError) return { error: err.message };
  if (err instanceof NotFoundError) return { error: err.message };
  return { error: "Something went wrong. Please try again." };
}

export async function createGroupAction(
  _prev: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const principal = await requirePrincipal();
  const parsed = groupCreateSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid name." };
  }
  let group;
  try {
    group = await createGroup(principal, parsed.data.name);
  } catch (err) {
    return toState(err);
  }
  revalidatePath("/studio/groups");
  redirect(`/studio/groups/${group.id}`);
}

export async function addGroupMemberAction(
  groupId: string,
  studentEmail: string,
): Promise<GroupActionState> {
  const principal = await requirePrincipal();
  if (!studentEmail.trim()) return { error: "Enter a student email." };
  try {
    await addGroupMemberByEmail(principal, groupId, studentEmail);
    revalidatePath(`/studio/groups/${groupId}`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function removeGroupMemberAction(
  groupId: string,
  studentId: string,
): Promise<GroupActionState> {
  const principal = await requirePrincipal();
  try {
    await removeGroupMember(principal, groupId, studentId);
    revalidatePath(`/studio/groups/${groupId}`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function assignCourseToGroupAction(
  groupId: string,
  courseId: string,
): Promise<GroupActionState> {
  const principal = await requirePrincipal();
  if (!courseId) return { error: "Choose a course." };
  try {
    await assignCourseToGroup(principal, groupId, courseId);
    revalidatePath(`/studio/groups/${groupId}`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function revokeCourseFromGroupAction(
  groupId: string,
  courseId: string,
): Promise<GroupActionState> {
  const principal = await requirePrincipal();
  try {
    await revokeCourseFromGroup(principal, groupId, courseId);
    revalidatePath(`/studio/groups/${groupId}`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function deleteGroupAction(groupId: string): Promise<GroupActionState> {
  const principal = await requirePrincipal();
  try {
    await deleteGroup(principal, groupId);
  } catch (err) {
    return toState(err);
  }
  revalidatePath("/studio/groups");
  redirect("/studio/groups");
}
