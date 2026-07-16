import { describe, it, expect } from "vitest";
import {
  publishReadiness,
  isPublishable,
  type PublishCandidate,
} from "@/server/services/publish";

const lesson = (id: string, deleted = false) => ({
  id,
  deletedAt: deleted ? new Date() : null,
});

describe("publishReadiness (FR-008)", () => {
  it("passes a complete course", () => {
    const course: PublishCandidate = {
      title: "Real Course",
      summary: "A good summary",
      modules: [{ lessons: [lesson("l1")] }],
    };
    expect(publishReadiness(course)).toEqual([]);
    expect(isPublishable(course)).toBe(true);
  });

  it("blocks a course with no modules", () => {
    const course: PublishCandidate = {
      title: "T",
      summary: "S",
      modules: [],
    };
    expect(isPublishable(course)).toBe(false);
    expect(publishReadiness(course)).toContain("Add at least one module.");
  });

  it("blocks a course whose only module has no lessons", () => {
    const course: PublishCandidate = {
      title: "T",
      summary: "S",
      modules: [{ lessons: [] }],
    };
    expect(publishReadiness(course)).toContain("Add at least one lesson.");
  });

  it("does not count soft-deleted lessons toward completeness", () => {
    const course: PublishCandidate = {
      title: "T",
      summary: "S",
      modules: [{ lessons: [lesson("l1", true)] }],
    };
    expect(isPublishable(course)).toBe(false);
    expect(publishReadiness(course)).toContain("Add at least one lesson.");
  });

  it("requires title and summary", () => {
    const course: PublishCandidate = {
      title: "  ",
      summary: "",
      modules: [{ lessons: [lesson("l1")] }],
    };
    const problems = publishReadiness(course);
    expect(problems).toContain("A title is required.");
    expect(problems).toContain("A summary is required.");
  });
});
