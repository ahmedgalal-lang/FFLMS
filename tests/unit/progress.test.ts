import { describe, it, expect } from "vitest";
import {
  computeProgressPercent,
  firstIncompleteLessonId,
  isCourseComplete,
  type LessonRef,
} from "@/server/services/progress-calc";

const req = (id: string): LessonRef => ({ id, isRequired: true });
const opt = (id: string): LessonRef => ({ id, isRequired: false });

describe("computeProgressPercent (FR-014, SC-003)", () => {
  it("is 0 with nothing completed", () => {
    expect(computeProgressPercent([req("a"), req("b")], [])).toBe(0);
  });

  it("counts only required lessons", () => {
    // 1 of 2 required done; optional completion does not change the ratio.
    expect(
      computeProgressPercent([req("a"), req("b"), opt("c")], ["a", "c"]),
    ).toBe(50);
  });

  it("is 100 when all required lessons are complete", () => {
    expect(computeProgressPercent([req("a"), req("b")], ["a", "b"])).toBe(100);
  });

  it("treats a course with no required lessons as complete", () => {
    expect(computeProgressPercent([opt("a")], [])).toBe(100);
  });

  it("is stable under reordering — keyed by id, not position", () => {
    const before = computeProgressPercent([req("a"), req("b")], ["b"]);
    const after = computeProgressPercent([req("b"), req("a")], ["b"]);
    expect(before).toBe(after);
    expect(after).toBe(50);
  });

  it("ignores completion records for lessons no longer present (deleted)", () => {
    // "gone" was completed but is not in the current lesson set.
    expect(computeProgressPercent([req("a"), req("b")], ["a", "gone"])).toBe(50);
  });

  it("rounds to the nearest integer", () => {
    expect(
      computeProgressPercent([req("a"), req("b"), req("c")], ["a"]),
    ).toBe(33);
  });
});

describe("firstIncompleteLessonId (FR-015)", () => {
  it("returns the first uncompleted lesson in order", () => {
    expect(
      firstIncompleteLessonId([req("a"), req("b"), req("c")], ["a"]),
    ).toBe("b");
  });

  it("skips completed lessons even if out of order", () => {
    expect(
      firstIncompleteLessonId([req("a"), req("b"), req("c")], ["a", "b"]),
    ).toBe("c");
  });

  it("returns null when everything is complete", () => {
    expect(firstIncompleteLessonId([req("a")], ["a"])).toBeNull();
  });
});

describe("isCourseComplete", () => {
  it("respects the completion threshold", () => {
    const lessons = [req("a"), req("b"), req("c"), req("d")];
    expect(isCourseComplete(lessons, ["a", "b", "c"], 100)).toBe(false);
    expect(isCourseComplete(lessons, ["a", "b", "c"], 75)).toBe(true);
  });
});
