import { describe, it, expect } from 'vitest';
import { formatINR, ringOffset } from '@/features/landing/hero/format';

describe('Landing Hero format utilities', () => {
  describe('formatINR', () => {
    it('formats ₹18,00,000 correctly', () => {
      // Intl in Node/browser might format as ₹18,00,000 or with non-breaking space
      const result = formatINR(1800000).replace(/\u00a0/g, '');
      expect(result).toBe('₹18,00,000');
    });

    it('formats ₹40,000 correctly', () => {
      const result = formatINR(40000).replace(/\u00a0/g, '');
      expect(result).toBe('₹40,000');
    });

    it('formats ₹25,000 correctly', () => {
      const result = formatINR(25000).replace(/\u00a0/g, '');
      expect(result).toBe('₹25,000');
    });

    it('formats 0 as ₹0', () => {
      const result = formatINR(0).replace(/\u00a0/g, '');
      expect(result).toBe('₹0');
    });
  });

  describe('ringOffset', () => {
    it('calculates 441 for 22% planned', () => {
      expect(ringOffset(22)).toBe(441);
    });

    it('calculates 158 for 72% planned', () => {
      expect(ringOffset(72)).toBe(158);
    });

    it('calculates 339 for 40% planned', () => {
      expect(ringOffset(40)).toBe(339);
    });

    it('calculates 565 for 0% planned', () => {
      expect(ringOffset(0)).toBe(565);
    });

    it('calculates 0 for 100% planned', () => {
      expect(ringOffset(100)).toBe(0);
    });
  });
});
