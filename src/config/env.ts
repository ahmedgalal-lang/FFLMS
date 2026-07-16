import { z } from "zod";

/**
 * Central, Zod-validated environment access. Import `env` anywhere on the
 * server; never read `process.env` directly. Client code must not import this
 * module (it would leak server secrets into the bundle).
 */
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
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
  MAX_UPLOAD_MB: z.coerce.number().positive().default(50),
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
export const isStorageConfigured =
  env.S3_ENDPOINT !== "" && env.S3_BUCKET !== "" && env.S3_ACCESS_KEY_ID !== "";
