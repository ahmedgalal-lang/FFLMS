import { describe, it, expect } from "vitest";
import {
  gradeQuiz,
  type GradableQuestion,
  type StudentAnswer,
} from "@/server/services/grading-calc";

const mc: GradableQuestion = {
  id: "q1",
  type: "MULTIPLE_CHOICE",
  points: 2,
  options: [
    { id: "a", isCorrect: false },
    { id: "b", isCorrect: true },
    { id: "c", isCorrect: false },
  ],
};
const tf: GradableQuestion = {
  id: "q2",
  type: "TRUE_FALSE",
  points: 1,
  options: [
    { id: "t", isCorrect: true },
    { id: "f", isCorrect: false },
  ],
};
const ms: GradableQuestion = {
  id: "q3",
  type: "MULTI_SELECT",
  points: 3,
  options: [
    { id: "x", isCorrect: true },
    { id: "y", isCorrect: true },
    { id: "z", isCorrect: false },
  ],
};
const sa: GradableQuestion = {
  id: "q4",
  type: "SHORT_ANSWER",
  points: 2,
  options: [],
  correctText: "Server Component",
};

describe("gradeQuiz — objective auto-grading (FR-018)", () => {
  it("scores a perfect submission as 100 and passed", () => {
    const answers: StudentAnswer[] = [
      { questionId: "q1", selectedOptionIds: ["b"] },
      { questionId: "q2", selectedOptionIds: ["t"] },
      { questionId: "q3", selectedOptionIds: ["x", "y"] },
      { questionId: "q4", selectedOptionIds: [], answerText: "server component" },
    ];
    const r = gradeQuiz([mc, tf, ms, sa], answers, 70);
    expect(r.awardedTotal).toBe(8);
    expect(r.possibleTotal).toBe(8);
    expect(r.score).toBe(100);
    expect(r.passed).toBe(true);
  });

  it("awards points proportional to question weight", () => {
    // Only the 2-point MC correct out of 8 possible => 25%.
    const answers: StudentAnswer[] = [
      { questionId: "q1", selectedOptionIds: ["b"] },
      { questionId: "q2", selectedOptionIds: ["f"] },
      { questionId: "q3", selectedOptionIds: ["x"] },
      { questionId: "q4", selectedOptionIds: [], answerText: "wrong" },
    ];
    const r = gradeQuiz([mc, tf, ms, sa], answers, 70);
    expect(r.awardedTotal).toBe(2);
    expect(r.score).toBe(25);
    expect(r.passed).toBe(false);
  });

  it("multi-select requires the exact set — no partial credit", () => {
    expect(gradeQuiz([ms], [{ questionId: "q3", selectedOptionIds: ["x"] }], 50).score).toBe(0);
    expect(
      gradeQuiz([ms], [{ questionId: "q3", selectedOptionIds: ["x", "y", "z"] }], 50).score,
    ).toBe(0);
    expect(
      gradeQuiz([ms], [{ questionId: "q3", selectedOptionIds: ["y", "x"] }], 50).score,
    ).toBe(100);
  });

  it("short answer matches case- and whitespace-insensitively", () => {
    expect(
      gradeQuiz([sa], [{ questionId: "q4", selectedOptionIds: [], answerText: "  SERVER   component " }], 50).passed,
    ).toBe(true);
    expect(
      gradeQuiz([sa], [{ questionId: "q4", selectedOptionIds: [], answerText: "client component" }], 50).passed,
    ).toBe(false);
  });

  it("treats a missing answer as incorrect", () => {
    const r = gradeQuiz([mc, tf], [{ questionId: "q1", selectedOptionIds: ["b"] }], 50);
    expect(r.perQuestion.find((p) => p.questionId === "q2")?.correct).toBe(false);
    expect(r.score).toBe(67); // 2 of 3 points
  });

  it("respects the passing threshold boundary", () => {
    const answers: StudentAnswer[] = [
      { questionId: "q1", selectedOptionIds: ["b"] }, // 2
      { questionId: "q2", selectedOptionIds: ["t"] }, // 1
      { questionId: "q3", selectedOptionIds: ["x"] }, // 0
      { questionId: "q4", selectedOptionIds: [], answerText: "" }, // 0
    ];
    const r = gradeQuiz([mc, tf, ms, sa], answers, 37); // 3/8 = 37.5 -> 38
    expect(r.score).toBe(38);
    expect(r.passed).toBe(true);
  });

  it("does not leak which options are correct in its output", () => {
    const r = gradeQuiz([mc], [{ questionId: "q1", selectedOptionIds: ["a"] }], 50);
    expect(JSON.stringify(r)).not.toContain("isCorrect");
  });
});
