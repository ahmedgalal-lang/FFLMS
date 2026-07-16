/**
 * Pure progress + completion logic (no DB, no I/O) so it is unit-testable and
 * deterministic. Keyed by stable lesson identity, never by position
 * (spec FR-009 / FR-014 / SC-003).
 */

export type LessonRef = {
  id: string;
  isRequired: boolean;
};

/**
 * Percentage of REQUIRED lessons that are completed, 0..100 (integer).
 * A course with no required lessons is considered 0% until one exists.
 */
export function computeProgressPercent(
  lessons: LessonRef[],
  completedLessonIds: Iterable<string>,
): number {
  const required = lessons.filter((l) => l.isRequired);
  if (required.length === 0) return 0;
  const done = new Set(completedLessonIds);
  const completedRequired = required.filter((l) => done.has(l.id)).length;
  return Math.round((completedRequired / required.length) * 100);
}

/**
 * A course counts as complete for a student when progress meets the course's
 * completion threshold (spec FR-016). Assessment gating is layered on in the
 * P2 increment.
 */
export function isCourseComplete(
  progressPercent: number,
  completionThreshold: number,
): boolean {
  return progressPercent >= completionThreshold;
}

/**
 * The first incomplete lesson in curriculum order — the resume target
 * (spec FR-015). Returns null when everything is done.
 */
export function firstIncompleteLessonId(
  orderedLessonIds: string[],
  completedLessonIds: Iterable<string>,
): string | null {
  const done = new Set(completedLessonIds);
  for (const id of orderedLessonIds) {
    if (!done.has(id)) return id;
  }
  return null;
}
