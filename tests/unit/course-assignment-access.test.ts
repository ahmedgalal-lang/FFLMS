import { describe, it, expect } from "vitest";
import { hasRemainingAccess } from "@/server/services/course-assignment-calc";

const empty = { directAssignments: [], memberships: [], groupCourseAssignments: [] };

describe("hasRemainingAccess() — direct assignment", () => {
  it("has access when a direct, non-revoked assignment exists", () => {
    expect(
      hasRemainingAccess("stu1", "course1", {
        ...empty,
        directAssignments: [
          { studentId: "stu1", courseId: "course1", revokedAt: null },
        ],
      }),
    ).toBe(true);
  });

  it("has no access once the direct assignment is revoked", () => {
    expect(
      hasRemainingAccess("stu1", "course1", {
        ...empty,
        directAssignments: [
          { studentId: "stu1", courseId: "course1", revokedAt: new Date() },
        ],
      }),
    ).toBe(false);
  });

  it("ignores another student's or another course's direct assignment", () => {
    expect(
      hasRemainingAccess("stu1", "course1", {
        ...empty,
        directAssignments: [
          { studentId: "stu2", courseId: "course1", revokedAt: null },
          { studentId: "stu1", courseId: "course2", revokedAt: null },
        ],
      }),
    ).toBe(false);
  });
});

describe("hasRemainingAccess() — group-derived access", () => {
  it("has access via a group membership + active group course assignment", () => {
    expect(
      hasRemainingAccess("stu1", "course1", {
        directAssignments: [],
        memberships: [{ studentId: "stu1", groupId: "group1" }],
        groupCourseAssignments: [
          { groupId: "group1", courseId: "course1", revokedAt: null },
        ],
      }),
    ).toBe(true);
  });

  it("has no access if the group's course assignment is revoked", () => {
    expect(
      hasRemainingAccess("stu1", "course1", {
        directAssignments: [],
        memberships: [{ studentId: "stu1", groupId: "group1" }],
        groupCourseAssignments: [
          { groupId: "group1", courseId: "course1", revokedAt: new Date() },
        ],
      }),
    ).toBe(false);
  });

  it("has no access if the student isn't a member of the group the course is assigned to", () => {
    expect(
      hasRemainingAccess("stu1", "course1", {
        directAssignments: [],
        memberships: [{ studentId: "stu1", groupId: "group2" }],
        groupCourseAssignments: [
          { groupId: "group1", courseId: "course1", revokedAt: null },
        ],
      }),
    ).toBe(false);
  });
});

describe("hasRemainingAccess() — multiple routes (spec edge case: student in more than one group)", () => {
  it("retains access via a second group after being removed from the first", () => {
    // Membership row for group1 is simply absent (removed); group2's remains.
    expect(
      hasRemainingAccess("stu1", "course1", {
        directAssignments: [],
        memberships: [{ studentId: "stu1", groupId: "group2" }],
        groupCourseAssignments: [
          { groupId: "group1", courseId: "course1", revokedAt: null },
          { groupId: "group2", courseId: "course1", revokedAt: null },
        ],
      }),
    ).toBe(true);
  });

  it("retains access via a group after a direct assignment is revoked", () => {
    expect(
      hasRemainingAccess("stu1", "course1", {
        directAssignments: [
          { studentId: "stu1", courseId: "course1", revokedAt: new Date() },
        ],
        memberships: [{ studentId: "stu1", groupId: "group1" }],
        groupCourseAssignments: [
          { groupId: "group1", courseId: "course1", revokedAt: null },
        ],
      }),
    ).toBe(true);
  });

  it("retains access via a direct assignment after being removed from every group", () => {
    expect(
      hasRemainingAccess("stu1", "course1", {
        directAssignments: [
          { studentId: "stu1", courseId: "course1", revokedAt: null },
        ],
        memberships: [],
        groupCourseAssignments: [
          { groupId: "group1", courseId: "course1", revokedAt: null },
        ],
      }),
    ).toBe(true);
  });

  it("loses access only when neither route remains", () => {
    expect(
      hasRemainingAccess("stu1", "course1", {
        directAssignments: [
          { studentId: "stu1", courseId: "course1", revokedAt: new Date() },
        ],
        memberships: [],
        groupCourseAssignments: [
          { groupId: "group1", courseId: "course1", revokedAt: new Date() },
        ],
      }),
    ).toBe(false);
  });
});

describe("hasRemainingAccess() — no relevant data", () => {
  it("returns false for a student/course with no rows at all", () => {
    expect(hasRemainingAccess("stu1", "course1", empty)).toBe(false);
  });
});
