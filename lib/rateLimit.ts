/**
 * Keraunous Tech Store — Rate Limiting Helper
 *
 * In-memory sliding window limiter for local/dev use (replaced by Upstash Redis in U15).
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * Check and record a rate limited action.
 *
 * @param key Unique key (e.g., `login:${ip}`)
 * @param limit Maximum allowed events in window
 * @param windowMs Time window in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(key) ?? { timestamps: [] };

  // Filter timestamps within window
  const validTimestamps = record.timestamps.filter(
    (t) => now - t < windowMs,
  );

  if (validTimestamps.length >= limit) {
    const oldest = validTimestamps[0];
    const resetMs = Math.max(0, windowMs - (now - oldest));
    rateLimitStore.set(key, { timestamps: validTimestamps });
    return {
      allowed: false,
      remaining: 0,
      resetMs,
    };
  }

  validTimestamps.push(now);
  rateLimitStore.set(key, { timestamps: validTimestamps });

  return {
    allowed: true,
    remaining: limit - validTimestamps.length,
    resetMs: windowMs,
  };
}

/**
 * Reset rate limit for a specific key (e.g., upon successful login).
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
