import { db } from "@/server/db";
import { hashPassword } from "@/server/auth/password";
import { registerSchema, type RegisterInput } from "@/lib/validation";
import { ConflictError } from "@/server/http";

/**
 * Register a new user with email/password credentials. Roles are limited to
 * STUDENT or INSTRUCTOR at self-signup; ADMIN is granted only by another admin.
 */
export async function registerUser(input: RegisterInput) {
  const data = registerSchema.parse(input);
  const email = data.email.toLowerCase();

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    throw new ConflictError("An account with this email already exists.");
  }

  const passwordHash = await hashPassword(data.password);
  const user = await db.user.create({
    data: {
      email,
      name: data.name,
      passwordHash,
      role: data.role,
    },
    select: { id: true, email: true, name: true, role: true },
  });
  return user;
}
