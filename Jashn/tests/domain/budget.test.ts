import { describe, it, expect } from 'vitest';
import {
  calculateCategoryTotals,
  calculateBudgetTotals,
  rebalanceBudget,
  applyPercentageAdjustment,
  roundCurrency,
} from '@/domain/budget';
import { BudgetItem } from '@/domain/types';

describe('domain/budget', () => {
  const sampleItems: BudgetItem[] = [
    { id: '1', category: 'venue', name: 'Banquet Hall', allocatedAmount: 450000, spentAmount: 225000 },
    { id: '2', category: 'catering', name: 'Catering Service', allocatedAmount: 540000, spentAmount: 100000 },
    { id: '3', category: 'decor', name: 'Floral Stage', allocatedAmount: 216000, spentAmount: 0 },
    { id: '4', category: 'photography', name: 'Candid Photography', allocatedAmount: 162000, spentAmount: 50000 },
    { id: '5', category: 'attire', name: 'Wedding Outfits', allocatedAmount: 144000, spentAmount: 20000 },
    { id: '6', category: 'entertainment', name: 'DJ & Sound', allocatedAmount: 108000, spentAmount: 0 },
    { id: '7', category: 'miscellaneous', name: 'Contingency', allocatedAmount: 180000, spentAmount: 0 },
  ];

  it('roundCurrency rounds to exact integers and handles non-finite values', () => {
    expect(roundCurrency(1234.56)).toBe(1235);
    expect(roundCurrency(1234.4)).toBe(1234);
    expect(roundCurrency(NaN)).toBe(0);
    expect(roundCurrency(Infinity)).toBe(0);
  });

  it('calculates category totals accurately', () => {
    const total = 1800000;
    const summaries = calculateCategoryTotals(sampleItems, total);

    expect(summaries.length).toBe(7);
    const venue = summaries.find((s) => s.category === 'venue');
    expect(venue).toBeDefined();
    expect(venue?.allocated).toBe(450000);
    expect(venue?.spent).toBe(225000);
    expect(venue?.percentageOfTotal).toBe(25.0);
    expect(venue?.percentageSpent).toBe(50.0);
  });

  it('calculates full budget totals, reserve, and per-guest cost', () => {
    const totalBudget = 1800000;
    const guestCount = 220;
    const reservePct = 5;

    const totals = calculateBudgetTotals(totalBudget, sampleItems, guestCount, reservePct);

    expect(totals.totalBudget).toBe(1800000);
    expect(totals.totalAllocated).toBe(1800000);
    expect(totals.totalSpent).toBe(395000);
    expect(totals.unallocated).toBe(0);
    expect(totals.reservePercentage).toBe(5);
    expect(totals.reserveAmount).toBe(90000); // 5% of 18,00,000
    expect(totals.effectiveAvailable).toBe(1800000 - 395000 - 90000);
    expect(totals.costPerGuest).toBe(Math.round(1800000 / 220)); // 8182
  });

  it('handles edge case of 0 guests or 0 budget gracefully', () => {
    const totals = calculateBudgetTotals(0, [], 0, 5);
    expect(totals.totalBudget).toBe(0);
    expect(totals.totalAllocated).toBe(0);
    expect(totals.costPerGuest).toBe(0);
    expect(totals.reserveAmount).toBe(0);
  });

  it('rebalances budget when cutting 10% and keeping photographer locked', () => {
    // Current total is 18,00,000. 10% cut -> 16,20,000.
    const newTarget = 1620000;
    const rebalanced = rebalanceBudget(sampleItems, newTarget, ['photography']);

    const photogItem = rebalanced.find((i) => i.category === 'photography');
    expect(photogItem?.allocatedAmount).toBe(162000); // Unchanged!

    // Exact summation check: all items must sum to exactly newTarget
    const sum = rebalanced.reduce((acc, curr) => acc + curr.allocatedAmount, 0);
    expect(sum).toBe(newTarget);
  });

  it('rebalances properly when locked categories exceed or equal target budget', () => {
    const rebalanced = rebalanceBudget(sampleItems, 100000, ['venue']);
    // Venue is 450,000 which exceeds 100,000. Unlocked should be zeroed.
    const venue = rebalanced.find((i) => i.category === 'venue');
    const decor = rebalanced.find((i) => i.category === 'decor');
    expect(venue?.allocatedAmount).toBe(450000);
    expect(decor?.allocatedAmount).toBe(0);
  });

  it('returns empty array when rebalancing empty item list', () => {
    expect(rebalanceBudget([], 100000)).toEqual([]);
  });

  it('applies percentage adjustment cleanly', () => {
    const { items, difference } = applyPercentageAdjustment(sampleItems, -10, ['photography']);
    const photog = items.find((i) => i.category === 'photography');
    expect(photog?.allocatedAmount).toBe(162000);

    const venue = items.find((i) => i.category === 'venue');
    expect(venue?.allocatedAmount).toBe(405000); // 450000 - 10%
    expect(difference).toBeLessThan(0);
  });
});
