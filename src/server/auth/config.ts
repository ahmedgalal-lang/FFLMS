import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { z } from "zod";
import { db } from "@/server/db";
import { env, isOAuthEnabled } from "@/config/env";
import { verifyPassword } from "@/server/auth/password";
import { rateLimit } from "@/server/security/rate-limit";
import { logger } from "@/server/observability";
import type { Role, UserStatus } from "@prisma/client";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const providers: NextAuthConfig["providers"] = [
  Credentials({
    credentials: { email: {}, password: {} },
    authorize: async (raw) => {
      const parsed = credentialsSchema.safeParse(raw);
      if (!parsed.success) return null;
      const { email, password } = parsed.data;

      // Throttle sign-in attempts per email (best-effort brute-force defense).
      const rl = rateLimit(`signin:${email.toLowerCase()}`, 10, 300);
      if (!rl.allowed) {
        logger.warn({ email: email.toLowerCase() }, "sign-in rate limited");
        return null;
      }

      const user = await db.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (!user || !user.passwordHash) return null;
      if (user.status === "SUSPENDED") return null;

      const ok = await verifyPassword(user.passwordHash, password);
      if (!ok) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.avatarUrl ?? undefined,
        role: user.role,
        status: user.status,
      };
    },
  }),
];

if (isOAuthEnabled) {
  providers.push(
    GitHub({
      clientId: env.AUTH_GITHUB_ID,
      clientSecret: env.AUTH_GITHUB_SECRET,
    }),
  );
}

/**
 * Base Auth.js config. Uses JWT sessions so `role`/`status` are available in
 * middleware and RSCs without a DB round-trip. The DB adapter is attached in
 * `index.ts` (server-only) so this config can be imported by middleware.
 */
export const authConfig = {
  providers,
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as { role: Role }).role;
        token.status = (user as { status: UserStatus }).status;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as Role;
        session.user.status = token.status as UserStatus;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
