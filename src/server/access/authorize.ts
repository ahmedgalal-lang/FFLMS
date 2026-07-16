import type { Role } from "@prisma/client";

/**
 * Central authorization policy (constitution Principle V: deny-by-default,
 * server-enforced, role + ownership). Pure and unit-testable: it decides on
 * plain facts the caller has already loaded. UI hiding is never the sole
 * control — every mutation calls this on the server.
 */

export type Actor = {
  id: string;
  role: Role;
  status: "ACTIVE" | "SUSPENDED";
};

export type Action =
  // authoring
  | "course:create"
  | "course:update"
  | "course:publish"
  | "course:delete"
  // learning
  | "course:enroll"
  | "progress:write"
  // admin
  | "admin:manageUsers"
  | "admin:reviewCourse";

export type ResourceContext = {
  /** owner of the resource, when the action targets a specific course/enrollment */
  ownerId?: string;
};

export class AuthorizationError extends Error {
  constructor(message = "Not authorized") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function can(
  actor: Actor | null | undefined,
  action: Action,
  ctx: ResourceContext = {},
): boolean {
  // Deny-by-default: no session or suspended account => nothing.
  if (!actor) return false;
  if (actor.status === "SUSPENDED") return false;

  const isAdmin = actor.role === "ADMIN";
  const isInstructor = actor.role === "INSTRUCTOR";
  const isStudent = actor.role === "STUDENT";
  const isOwner = ctx.ownerId !== undefined && ctx.ownerId === actor.id;

  switch (action) {
    case "course:create":
      return isAdmin || isInstructor;

    case "course:update":
    case "course:delete":
      return isAdmin || (isInstructor && isOwner);

    case "course:publish":
      // Instructors submit/publish their own; admins may publish any.
      return isAdmin || (isInstructor && isOwner);

    case "course:enroll":
      return isStudent || isAdmin;

    case "progress:write":
      // A student may only write their own enrollment's progress.
      return (isStudent && isOwner) || isAdmin;

    case "admin:manageUsers":
    case "admin:reviewCourse":
      return isAdmin;

    default:
      return false;
  }
}

/** Throwing guard for use at the top of services / server actions. */
export function authorize(
  actor: Actor | null | undefined,
  action: Action,
  ctx: ResourceContext = {},
): asserts actor is Actor {
  if (!can(actor, action, ctx)) {
    throw new AuthorizationError();
  }
}
