/**
 * Keraunous Tech Store — Centralized Rate Limiting Policy & Limiter
 *
 * Implements Blueprint §10.3 (U15) & §12.1:
 * - Centralized endpoint rate-limit definitions in one place
 * - In-memory sliding window algorithm with millisecond precision
 * - Fast reset utilities for testing and verification
 */

export interface RateLimitPolicy {
  limit: number;
  windowMs: number;
}

export const RATE_LIMIT_POLICIES = {
  // Orders: 5 attempts per hour per IP (Blueprint §8.3, §10.3)
  orders: {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  },
  // WhatsApp Handoff ping: 10 per hour per IP
  handoff: {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  },
  // Order Tracking IP rate limit: 10 attempts per minute per IP (Blueprint §8.4)
  trackIp: {
    limit: 10,
    windowMs: 60 * 1000,
  },
  // Order Tracking ID rate limit: 5 attempts per 10 minutes per public ID (Blueprint §8.4)
  trackOrder: {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  },
  // Search API: 30 queries per minute per IP (Blueprint §8.2)
  search: {
    limit: 30,
    windowMs: 60 * 1000,
  },
  // Order List / Wishlist resolve: 20 calls per minute per IP
  listResolve: {
    limit: 20,
    windowMs: 60 * 1000,
  },
  // Admin Login: 5 failed attempts per 15 minutes per IP (Blueprint §10.3 U03)
  login: {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  },
} as const;

export type RateLimitPolicyName = keyof typeof RATE_LIMIT_POLICIES;

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
 * @param key Unique key (e.g., `orders:abc123hash`)
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

  // Filter timestamps within sliding window
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
 * Convenience helper applying a named policy from RATE_LIMIT_POLICIES.
 */
export function checkPolicyRateLimit(
  policyName: RateLimitPolicyName,
  identifier: string,
): RateLimitResult {
  const policy = RATE_LIMIT_POLICIES[policyName];
  return checkRateLimit(`${policyName}:${identifier}`, policy.limit, policy.windowMs);
}

/**
 * Reset rate limit for a specific key (e.g., upon successful login).
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Clear the entire rate limit store (for test suites).
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}
