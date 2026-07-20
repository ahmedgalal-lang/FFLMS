"use server";

import { revalidatePath } from "next/cache";
import { requirePrincipal } from "@/server/auth";
import {
  upsertLessonQuiz,
  addQuestion,
  deleteQuestion,
  deleteQuiz,
} from "@/server/services/quiz";
import { quizSettingsSchema, questionInputSchema } from "@/lib/validation";
import { AppError } from "@/server/http";
import { AuthorizationError } from "@/server/access/policy";

export type QuizActionState = { error?: string; ok?: boolean } | undefined;

function toState(err: unknown): QuizActionState {
  if (err instanceof AuthorizationError) return { error: err.message };
  if (err instanceof AppError) return { error: err.message };
  return { error: "Something went wrong. Please try again." };
}

export async function saveQuizSettingsAction(
  courseId: string,
  lessonId: string,
  input: unknown,
): Promise<QuizActionState> {
  const principal = await requirePrincipal();
  const parsed = quizSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid settings." };
  }
  try {
    await upsertLessonQuiz(principal, lessonId, parsed.data);
    revalidatePath(`/studio/${courseId}/quiz/${lessonId}`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function addQuestionAction(
  courseId: string,
  lessonId: string,
  quizId: string,
  input: unknown,
): Promise<QuizActionState> {
  const principal = await requirePrincipal();
  const parsed = questionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid question." };
  }
  try {
    await addQuestion(principal, quizId, parsed.data);
    revalidatePath(`/studio/${courseId}/quiz/${lessonId}`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function deleteQuestionAction(
  courseId: string,
  lessonId: string,
  questionId: string,
): Promise<QuizActionState> {
  const principal = await requirePrincipal();
  try {
    await deleteQuestion(principal, questionId);
    revalidatePath(`/studio/${courseId}/quiz/${lessonId}`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function deleteQuizAction(
  courseId: string,
  lessonId: string,
  quizId: string,
): Promise<QuizActionState> {
  const principal = await requirePrincipal();
  try {
    await deleteQuiz(principal, quizId);
    revalidatePath(`/studio/${courseId}`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}
