"use server";

import { revalidatePath } from "next/cache";
import { requirePrincipal } from "@/server/auth";
import { markLessonComplete } from "@/server/services/progress";
import { AppError } from "@/server/http";
import { AuthorizationError } from "@/server/access/policy";

export type CompleteState = {
  error?: string;
  progressPercent?: number;
  completed?: boolean;
};

export async function completeLessonAction(
  slug: string,
  lessonId: string,
): Promise<CompleteState> {
  const principal = await requirePrincipal();
  try {
    const res = await markLessonComplete(principal, lessonId);
    revalidatePath(`/learn/${slug}`);
    revalidatePath("/my-learning");
    return res;
  } catch (err) {
    if (err instanceof AuthorizationError) return { error: err.message };
    if (err instanceof AppError) return { error: err.message };
    return { error: "Could not save your progress." };
  }
}
