import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { db } from "@/server/db";
import { env, googleOAuthEnabled } from "@/env";
import { credentialsSchema } from "@/lib/validation/auth";
import type { Actor } from "@/server/access/authorize";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      status: "ACTIVE" | "SUSPENDED";
    } & DefaultSession["user"];
  }
}

const providers = [
  Credentials({
    credentials: { email: {}, password: {} },
    authorize: async (raw) => {
      const parsed = credentialsSchema.safeParse(raw);
      if (!parsed.success) return null;
      const { email, password } = parsed.data;

      const user = await db.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash) return null;
      if (user.status === "SUSPENDED") return null;

      const ok = await bcrypt.compare(password, user.passwordHash);
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
  ...(googleOAuthEnabled
    ? [Google({ clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET })]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  secret: env.AUTH_SECRET,
  pages: { signIn: "/sign-in" },
  providers,
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: Role }).role;
        token.status = (user as { status: "ACTIVE" | "SUSPENDED" }).status;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.status = token.status as "ACTIVE" | "SUSPENDED";
      }
      return session;
    },
  },
});

/** Convenience: resolve the current actor for authorize(), or null. */
export async function currentActor(): Promise<Actor | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    role: session.user.role,
    status: session.user.status,
  };
}
