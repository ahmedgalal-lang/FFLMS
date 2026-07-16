"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentActor } from "@/server/auth";
import { createCourse } from "@/server/services/course";
import { addModule, addLesson, setLessonContent } from "@/server/services/curriculum";
import { publishCourse, unpublishCourse, PublishBlockedError } from "@/server/services/publish";
import { db } from "@/server/db";
import type { ContentBlockInput } from "@/lib/validation/course";

export type ActionState = { error?: string; ok?: boolean };

export async function createCourseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await currentActor();
  try {
    const course = await createCourse(actor, {
      title: String(formData.get("title") ?? ""),
      summary: String(formData.get("summary") ?? ""),
      description: String(formData.get("description") ?? ""),
      categoryId: (formData.get("categoryId") as string) || null,
      coverImageUrl: null,
    });
    redirect(`/studio/${course.id}`);
  } catch (error) {
    if (isRedirect(error)) throw error;
    return { error: messageOf(error) };
  }
}

export async function addModuleAction(formData: FormData) {
  const actor = await currentActor();
  const courseId = String(formData.get("courseId") ?? "");
  await addModule(actor, courseId, { title: String(formData.get("title") ?? "") });
  revalidatePath(`/studio/${courseId}`);
}

export async function addLessonAction(formData: FormData) {
  const actor = await currentActor();
  const moduleId = String(formData.get("moduleId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  await addLesson(actor, moduleId, { title: String(formData.get("title") ?? "") });
  revalidatePath(`/studio/${courseId}`);
}

export async function addContentBlockAction(formData: FormData) {
  const actor = await currentActor();
  const lessonId = String(formData.get("lessonId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const type = String(formData.get("type") ?? "TEXT") as ContentBlockInput["type"];

  // Load existing blocks and append the new one (setLessonContent replaces).
  const existing = await db.contentBlock.findMany({
    where: { lessonId },
    orderBy: { order: "asc" },
  });
  const next: ContentBlockInput[] = existing.map((b) => ({
    type: b.type,
    text: b.text,
    mediaUrl: b.mediaUrl,
    fileName: b.fileName,
    fileSize: b.fileSize,
  }));
  if (type === "TEXT") {
    next.push({ type: "TEXT", text: String(formData.get("text") ?? ""), mediaUrl: null, fileName: null, fileSize: null });
  } else if (type === "VIDEO") {
    next.push({ type: "VIDEO", text: null, mediaUrl: String(formData.get("mediaUrl") ?? ""), fileName: null, fileSize: null });
  } else {
    next.push({ type: "FILE", text: null, mediaUrl: String(formData.get("mediaUrl") ?? ""), fileName: String(formData.get("fileName") ?? "file"), fileSize: null });
  }

  await setLessonContent(actor, lessonId, next);
  revalidatePath(`/studio/${courseId}`);
}

export async function publishCourseAction(formData: FormData): Promise<void> {
  const actor = await currentActor();
  const courseId = String(formData.get("courseId") ?? "");
  try {
    await publishCourse(actor, courseId);
  } catch (error) {
    if (error instanceof PublishBlockedError) {
      revalidatePath(`/studio/${courseId}`);
      return;
    }
    throw error;
  }
  revalidatePath(`/studio/${courseId}`);
}

export async function unpublishCourseAction(formData: FormData) {
  const actor = await currentActor();
  const courseId = String(formData.get("courseId") ?? "");
  await unpublishCourse(actor, courseId);
  revalidatePath(`/studio/${courseId}`);
}

function isRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
