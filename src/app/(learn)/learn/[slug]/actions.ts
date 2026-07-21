"use server";

import { revalidatePath } from "next/cache";
import { requirePrincipal } from "@/server/auth";
import { markLessonComplete } from "@/server/services/progress";
import { saveVideoProgress } from "@/server/services/video-progress";
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

/** Persist video playback position + watched time (best-effort; no revalidate). */
export async function saveVideoProgressAction(
  lessonId: string,
  positionSec: number,
  watchedSec: number,
): Promise<{ ok: boolean }> {
  try {
    const principal = await requirePrincipal();
    await saveVideoProgress(principal, lessonId, { positionSec, watchedSec });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
