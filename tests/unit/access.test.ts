import { describe, it, expect } from "vitest";
import {
  can,
  authorize,
  AuthorizationError,
  type Principal,
} from "@/server/access/policy";

const admin: Principal = { id: "admin1", role: "ADMIN", status: "ACTIVE" };
const instructor: Principal = {
  id: "inst1",
  role: "INSTRUCTOR",
  status: "ACTIVE",
};
const otherInstructor: Principal = {
  id: "inst2",
  role: "INSTRUCTOR",
  status: "ACTIVE",
};
const student: Principal = { id: "stu1", role: "STUDENT", status: "ACTIVE" };
const suspended: Principal = { id: "sus1", role: "INSTRUCTOR", status: "SUSPENDED" };

const ownedDraft = {
  instructorId: "inst1",
  status: "DRAFT" as const,
  visibility: "OPEN" as const,
};
const ownedPublished = {
  instructorId: "inst1",
  status: "PUBLISHED" as const,
  visibility: "OPEN" as const,
};
const foreignDraft = {
  instructorId: "inst2",
  status: "DRAFT" as const,
  visibility: "OPEN" as const,
};
const foreignPublished = {
  instructorId: "inst2",
  status: "PUBLISHED" as const,
  visibility: "OPEN" as const,
};
const ownedRestrictedPublished = {
  instructorId: "inst1",
  status: "PUBLISHED" as const,
  visibility: "RESTRICTED" as const,
};
const foreignRestrictedPublished = {
  instructorId: "inst2",
  status: "PUBLISHED" as const,
  visibility: "RESTRICTED" as const,
};

describe("authorize() — suspended accounts", () => {
  it("denies everything for a suspended user", () => {
    expect(can(suspended, { type: "course:create" })).toBe(false);
    expect(
      can(suspended, { type: "course:update", course: ownedDraft }),
    ).toBe(false);
  });
});

describe("course authoring", () => {
  it("only instructors can create courses", () => {
    expect(can(instructor, { type: "course:create" })).toBe(true);
    expect(can(student, { type: "course:create" })).toBe(false);
    expect(can(admin, { type: "course:create" })).toBe(true);
  });

  it("instructors may edit/publish only their own courses", () => {
    expect(can(instructor, { type: "course:update", course: ownedDraft })).toBe(
      true,
    );
    expect(
      can(instructor, { type: "course:publish", course: ownedDraft }),
    ).toBe(true);
    expect(
      can(otherInstructor, { type: "course:update", course: ownedDraft }),
    ).toBe(false);
    expect(
      can(otherInstructor, { type: "course:publish", course: ownedDraft }),
    ).toBe(false);
  });

  it("admins may edit any course", () => {
    expect(can(admin, { type: "course:update", course: foreignDraft })).toBe(
      true,
    );
  });

  it("students cannot edit courses", () => {
    expect(can(student, { type: "course:update", course: ownedDraft })).toBe(
      false,
    );
  });
});

describe("course:read visibility", () => {
  it("anyone may read a published course", () => {
    expect(can(student, { type: "course:read", course: foreignPublished })).toBe(
      true,
    );
    expect(
      can(otherInstructor, { type: "course:read", course: ownedPublished }),
    ).toBe(true);
  });

  it("only owner (or enrolled) may read a draft", () => {
    expect(can(instructor, { type: "course:read", course: ownedDraft })).toBe(
      true,
    );
    expect(
      can(otherInstructor, { type: "course:read", course: ownedDraft }),
    ).toBe(false);
    expect(
      can(student, {
        type: "course:read",
        course: ownedDraft,
        isEnrolled: true,
      }),
    ).toBe(true);
    expect(
      can(student, {
        type: "course:read",
        course: ownedDraft,
        isEnrolled: false,
      }),
    ).toBe(false);
  });
});

describe("course:read on a RESTRICTED course (specs/002-assign-courses)", () => {
  it("owner and enrolled students may read; nobody else can, even though it's published", () => {
    expect(
      can(instructor, { type: "course:read", course: ownedRestrictedPublished }),
    ).toBe(true);
    expect(
      can(student, {
        type: "course:read",
        course: ownedRestrictedPublished,
        isEnrolled: true,
      }),
    ).toBe(true);
    expect(
      can(student, {
        type: "course:read",
        course: ownedRestrictedPublished,
        isEnrolled: false,
      }),
    ).toBe(false);
    expect(
      can(otherInstructor, {
        type: "course:read",
        course: ownedRestrictedPublished,
      }),
    ).toBe(false);
  });

  it("admins may always read a RESTRICTED course", () => {
    expect(
      can(admin, { type: "course:read", course: foreignRestrictedPublished }),
    ).toBe(true);
  });
});

describe("course-assignment:manage / group:manage / course:visibility (specs/002-assign-courses)", () => {
  it("only the owning instructor or an admin may manage course-access assignments", () => {
    expect(
      can(instructor, {
        type: "course-assignment:manage",
        course: ownedRestrictedPublished,
      }),
    ).toBe(true);
    expect(
      can(otherInstructor, {
        type: "course-assignment:manage",
        course: ownedRestrictedPublished,
      }),
    ).toBe(false);
    expect(
      can(admin, {
        type: "course-assignment:manage",
        course: foreignRestrictedPublished,
      }),
    ).toBe(true);
    expect(
      can(student, {
        type: "course-assignment:manage",
        course: ownedRestrictedPublished,
      }),
    ).toBe(false);
  });

  it("only the owning instructor or an admin may toggle course visibility", () => {
    expect(
      can(instructor, { type: "course:visibility", course: ownedDraft }),
    ).toBe(true);
    expect(
      can(otherInstructor, { type: "course:visibility", course: ownedDraft }),
    ).toBe(false);
    expect(can(admin, { type: "course:visibility", course: foreignDraft })).toBe(
      true,
    );
  });

  it("only the owning instructor or an admin may manage a group", () => {
    const ownedGroup = { ownerId: "inst1" };
    expect(can(instructor, { type: "group:manage", group: ownedGroup })).toBe(
      true,
    );
    expect(
      can(otherInstructor, { type: "group:manage", group: ownedGroup }),
    ).toBe(false);
    expect(can(admin, { type: "group:manage", group: ownedGroup })).toBe(true);
    expect(can(student, { type: "group:manage", group: ownedGroup })).toBe(
      false,
    );
  });
});

describe("enrollment & learning ownership", () => {
  it("only students may enroll, and only in published, OPEN courses", () => {
    expect(
      can(student, { type: "enrollment:create", course: ownedPublished }),
    ).toBe(true);
    expect(
      can(student, { type: "enrollment:create", course: ownedDraft }),
    ).toBe(false);
    expect(
      can(instructor, { type: "enrollment:create", course: ownedPublished }),
    ).toBe(false);
  });

  it("students cannot self-enroll in a RESTRICTED course — assignment is the only path in", () => {
    expect(
      can(student, {
        type: "enrollment:create",
        course: ownedRestrictedPublished,
      }),
    ).toBe(false);
    // Even an admin acting through the self-service action is denied — the
    // instructor/admin path is course-assignment:manage instead, not this.
    expect(
      can(admin, {
        type: "enrollment:create",
        course: ownedRestrictedPublished,
      }),
    ).toBe(false);
  });

  it("a student may only complete lessons in their own enrollment", () => {
    expect(
      can(student, {
        type: "lesson:complete",
        enrollment: { studentId: "stu1" },
      }),
    ).toBe(true);
    expect(
      can(student, {
        type: "lesson:complete",
        enrollment: { studentId: "stu2" },
      }),
    ).toBe(false);
  });
});

describe("admin actions", () => {
  it("only admins may manage users, review, categories, reports, certificates", () => {
    for (const a of [
      "admin:users",
      "admin:review",
      "admin:categories",
      "admin:reports",
      "admin:certificates",
    ] as const) {
      expect(can(admin, { type: a })).toBe(true);
      expect(can(instructor, { type: a })).toBe(false);
      expect(can(student, { type: a })).toBe(false);
    }
  });
});

describe("certificate management", () => {
  it("the owning instructor or an admin may manage a course's certificates", () => {
    expect(
      can(instructor, { type: "certificate:manage", course: ownedPublished }),
    ).toBe(true);
    expect(
      can(admin, { type: "certificate:manage", course: foreignPublished }),
    ).toBe(true);
  });

  it("a non-owning instructor or a student may not", () => {
    expect(
      can(otherInstructor, { type: "certificate:manage", course: ownedPublished }),
    ).toBe(false);
    expect(
      can(student, { type: "certificate:manage", course: ownedPublished }),
    ).toBe(false);
  });
});

describe("authorize() throwing variant", () => {
  it("throws AuthorizationError when denied", () => {
    expect(() =>
      authorize(student, { type: "course:create" }),
    ).toThrow(AuthorizationError);
  });

  it("does not throw when allowed", () => {
    expect(() =>
      authorize(instructor, { type: "course:create" }),
    ).not.toThrow();
  });
});
