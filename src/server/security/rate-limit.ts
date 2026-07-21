/**
 * Minimal in-memory fixed-window rate limiter. This is a best-effort baseline —
 * on serverless it is per-instance, so production should back it with a shared
 * store (e.g. Upstash Redis). It still meaningfully slows brute-force within an
 * instance and is a safe default with no external dependency.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export type RateLimitResult = { allowed: boolean; retryAfterSec: number };

export function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { allowed: true, retryAfterSec: 0 };
  }
  if (bucket.count < limit) {
    bucket.count += 1;
    return { allowed: true, retryAfterSec: 0 };
  }
  return {
    allowed: false,
    retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
  };
}

/** Opportunistically drop expired buckets so the map does not grow unbounded. */
export function sweepRateLimits() {
  const now = Date.now();
  for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
}
