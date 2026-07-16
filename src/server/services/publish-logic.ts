/**
 * Pure publish-readiness gate (spec FR-008). No DB — takes a plain snapshot of
 * the course so it can be unit-tested and reused by both the service and the UI
 * readiness checklist.
 */

export type PublishSnapshot = {
  title: string;
  summary: string;
  description: string;
  categoryId: string | null;
  modules: Array<{
    lessons: Array<{ contentBlockCount: number }>;
  }>;
};

export type PublishCheck = {
  key: string;
  label: string;
  ok: boolean;
};

export function evaluatePublishReadiness(
  course: PublishSnapshot,
): PublishCheck[] {
  const totalLessons = course.modules.reduce(
    (n, m) => n + m.lessons.length,
    0,
  );
  const hasModuleWithLesson = course.modules.some((m) => m.lessons.length > 0);
  const everyLessonHasContent =
    totalLessons > 0 &&
    course.modules.every((m) =>
      m.lessons.every((l) => l.contentBlockCount > 0),
    );

  return [
    {
      key: "metadata",
      label: "Title, summary, description & category are set",
      ok:
        course.title.trim().length >= 3 &&
        course.summary.trim().length > 0 &&
        course.description.trim().length > 0 &&
        !!course.categoryId,
    },
    {
      key: "structure",
      label: "At least one module with at least one lesson",
      ok: hasModuleWithLesson,
    },
    {
      key: "content",
      label: "Every lesson has at least one content block",
      ok: everyLessonHasContent,
    },
  ];
}

export function canPublish(course: PublishSnapshot): boolean {
  return evaluatePublishReadiness(course).every((c) => c.ok);
}

export function publishBlockers(course: PublishSnapshot): string[] {
  return evaluatePublishReadiness(course)
    .filter((c) => !c.ok)
    .map((c) => c.label);
}
