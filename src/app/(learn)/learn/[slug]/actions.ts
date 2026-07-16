"use server";

import { revalidatePath } from "next/cache";
import { currentActor } from "@/server/auth";
import { markLessonComplete } from "@/server/services/progress";

export async function completeLessonAction(formData: FormData) {
  const lessonId = String(formData.get("lessonId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!lessonId || !slug) return;

  const actor = await currentActor();
  await markLessonComplete(actor, lessonId);
  revalidatePath(`/learn/${slug}`);
}
