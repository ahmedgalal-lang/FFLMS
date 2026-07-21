import { z } from "zod";

/**
 * Central, Zod-validated environment access. Import `env` anywhere on the
 * server; never read `process.env` directly. Client code must not import this
 * module (it would leak server secrets into the bundle).
 */
/**
 * Bridge provider-injected env names to the canonical ones Prisma uses, so
 * Vercel + Supabase (which inject POSTGRES_PRISMA_URL / POSTGRES_URL /
 * POSTGRES_URL_NON_POOLING) work without manually setting DATABASE_URL. Runs
 * before validation; a locally-set DATABASE_URL always takes precedence.
 */
function normalizeDatabaseEnv() {
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    "";
  process.env.DIRECT_URL =
    process.env.DIRECT_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    "";
}
normalizeDatabaseEnv();

/**
 * Supabase Storage powers large-media (video) uploads: the browser uploads
 * directly to Supabase via a server-minted signed URL, so files never pass
 * through the app's request body (Vercel caps that at ~4.5MB). Vercel's Supabase
 * integration injects NEXT_PUBLIC_SUPABASE_URL; bridge it to SUPABASE_URL so the
 * server can construct storage endpoints without extra config.
 */
function normalizeSupabaseEnv() {
  process.env.SUPABASE_URL =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  process.env.SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    "";
}
normalizeSupabaseEnv();

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(1),
  AUTH_URL: z.string().url().optional(),
  AUTH_GITHUB_ID: z.string().optional().default(""),
  AUTH_GITHUB_SECRET: z.string().optional().default(""),
  S3_ENDPOINT: z.string().optional().default(""),
  S3_REGION: z.string().optional().default("us-east-1"),
  S3_BUCKET: z.string().optional().default(""),
  S3_ACCESS_KEY_ID: z.string().optional().default(""),
  S3_SECRET_ACCESS_KEY: z.string().optional().default(""),
  S3_PUBLIC_URL: z.string().optional().default(""),
  // Transactional email (optional). With RESEND_API_KEY set, emails are sent via
  // Resend; otherwise they are logged (dev/no-provider fallback).
  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().optional().default("LMS <onboarding@resend.dev>"),
  APP_URL: z.string().url().optional(),
  MAX_UPLOAD_MB: z.coerce.number().positive().default(50),
  // Supabase Storage (optional) for direct-to-storage video uploads.
  SUPABASE_URL: z.string().optional().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(""),
  SUPABASE_STORAGE_BUCKET: z.string().optional().default("media"),
  MAX_VIDEO_MB: z.coerce.number().positive().default(500),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}

export const env = loadEnv();

export const isOAuthEnabled = env.AUTH_GITHUB_ID !== "" && env.AUTH_GITHUB_SECRET !== "";

/** Whether direct-to-Supabase video uploads are available (URL + service key set). */
export const isSupabaseStorageEnabled =
  env.SUPABASE_URL !== "" && env.SUPABASE_SERVICE_ROLE_KEY !== "";
