"use server";

import { revalidatePath } from "next/cache";
import { requirePrincipal } from "@/server/auth";
import {
  assignCourseToStudentByEmail,
  revokeCourseFromStudent,
} from "@/server/services/course-assignment";
import { AppError, NotFoundError } from "@/server/http";
import { AuthorizationError } from "@/server/access/policy";

export type AssignActionState = { error?: string; ok?: boolean } | undefined;

function toState(err: unknown): AssignActionState {
  if (err instanceof AuthorizationError) return { error: err.message };
  if (err instanceof AppError) return { error: err.message };
  if (err instanceof NotFoundError) return { error: err.message };
  return { error: "Something went wrong. Please try again." };
}

export async function assignCourseToStudentAction(
  courseId: string,
  studentEmail: string,
): Promise<AssignActionState> {
  const principal = await requirePrincipal();
  if (!studentEmail.trim()) return { error: "Enter a student email." };

  try {
    await assignCourseToStudentByEmail(principal, courseId, studentEmail);
    revalidatePath(`/studio/${courseId}/assign`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function revokeCourseFromStudentAction(
  courseId: string,
  studentId: string,
): Promise<AssignActionState> {
  const principal = await requirePrincipal();
  try {
    await revokeCourseFromStudent(principal, courseId, studentId);
    revalidatePath(`/studio/${courseId}/assign`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}
