import redis from '../config/redis';
import { config } from '../config';
import { logger } from '../db/logger';

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  resetAt: Date;
  delayUntil?: Date;
}

/**
 * Redis-backed per-sender rate limiter.
 * Key: rate_limit:{sender}:{YYYY-MM-DD-HH}
 * Uses atomic INCR to safely support multiple workers/instances.
 */
export async function checkAndIncrementRateLimit(
  senderEmail: string,
  limit?: number
): Promise<RateLimitResult> {
  const effectiveLimit = limit ?? config.rateLimiting.maxEmailsPerHourPerSender;
  const now = new Date();

  // Key format: rate_limit:sender@email.com:2024-01-15-14 (hourly window)
  const hourWindow = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}-${String(now.getUTCHours()).padStart(2, '0')}`;
  const key = `rate_limit:${senderEmail}:${hourWindow}`;

  // Atomic increment
  const current = await redis.incr(key);

  // Set TTL on first use (2 hours to be safe)
  if (current === 1) {
    await redis.expire(key, 7200);
  }

  // Calculate next hour reset time
  const resetAt = new Date(now);
  resetAt.setUTCMinutes(0, 0, 0);
  resetAt.setUTCHours(resetAt.getUTCHours() + 1);

  if (current > effectiveLimit) {
    // Rollback the increment since we can't send
    await redis.decr(key);

    logger.warn('Rate limit exceeded for sender', {
      senderEmail,
      current: current - 1,
      limit: effectiveLimit,
      resetAt: resetAt.toISOString(),
    });

    return {
      allowed: false,
      current: current - 1,
      limit: effectiveLimit,
      resetAt,
      delayUntil: resetAt,
    };
  }

  return {
    allowed: true,
    current,
    limit: effectiveLimit,
    resetAt,
  };
}

/**
 * Get current count for a sender in the current hour window.
 */
export async function getCurrentHourCount(senderEmail: string): Promise<number> {
  const now = new Date();
  const hourWindow = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}-${String(now.getUTCHours()).padStart(2, '0')}`;
  const key = `rate_limit:${senderEmail}:${hourWindow}`;
  const value = await redis.get(key);
  return value ? parseInt(value) : 0;
}

/**
 * Calculate delay until next hour window opens.
 * Used to reschedule jobs that exceeded the rate limit.
 */
export function getDelayUntilNextHour(): number {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setUTCMinutes(0, 0, 0);
  nextHour.setUTCHours(nextHour.getUTCHours() + 1);
  return nextHour.getTime() - now.getTime();
}
