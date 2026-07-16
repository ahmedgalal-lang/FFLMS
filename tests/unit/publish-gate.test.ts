import { describe, it, expect } from "vitest";
import {
  canPublish,
  publishBlockers,
  type PublishSnapshot,
} from "@/server/services/publish-logic";

const ready: PublishSnapshot = {
  title: "Foundations of Data Analysis",
  summary: "Go from raw data to insight.",
  description: "A hands-on intro.",
  categoryId: "cat_1",
  modules: [{ lessons: [{ contentBlockCount: 2 }] }],
};

describe("publish gate (FR-008)", () => {
  it("allows publishing a complete course", () => {
    expect(canPublish(ready)).toBe(true);
    expect(publishBlockers(ready)).toEqual([]);
  });

  it("blocks a course with no modules/lessons", () => {
    const c = { ...ready, modules: [] };
    expect(canPublish(c)).toBe(false);
    expect(publishBlockers(c)).toContain(
      "At least one module with at least one lesson",
    );
  });

  it("blocks a course with a lesson that has no content", () => {
    const c: PublishSnapshot = {
      ...ready,
      modules: [{ lessons: [{ contentBlockCount: 0 }] }],
    };
    expect(canPublish(c)).toBe(false);
    expect(publishBlockers(c)).toContain(
      "Every lesson has at least one content block",
    );
  });

  it("blocks a course missing metadata (no category)", () => {
    const c = { ...ready, categoryId: null };
    expect(canPublish(c)).toBe(false);
  });

  it("blocks a course with a too-short title", () => {
    const c = { ...ready, title: "Hi" };
    expect(canPublish(c)).toBe(false);
  });
});
