import "server-only";
import { db } from "@/server/db";
import { authorize, type Actor } from "@/server/access/authorize";
import {
  canPublish,
  publishBlockers,
  evaluatePublishReadiness,
  type PublishSnapshot,
} from "@/server/services/publish-logic";

async function loadSnapshot(
  courseId: string,
): Promise<{ instructorId: string; snapshot: PublishSnapshot } | null> {
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        include: {
          lessons: { include: { _count: { select: { contentBlocks: true } } } },
        },
      },
    },
  });
  if (!course) return null;
  return {
    instructorId: course.instructorId,
    snapshot: {
      title: course.title,
      summary: course.summary,
      description: course.description,
      categoryId: course.categoryId,
      modules: course.modules.map((m) => ({
        lessons: m.lessons.map((l) => ({
          contentBlockCount: l._count.contentBlocks,
        })),
      })),
    },
  };
}

export async function getPublishReadiness(actor: Actor | null, courseId: string) {
  const loaded = await loadSnapshot(courseId);
  if (!loaded) throw new Error("Course not found");
  authorize(actor, "course:publish", { ownerId: loaded.instructorId });
  return evaluatePublishReadiness(loaded.snapshot);
}

export class PublishBlockedError extends Error {
  constructor(public blockers: string[]) {
    super("Course is not ready to publish");
    this.name = "PublishBlockedError";
  }
}

export async function publishCourse(actor: Actor | null, courseId: string) {
  const loaded = await loadSnapshot(courseId);
  if (!loaded) throw new Error("Course not found");
  authorize(actor, "course:publish", { ownerId: loaded.instructorId });

  if (!canPublish(loaded.snapshot)) {
    throw new PublishBlockedError(publishBlockers(loaded.snapshot));
  }

  return db.course.update({
    where: { id: courseId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
}

export async function unpublishCourse(actor: Actor | null, courseId: string) {
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) throw new Error("Course not found");
  authorize(actor, "course:update", { ownerId: course.instructorId });
  return db.course.update({
    where: { id: courseId },
    data: { status: "DRAFT" },
  });
}
