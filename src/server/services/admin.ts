import type { Prisma, Role, UserStatus } from "@prisma/client";
import { db } from "@/server/db";
import { authorize, type Principal } from "@/server/access/policy";
import { NotFoundError, AppError, ConflictError, type PageParams } from "@/server/http";
import { hashPassword } from "@/server/auth/password";

/**
 * Admin user management (FR-003) with an audit trail for sensitive actions
 * (FR-033). Every mutation is admin-only and self-lockout-guarded so an admin
 * cannot demote or suspend their own account.
 */

async function writeAudit(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata?: Prisma.InputJsonValue,
) {
  await db.auditLog.create({
    data: { actorId, action, targetType, targetId, metadata },
  });
}

export async function listUsers(
  principal: Principal,
  filter: { q?: string; role?: Role },
  page: PageParams,
) {
  authorize(principal, { type: "admin:users" });
  const where: Prisma.UserWhereInput = {
    ...(filter.role ? { role: filter.role } : {}),
    ...(filter.q
      ? {
          OR: [
            { name: { contains: filter.q, mode: "insensitive" } },
            { email: { contains: filter.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: page.skip,
      take: page.pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        _count: { select: { coursesAuthored: true, enrollments: true } },
      },
    }),
    db.user.count({ where }),
  ]);
  return { items, total };
}

export async function changeUserRole(
  principal: Principal,
  userId: string,
  role: Role,
) {
  authorize(principal, { type: "admin:users" });
  if (userId === principal.id && role !== "ADMIN") {
    throw new AppError("You cannot remove your own admin role.", 422, "SELF_LOCKOUT");
  }
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) throw new NotFoundError("User not found.");

  const updated = await db.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true, status: true },
  });
  await writeAudit(principal.id, "ROLE_CHANGED", "User", userId, {
    from: user.role,
    to: role,
  });
  return updated;
}

export async function setUserStatus(
  principal: Principal,
  userId: string,
  status: UserStatus,
) {
  authorize(principal, { type: "admin:users" });
  if (userId === principal.id && status === "SUSPENDED") {
    throw new AppError("You cannot suspend your own account.", 422, "SELF_LOCKOUT");
  }
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true },
  });
  if (!user) throw new NotFoundError("User not found.");

  const updated = await db.user.update({
    where: { id: userId },
    data: { status },
    select: { id: true, name: true, email: true, role: true, status: true },
  });
  await writeAudit(
    principal.id,
    status === "SUSPENDED" ? "USER_SUSPENDED" : "USER_REACTIVATED",
    "User",
    userId,
    { from: user.status, to: status },
  );
  return updated;
}

/** Admin creates a new user with an initial password (FR-003). */
export async function createUser(
  principal: Principal,
  input: { name: string; email: string; role: Role; password: string },
) {
  authorize(principal, { type: "admin:users" });
  const email = input.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw new ConflictError("A user with that email already exists.");

  const user = await db.user.create({
    data: {
      name: input.name,
      email,
      role: input.role,
      passwordHash: await hashPassword(input.password),
      emailVerifiedAt: new Date(),
    },
    select: { id: true, name: true, email: true, role: true, status: true },
  });
  await writeAudit(principal.id, "USER_CREATED", "User", user.id, {
    role: input.role,
  });
  return user;
}

/** Admin edits a user's basic info (name). */
export async function updateUserInfo(
  principal: Principal,
  userId: string,
  input: { name: string },
) {
  authorize(principal, { type: "admin:users" });
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw new NotFoundError("User not found.");
  return db.user.update({
    where: { id: userId },
    data: { name: input.name },
    select: { id: true, name: true, email: true, role: true, status: true },
  });
}

/** Admin resets a user's password (no current-password check). */
export async function setUserPassword(
  principal: Principal,
  userId: string,
  newPassword: string,
) {
  authorize(principal, { type: "admin:users" });
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw new NotFoundError("User not found.");
  await db.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  await writeAudit(principal.id, "PASSWORD_RESET", "User", userId);
  return { ok: true };
}

/** Organization-wide totals for the admin dashboard (FR-026). */
export async function getAdminOverview(principal: Principal) {
  authorize(principal, { type: "admin:reports" });
  const [users, instructors, students, published, inReview, enrollments, completions] =
    await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: "INSTRUCTOR" } }),
      db.user.count({ where: { role: "STUDENT" } }),
      db.course.count({ where: { status: "PUBLISHED", deletedAt: null } }),
      db.course.count({ where: { status: "IN_REVIEW", deletedAt: null } }),
      db.enrollment.count(),
      db.enrollment.count({ where: { status: "COMPLETED" } }),
    ]);
  return { users, instructors, students, published, inReview, enrollments, completions };
}

export { writeAudit };
