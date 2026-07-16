import { z } from "zod";

/**
 * Validated environment. At real runtime the app fails fast if required vars
 * are missing or malformed (constitution: no unchecked config across a
 * boundary).
 *
 * Exception: during `next build` (page-data collection) the hosting platform
 * may not expose runtime secrets yet. We must not crash the build then —
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
      `Set these in your hosting provider (e.g. Vercel Project Settings → ` +
      `Environment Variables) or in .env for local dev.`,
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
