import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/server/db";
import { authConfig } from "@/server/auth/config";
import type { Principal } from "@/server/access/policy";
import { AuthorizationError } from "@/server/access/policy";

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
});

/**
 * Resolve the current request's principal, or null when unauthenticated.
 * This is the single entry point services use to obtain the acting user.
 */
export async function getPrincipal(): Promise<Principal | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    role: session.user.role,
    status: session.user.status,
  };
}

/** Require an authenticated, non-suspended principal or throw. */
export async function requirePrincipal(): Promise<Principal> {
  const principal = await getPrincipal();
  if (!principal) {
    throw new AuthorizationError("You must be signed in.");
  }
  if (principal.status === "SUSPENDED") {
    throw new AuthorizationError("Your account has been suspended.");
  }
  return principal;
}
