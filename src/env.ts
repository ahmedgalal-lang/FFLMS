import { z } from "zod";

/**
 * Normalize provider-injected variable names to the canonical ones the app and
 * Prisma schema use. The Vercel + Supabase integration injects
 * POSTGRES_PRISMA_URL / POSTGRES_URL_NON_POOLING / SUPABASE_JWT_SECRET rather
 * than DATABASE_URL / DIRECT_URL / AUTH_SECRET, so we bridge them here. Local
 * dev and CranL set the canonical names directly and are left untouched.
 */
function firstNonEmpty(...vals: Array<string | undefined>): string | undefined {
  for (const v of vals) if (v && v.length > 0) return v;
  return undefined;
}

const databaseUrl = firstNonEmpty(
  process.env.DATABASE_URL,
  process.env.POSTGRES_PRISMA_URL, // Supabase pooled (PgBouncer) — ideal for Prisma
  process.env.POSTGRES_URL,
);
if (databaseUrl) process.env.DATABASE_URL = databaseUrl;

const directUrl = firstNonEmpty(
  process.env.DIRECT_URL,
  process.env.POSTGRES_URL_NON_POOLING, // Supabase direct — for migrations
  databaseUrl,
);
if (directUrl) process.env.DIRECT_URL = directUrl;

const authSecret = firstNonEmpty(
  process.env.AUTH_SECRET,
  process.env.SUPABASE_JWT_SECRET, // convenience fallback so deploys boot
);
if (authSecret) process.env.AUTH_SECRET = authSecret;

/**
 * Validated environment. At real runtime the app fails fast if required vars
 * are missing or malformed. During `next build` (page-data collection) the
 * platform may not expose runtime secrets yet, so we don't crash the build —
 * values are re-validated on the first request, where they ARE present.
 */
const schema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters"),
  AUTH_URL: z.string().url().optional(),
  AUTH_GOOGLE_ID: z.string().optional().default(""),
  AUTH_GOOGLE_SECRET: z.string().optional().default(""),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .optional()
    .default("development"),
});

type Env = z.infer<typeof schema>;

const parsed = schema.safeParse(process.env);

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
const skipValidation =
  process.env.SKIP_ENV_VALIDATION === "1" ||
  process.env.SKIP_ENV_VALIDATION === "true";

if (!parsed.success && !isBuildPhase && !skipValidation) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(
    `Invalid environment configuration:\n${issues}\n` +
      `Set DATABASE_URL and AUTH_SECRET (or the equivalent Supabase-injected ` +
      `POSTGRES_PRISMA_URL / SUPABASE_JWT_SECRET) in your hosting provider's ` +
      `Environment Variables, or in .env for local dev.`,
  );
}

/** Loose fallback used only during the build phase when vars are absent. */
const buildFallback: Env = {
  DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://build/placeholder",
  AUTH_SECRET: process.env.AUTH_SECRET ?? "build-time-placeholder-secret",
  AUTH_URL: process.env.AUTH_URL,
  AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID ?? "",
  AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET ?? "",
  NODE_ENV:
    (process.env.NODE_ENV as Env["NODE_ENV"] | undefined) ?? "production",
};

export const env: Env = parsed.success ? parsed.data : buildFallback;

export const googleOAuthEnabled =
  env.AUTH_GOOGLE_ID.length > 0 && env.AUTH_GOOGLE_SECRET.length > 0;
