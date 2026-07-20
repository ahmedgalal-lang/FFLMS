import { db } from "@/server/db";
import { authorize, type Principal } from "@/server/access/policy";
import { NotFoundError, AppError } from "@/server/http";
import { loadCourseForAuthz } from "@/server/services/course";
import {
  contentBlockSchema,
  type ContentBlockInput,
} from "@/lib/validation";

/** Resolve the course that owns a module, and authorize a curriculum edit. */
async function authorizeModule(principal: Principal, moduleId: string) {
  const mod = await db.module.findUnique({
    where: { id: moduleId },
    select: { id: true, courseId: true },
  });
  if (!mod) throw new NotFoundError("Module not found.");
  const course = await loadCourseForAuthz(mod.courseId);
  authorize(principal, { type: "curriculum:edit", course });
  return mod;
}

async function authorizeLesson(principal: Principal, lessonId: string) {
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, deletedAt: null },
    select: { id: true, module: { select: { courseId: true } } },
  });
  if (!lesson) throw new NotFoundError("Lesson not found.");
  const course = await loadCourseForAuthz(lesson.module.courseId);
  authorize(principal, { type: "curriculum:edit", course });
  return lesson;
}

// ---------- Modules ----------

export async function addModule(
  principal: Principal,
  courseId: string,
  title: string,
) {
  const course = await loadCourseForAuthz(courseId);
  authorize(principal, { type: "curriculum:edit", course });
  const count = await db.module.count({ where: { courseId } });
  return db.module.create({
    data: { courseId, title, order: count },
  });
}

export async function renameModule(
  principal: Principal,
  moduleId: string,
  title: string,
) {
  await authorizeModule(principal, moduleId);
  return db.module.update({ where: { id: moduleId }, data: { title } });
}

export async function deleteModule(principal: Principal, moduleId: string) {
  await authorizeModule(principal, moduleId);
  await db.module.delete({ where: { id: moduleId } });
}

// ---------- Lessons ----------

export async function addLesson(
  principal: Principal,
  moduleId: string,
  title: string,
) {
  await authorizeModule(principal, moduleId);
  const count = await db.lesson.count({
    where: { moduleId, deletedAt: null },
  });
  return db.lesson.create({
    data: { moduleId, title, order: count },
  });
}

export async function updateLesson(
  principal: Principal,
  lessonId: string,
  data: { title?: string; isRequired?: boolean; estimatedMinutes?: number | null },
) {
  await authorizeLesson(principal, lessonId);
  return db.lesson.update({
    where: { id: lessonId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.isRequired !== undefined ? { isRequired: data.isRequired } : {}),
      ...(data.estimatedMinutes !== undefined
        ? { estimatedMinutes: data.estimatedMinutes }
        : {}),
    },
  });
}

export async function deleteLesson(principal: Principal, lessonId: string) {
  await authorizeLesson(principal, lessonId);
  // Soft delete keeps LessonProgress history valid (FR-009).
  await db.lesson.update({
    where: { id: lessonId },
    data: { deletedAt: new Date() },
  });
}

/**
 * Reorder lessons within a module by a full list of ordered ids. Reordering
 * updates only the `order` column — stable lesson ids are untouched, so learner
 * progress is preserved (FR-009).
 */
export async function reorderLessons(
  principal: Principal,
  moduleId: string,
  orderedIds: string[],
) {
  await authorizeModule(principal, moduleId);
  const lessons = await db.lesson.findMany({
    where: { moduleId, deletedAt: null },
    select: { id: true },
  });
  const known = new Set(lessons.map((l) => l.id));
  if (
    orderedIds.length !== known.size ||
    !orderedIds.every((id) => known.has(id))
  ) {
    throw new AppError("Reorder list must match the module's lessons exactly.");
  }
  // Two-phase to avoid the unique (moduleId, order) collision.
  await db.$transaction([
    ...orderedIds.map((id, i) =>
      db.lesson.update({ where: { id }, data: { order: 1000 + i } }),
    ),
    ...orderedIds.map((id, i) =>
      db.lesson.update({ where: { id }, data: { order: i } }),
    ),
  ]);
}

export async function reorderModules(
  principal: Principal,
  courseId: string,
  orderedIds: string[],
) {
  const course = await loadCourseForAuthz(courseId);
  authorize(principal, { type: "curriculum:edit", course });
  await db.$transaction([
    ...orderedIds.map((id, i) =>
      db.module.update({ where: { id }, data: { order: 1000 + i } }),
    ),
    ...orderedIds.map((id, i) =>
      db.module.update({ where: { id }, data: { order: i } }),
    ),
  ]);
}

// ---------- Content blocks ----------

export async function addContentBlock(
  principal: Principal,
  lessonId: string,
  input: ContentBlockInput,
) {
  await authorizeLesson(principal, lessonId);
  const data = contentBlockSchema.parse(input);
  const count = await db.contentBlock.count({ where: { lessonId } });
  return db.contentBlock.create({
    data: {
      lessonId,
      type: data.type,
      order: count,
      text: data.text ?? null,
      mediaUrl: data.mediaUrl ?? null,
      fileName: data.fileName ?? null,
      fileSize: data.fileSize ?? null,
    },
  });
}

export async function deleteContentBlock(
  principal: Principal,
  blockId: string,
) {
  const block = await db.contentBlock.findUnique({
    where: { id: blockId },
    select: { lessonId: true },
  });
  if (!block) throw new NotFoundError("Content not found.");
  await authorizeLesson(principal, block.lessonId);
  await db.contentBlock.delete({ where: { id: blockId } });
}
