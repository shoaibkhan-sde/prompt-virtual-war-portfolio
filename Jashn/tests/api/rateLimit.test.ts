import { describe, it, expect, beforeEach } from 'vitest';
import { SlidingWindowRateLimiter } from '@/lib/rateLimit';

describe('lib/rateLimit', () => {
  let limiter: SlidingWindowRateLimiter;

  beforeEach(() => {
    limiter = new SlidingWindowRateLimiter(3, 1000); // 3 requests per second
  });

  it('allows requests within limit and tracks remaining quota', () => {
    const now = 10000;
    const r1 = limiter.check('client-1', now);
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = limiter.check('client-1', now + 100);
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = limiter.check('client-1', now + 200);
    expect(r3.success).toBe(true);
    expect(r3.remaining).toBe(0);

    // 4th request exceeds limit!
    const r4 = limiter.check('client-1', now + 300);
    expect(r4.success).toBe(false);
    expect(r4.remaining).toBe(0);
    expect(r4.resetMs).toBeGreaterThan(0);
  });

  it('resets quota after sliding window passes', () => {
    const now = 10000;
    limiter.check('client-1', now);
    limiter.check('client-1', now + 100);
    limiter.check('client-1', now + 200);

    // 4th fails
    expect(limiter.check('client-1', now + 300).success).toBe(false);

    // After windowMs (1000ms), old timestamps are expired
    const afterWindow = limiter.check('client-1', now + 1500);
    expect(afterWindow.success).toBe(true);
    expect(afterWindow.remaining).toBe(2);
  });
});
