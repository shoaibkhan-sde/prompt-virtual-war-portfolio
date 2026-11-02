import { describe, it, expect } from 'vitest';
import { isActive } from '@/components/layout/navbar/isActive';

describe('isActive nav matching logic', () => {
  it('returns true for root route on href /', () => {
    expect(isActive('/', '/')).toBe(true);
  });

  it('returns false for /scenarios on href /', () => {
    expect(isActive('/scenarios', '/')).toBe(false);
  });

  it('returns true for /scenarios on href /scenarios', () => {
    expect(isActive('/scenarios', '/scenarios')).toBe(true);
  });

  it('returns true for child route /scenarios/abc on href /scenarios', () => {
    expect(isActive('/scenarios/abc', '/scenarios')).toBe(true);
  });

  it('returns false for unrelated route /plan/new on href /', () => {
    expect(isActive('/plan/new', '/')).toBe(false);
  });

  it('returns false for unrelated route /plan/new on href /scenarios', () => {
    expect(isActive('/plan/new', '/scenarios')).toBe(false);
  });

  it('handles empty or undefined values gracefully', () => {
    expect(isActive('', '/')).toBe(false);
    expect(isActive('/', '')).toBe(false);
    expect(isActive('/scenarios-other', '/scenarios')).toBe(false);
  });
});
