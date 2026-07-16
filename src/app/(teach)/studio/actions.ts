"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePrincipal } from "@/server/auth";
import {
  createCourse,
  updateCourse,
  deleteCourse,
} from "@/server/services/course";
import {
  addModule,
  renameModule,
  deleteModule,
  addLesson,
  updateLesson,
  deleteLesson,
  addContentBlock,
  deleteContentBlock,
} from "@/server/services/curriculum";
import { publishCourse, unpublishCourse } from "@/server/services/publish";
import { courseCreateSchema, contentBlockSchema } from "@/lib/validation";
import { AppError } from "@/server/http";
import { AuthorizationError } from "@/server/access/policy";

export type ActionState = { error?: string; ok?: boolean } | undefined;

function toState(err: unknown): ActionState {
  if (err instanceof AuthorizationError) return { error: err.message };
  if (err instanceof AppError) return { error: err.message };
  return { error: "Something went wrong. Please try again." };
}

export async function createCourseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const principal = await requirePrincipal();
  const parsed = courseCreateSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    description: formData.get("description") ?? "",
    categoryId: (formData.get("categoryId") as string) || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid course." };
  }
  let course;
  try {
    course = await createCourse(principal, parsed.data);
  } catch (err) {
    return toState(err);
  }
  redirect(`/studio/${course.id}`);
}

export async function updateCourseAction(
  courseId: string,
  data: {
    title?: string;
    summary?: string;
    description?: string;
    categoryId?: string | null;
    completionThreshold?: number;
  },
): Promise<ActionState> {
  const principal = await requirePrincipal();
  try {
    await updateCourse(principal, courseId, data);
    revalidatePath(`/studio/${courseId}`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function deleteCourseAction(courseId: string) {
  const principal = await requirePrincipal();
  await deleteCourse(principal, courseId);
  revalidatePath("/studio");
  redirect("/studio");
}

export async function addModuleAction(courseId: string, title: string) {
  const principal = await requirePrincipal();
  try {
    await addModule(principal, courseId, title);
    revalidatePath(`/studio/${courseId}`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function renameModuleAction(
  courseId: string,
  moduleId: string,
  title: string,
) {
  const principal = await requirePrincipal();
  try {
    await renameModule(principal, moduleId, title);
    revalidatePath(`/studio/${courseId}`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function deleteModuleAction(courseId: string, moduleId: string) {
  const principal = await requirePrincipal();
  try {
    await deleteModule(principal, moduleId);
    revalidatePath(`/studio/${courseId}`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function addLessonAction(
  courseId: string,
  moduleId: string,
  title: string,
) {
  const principal = await requirePrincipal();
  try {
    await addLesson(principal, moduleId, title);
    revalidatePath(`/studio/${courseId}`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function updateLessonAction(
  courseId: string,
  lessonId: string,
  data: { title?: string; isRequired?: boolean },
) {
  const principal = await requirePrincipal();
  try {
    await updateLesson(principal, lessonId, data);
    revalidatePath(`/studio/${courseId}`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function deleteLessonAction(courseId: string, lessonId: string) {
  const principal = await requirePrincipal();
  try {
    await deleteLesson(principal, lessonId);
    revalidatePath(`/studio/${courseId}`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function addContentBlockAction(
  courseId: string,
  lessonId: string,
  input: unknown,
): Promise<ActionState> {
  const principal = await requirePrincipal();
  const parsed = contentBlockSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid content." };
  }
  try {
    await addContentBlock(principal, lessonId, parsed.data);
    revalidatePath(`/studio/${courseId}`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function deleteContentBlockAction(
  courseId: string,
  blockId: string,
) {
  const principal = await requirePrincipal();
  try {
    await deleteContentBlock(principal, blockId);
    revalidatePath(`/studio/${courseId}`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function publishCourseAction(courseId: string): Promise<ActionState> {
  const principal = await requirePrincipal();
  try {
    await publishCourse(principal, courseId);
    revalidatePath(`/studio/${courseId}`);
    revalidatePath("/courses");
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function unpublishCourseAction(
  courseId: string,
): Promise<ActionState> {
  const principal = await requirePrincipal();
  try {
    await unpublishCourse(principal, courseId);
    revalidatePath(`/studio/${courseId}`);
    revalidatePath("/courses");
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}
