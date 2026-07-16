import "server-only";
import { db } from "@/server/db";
import { authorize, type Actor } from "@/server/access/authorize";
import {
  moduleInputSchema,
  lessonInputSchema,
  contentBlockSchema,
  type ContentBlockInput,
} from "@/lib/validation/course";

async function assertCourseOwner(actor: Actor | null, courseId: string) {
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) throw new Error("Course not found");
  authorize(actor, "course:update", { ownerId: course.instructorId });
  return course;
}

export async function addModule(
  actor: Actor | null,
  courseId: string,
  raw: { title: string },
) {
  await assertCourseOwner(actor, courseId);
  const input = moduleInputSchema.parse(raw);
  const count = await db.module.count({ where: { courseId } });
  return db.module.create({
    data: { courseId, title: input.title, order: count },
  });
}

export async function addLesson(
  actor: Actor | null,
  moduleId: string,
  raw: { title: string; isRequired?: boolean },
) {
  const mod = await db.module.findUnique({ where: { id: moduleId } });
  if (!mod) throw new Error("Module not found");
  await assertCourseOwner(actor, mod.courseId);
  const input = lessonInputSchema.parse(raw);
  const count = await db.lesson.count({ where: { moduleId } });
  return db.lesson.create({
    data: {
      moduleId,
      title: input.title,
      isRequired: input.isRequired ?? true,
      order: count,
    },
  });
}

/** Replace a lesson's content blocks (simple, order-preserving). */
export async function setLessonContent(
  actor: Actor | null,
  lessonId: string,
  blocks: ContentBlockInput[],
) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { module: true },
  });
  if (!lesson) throw new Error("Lesson not found");
  await assertCourseOwner(actor, lesson.module.courseId);

  const parsed = blocks.map((b) => contentBlockSchema.parse(b));

  return db.$transaction(async (tx) => {
    await tx.contentBlock.deleteMany({ where: { lessonId } });
    for (let i = 0; i < parsed.length; i++) {
      const b = parsed[i]!;
      await tx.contentBlock.create({
        data: {
          lessonId,
          order: i,
          type: b.type,
          text: b.text ?? null,
          mediaUrl: b.mediaUrl ?? null,
          fileName: b.fileName ?? null,
          fileSize: b.fileSize ?? null,
        },
      });
    }
    return tx.lesson.findUnique({
      where: { id: lessonId },
      include: { contentBlocks: { orderBy: { order: "asc" } } },
    });
  });
}
