import type { Role, UserStatus, CourseStatus, CourseVisibility } from "@prisma/client";

/**
 * Central authorization policy (Constitution Principle V).
 *
 * Deny-by-default. Every server mutation and non-public read must pass through
 * `authorize()` (throws) or `can()` (boolean). These functions are PURE — they
 * take the principal and the already-loaded resource attributes, so they can be
 * unit-tested exhaustively without a database.
 */

export type Principal = {
  id: string;
  role: Role;
  status: UserStatus;
};

export class AuthorizationError extends Error {
  constructor(message = "You are not allowed to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

// Resource descriptors — only the attributes policies need.
export type CourseResource = {
  instructorId: string;
  status: CourseStatus;
  visibility: CourseVisibility;
};

export type EnrollmentResource = {
  studentId: string;
};

export type GroupResource = {
  ownerId: string;
};

export type Action =
  // Course authoring
  | { type: "course:create" }
  | { type: "course:read"; course: CourseResource; isEnrolled?: boolean }
  | { type: "course:update"; course: CourseResource }
  | { type: "course:delete"; course: CourseResource }
  | { type: "course:publish"; course: CourseResource }
  // Curriculum (modules/lessons/content) — gated by the owning course
  | { type: "curriculum:edit"; course: CourseResource }
  | { type: "course:visibility"; course: CourseResource }
  // Enrollment & learning
  | { type: "enrollment:create"; course: CourseResource }
  | { type: "enrollment:read"; enrollment: EnrollmentResource }
  | { type: "lesson:complete"; enrollment: EnrollmentResource }
  // Course-access assignment (specs/002-assign-courses) — grants of access to
  // a RESTRICTED course, direct or via a Group. Unrelated to "assignment:manage"
  // below, which is the coursework Assignment (gradable lesson) type.
  | { type: "course-assignment:manage"; course: CourseResource }
  | { type: "group:manage"; group: GroupResource }
  // Assessments
  | { type: "quiz:manage"; course: CourseResource }
  | { type: "quiz:attempt"; enrollment: EnrollmentResource }
  | { type: "assignment:manage"; course: CourseResource }
  | { type: "assignment:submit"; enrollment: EnrollmentResource }
  | { type: "assignment:grade"; course: CourseResource }
  | { type: "gradebook:read"; course: CourseResource }
  | { type: "certificate:manage"; course: CourseResource }
  // Discussions & announcements
  | { type: "discussion:participate"; course: CourseResource; isEnrolled: boolean }
  | { type: "announcement:create"; course: CourseResource }
  // Admin
  | { type: "admin:users" }
  | { type: "admin:review" }
  | { type: "admin:categories" }
  | { type: "admin:reports" }
  | { type: "admin:certificates" };

const isAdmin = (p: Principal) => p.role === "ADMIN";
const owns = (p: Principal, course: CourseResource) =>
  p.role === "INSTRUCTOR" && course.instructorId === p.id;
const ownsEnrollment = (p: Principal, e: EnrollmentResource) =>
  e.studentId === p.id;
const ownsGroup = (p: Principal, group: GroupResource) =>
  p.role === "INSTRUCTOR" && group.ownerId === p.id;

/**
 * Decide whether `principal` may perform `action`. Pure and side-effect free.
 * Suspended accounts are denied everything.
 */
export function can(principal: Principal, action: Action): boolean {
  if (principal.status === "SUSPENDED") return false;
  if (isAdmin(principal)) {
    // Admins may do everything except *acting as* a student for learning
    // actions that only make sense for the enrolled owner.
    switch (action.type) {
      case "enrollment:create":
      case "lesson:complete":
      case "quiz:attempt":
      case "assignment:submit":
        break; // fall through to ownership checks below
      default:
        return true;
    }
  }

  switch (action.type) {
    case "course:create":
      return principal.role === "INSTRUCTOR";

    case "course:read":
      if (action.course.status === "PUBLISHED" && action.course.visibility === "OPEN") {
        return true;
      }
      return owns(principal, action.course) || action.isEnrolled === true;

    case "course:update":
    case "course:delete":
    case "course:publish":
    case "course:visibility":
    case "curriculum:edit":
    case "quiz:manage":
    case "assignment:manage":
    case "assignment:grade":
    case "gradebook:read":
    case "certificate:manage":
    case "announcement:create":
    case "course-assignment:manage":
      return owns(principal, action.course);

    case "group:manage":
      return ownsGroup(principal, action.group);

    case "discussion:participate":
      // The course instructor, or any student with an active enrollment.
      return owns(principal, action.course) || action.isEnrolled === true;

    case "enrollment:create":
      return (
        principal.role === "STUDENT" &&
        action.course.status === "PUBLISHED" &&
        action.course.visibility === "OPEN"
      );

    case "enrollment:read":
      return ownsEnrollment(principal, action.enrollment);

    case "lesson:complete":
    case "quiz:attempt":
    case "assignment:submit":
      return ownsEnrollment(principal, action.enrollment);

    case "admin:users":
    case "admin:review":
    case "admin:categories":
    case "admin:reports":
    case "admin:certificates":
      return false; // only admins, already returned true above

    default:
      return false;
  }
}

/** Throwing variant for use at the top of server actions / route handlers. */
export function authorize(principal: Principal, action: Action): void {
  if (!can(principal, action)) {
    throw new AuthorizationError();
  }
}
