/**
 * Lightweight sliding window in-memory rate limiter for Next.js API routes.
 * Zero external dependencies.
 */

interface RateLimitRecord {
  timestamps: number[];
}

export class SlidingWindowRateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 30, windowMs = 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  public check(identifier: string, now = Date.now()): {
    success: boolean;
    limit: number;
    remaining: number;
    resetMs: number;
  } {
    const windowStart = now - this.windowMs;
    const record = this.records.get(identifier) ?? { timestamps: [] };

    // Filter out timestamps outside current sliding window
    const activeTimestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (activeTimestamps.length >= this.maxRequests) {
      const oldestActive = activeTimestamps[0];
      const resetMs = Math.max(0, oldestActive + this.windowMs - now);
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        resetMs,
      };
    }

    activeTimestamps.push(now);
    this.records.set(identifier, { timestamps: activeTimestamps });

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - activeTimestamps.length,
      resetMs: this.windowMs,
    };
  }

  public reset(): void {
    this.records.clear();
  }
}

export const apiRateLimiter = new SlidingWindowRateLimiter(
  Number(process.env.RATE_LIMIT_MAX_REQUESTS_PER_MINUTE) || 30,
  60 * 1000
);
