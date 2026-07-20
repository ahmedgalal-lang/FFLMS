import pino from "pino";

/**
 * Structured logger. In production emits JSON lines suitable for log
 * aggregation; in development pretty-prints via the default pino transport.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
  base: undefined,
  redact: {
    paths: ["password", "passwordHash", "*.password", "*.passwordHash", "token", "*.token"],
    censor: "[redacted]",
  },
});

/** Log and swallow — used for best-effort side effects (e.g. notifications). */
export async function bestEffort<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (err) {
    logger.error({ err, label }, "best-effort task failed");
    return undefined;
  }
}
