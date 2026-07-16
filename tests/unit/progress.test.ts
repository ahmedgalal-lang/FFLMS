import { describe, it, expect } from "vitest";
import {
  computeProgressPercent,
  isCourseComplete,
  firstIncompleteLessonId,
  type LessonRef,
} from "@/server/services/progress-logic";

const lessons: LessonRef[] = [
  { id: "a", isRequired: true },
  { id: "b", isRequired: true },
  { id: "c", isRequired: false }, // optional — must not affect required %
  { id: "d", isRequired: true },
];

describe("computeProgressPercent (FR-014, SC-003)", () => {
  it("is 0 with nothing completed", () => {
    expect(computeProgressPercent(lessons, [])).toBe(0);
  });

  it("counts only required lessons", () => {
    // 1 of 3 required complete => 33
    expect(computeProgressPercent(lessons, ["a"])).toBe(33);
    // completing the optional lesson alone => still 0 required done
    expect(computeProgressPercent(lessons, ["c"])).toBe(0);
  });

  it("is 100 when all required are complete (optional ignored)", () => {
    expect(computeProgressPercent(lessons, ["a", "b", "d"])).toBe(100);
  });

  it("is keyed by stable id — reordering the array does not change result", () => {
    const reordered = [...lessons].reverse();
    expect(computeProgressPercent(reordered, ["a", "b"])).toBe(
      computeProgressPercent(lessons, ["a", "b"]),
    );
  });

  it("survives a deleted lesson (id no longer present)", () => {
    // 'd' removed from curriculum; progress recomputes over remaining required
    const trimmed = lessons.filter((l) => l.id !== "d");
    expect(computeProgressPercent(trimmed, ["a", "b"])).toBe(100);
  });

  it("returns 0 when there are no required lessons", () => {
    expect(computeProgressPercent([{ id: "x", isRequired: false }], ["x"])).toBe(0);
  });
});

describe("isCourseComplete (FR-016)", () => {
  it("respects the threshold", () => {
    expect(isCourseComplete(100, 100)).toBe(true);
    expect(isCourseComplete(80, 100)).toBe(false);
    expect(isCourseComplete(80, 75)).toBe(true);
  });
});

describe("firstIncompleteLessonId (FR-015)", () => {
  it("returns the first incomplete in order", () => {
    expect(firstIncompleteLessonId(["a", "b", "c"], ["a"])).toBe("b");
  });
  it("returns null when all complete", () => {
    expect(firstIncompleteLessonId(["a", "b"], ["a", "b"])).toBeNull();
  });
});
