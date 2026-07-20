"use server";

import { revalidatePath } from "next/cache";
import { requirePrincipal } from "@/server/auth";
import {
  upsertLessonAssignment,
  deleteAssignment,
} from "@/server/services/assignment";
import { gradeSubmission } from "@/server/services/submission";
import { assignmentSettingsSchema, gradeSubmissionSchema } from "@/lib/validation";
import { AppError } from "@/server/http";
import { AuthorizationError } from "@/server/access/policy";

export type AsgState = { error?: string; ok?: boolean } | undefined;

function toState(err: unknown): AsgState {
  if (err instanceof AuthorizationError) return { error: err.message };
  if (err instanceof AppError) return { error: err.message };
  return { error: "Something went wrong. Please try again." };
}

export async function saveAssignmentAction(
  courseId: string,
  lessonId: string,
  input: unknown,
): Promise<AsgState> {
  const principal = await requirePrincipal();
  const parsed = assignmentSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid assignment." };
  }
  try {
    await upsertLessonAssignment(principal, lessonId, parsed.data);
    revalidatePath(`/studio/${courseId}/assignment/${lessonId}`);
    revalidatePath(`/studio/${courseId}`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function deleteAssignmentAction(
  courseId: string,
  assignmentId: string,
): Promise<AsgState> {
  const principal = await requirePrincipal();
  try {
    await deleteAssignment(principal, assignmentId);
    revalidatePath(`/studio/${courseId}`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function gradeSubmissionAction(
  courseId: string,
  lessonId: string,
  submissionId: string,
  input: unknown,
): Promise<AsgState> {
  const principal = await requirePrincipal();
  const parsed = gradeSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid grade." };
  }
  try {
    await gradeSubmission(principal, submissionId, parsed.data);
    revalidatePath(`/studio/${courseId}/assignment/${lessonId}`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}
