/**
 * Pure domain logic for Budget calculations and rebalancing.
 * Strictly zero I/O, no UI/AI imports. Pure deterministic math.
 */

import { BudgetItem, BudgetTotals, CategorySummary, ExpenseCategory } from './types';

export const ALL_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'venue',
  'catering',
  'decor',
  'photography',
  'attire',
  'entertainment',
  'invitations',
  'gifts',
  'miscellaneous',
];

/**
 * Rounds a currency value to the nearest integer, handling non-finite numbers safely.
 *
 * @param amount - Raw numeric amount.
 * @returns Integer rounded currency value.
 */
export function roundCurrency(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount);
}

/**
 * Computes aggregated allocated and spent amounts per expense category.
 *
 * @param items - List of budget items.
 * @param totalBudget - Overall total budget.
 * @returns Array of `CategorySummary` objects with percentages of total and percentages spent.
 */
export function calculateCategoryTotals(
  items: BudgetItem[],
  totalBudget: number
): CategorySummary[] {
  const map = new Map<ExpenseCategory, { allocated: number; spent: number }>();

  for (const cat of ALL_EXPENSE_CATEGORIES) {
    map.set(cat, { allocated: 0, spent: 0 });
  }

  for (const item of items) {
    const current = map.get(item.category) ?? { allocated: 0, spent: 0 };
    map.set(item.category, {
      allocated: current.allocated + roundCurrency(item.allocatedAmount),
      spent: current.spent + roundCurrency(item.spentAmount),
    });
  }

  const summaries: CategorySummary[] = [];

  for (const cat of ALL_EXPENSE_CATEGORIES) {
    const data = map.get(cat)!;
    if (data.allocated > 0 || data.spent > 0) {
      const percentageOfTotal =
        totalBudget > 0 ? Number(((data.allocated / totalBudget) * 100).toFixed(1)) : 0;
      const percentageSpent =
        data.allocated > 0 ? Number(((data.spent / data.allocated) * 100).toFixed(1)) : 0;

      summaries.push({
        category: cat,
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        allocated: data.allocated,
        spent: data.spent,
        percentageOfTotal,
        percentageSpent,
      });
    }
  }

  return summaries;
}

/**
 * Aggregates budget financial metrics including total allocated, total spent,
 * unallocated buffer, locked reserve, effective available, and cost per guest.
 *
 * @param totalBudget - Overall event budget.
 * @param items - Array of individual budget items.
 * @param guestCount - Total expected guests.
 * @param reservePercentage - Contingency percentage reserve (default 5%).
 * @returns Comprehensive `BudgetTotals` summary.
 */
export function calculateBudgetTotals(
  totalBudget: number,
  items: BudgetItem[],
  guestCount: number,
  reservePercentage = 5
): BudgetTotals {
  const validTotalBudget = Math.max(0, roundCurrency(totalBudget));
  const safeReservePct = Math.max(0, Math.min(100, reservePercentage));

  let totalAllocated = 0;
  let totalSpent = 0;

  for (const item of items) {
    totalAllocated += roundCurrency(item.allocatedAmount);
    totalSpent += roundCurrency(item.spentAmount);
  }

  const reserveAmount = roundCurrency(validTotalBudget * (safeReservePct / 100));
  const unallocated = validTotalBudget - totalAllocated;
  const effectiveAvailable = validTotalBudget - totalSpent - reserveAmount;
  const costPerGuest =
    guestCount > 0 ? roundCurrency(validTotalBudget / guestCount) : 0;

  const categories = calculateCategoryTotals(items, validTotalBudget);

  return {
    totalBudget: validTotalBudget,
    totalAllocated,
    totalSpent,
    unallocated,
    reservePercentage: safeReservePct,
    reserveAmount,
    effectiveAvailable,
    costPerGuest,
    categories,
  };
}

/**
 * Rebalances category allocations to match a new total budget, preserving
 * exact integer allocations and keeping specified categories strictly locked.
 *
 * @param currentItems - Current budget line items.
 * @param newTotalBudget - New target overall budget.
 * @param lockedCategories - Categories exempt from reduction/rebalancing.
 * @returns Updated array of `BudgetItem` elements summing to the new target.
 */
export function rebalanceBudget(
  currentItems: BudgetItem[],
  newTotalBudget: number,
  lockedCategories: ExpenseCategory[] = []
): BudgetItem[] {
  const targetBudget = Math.max(0, roundCurrency(newTotalBudget));
  if (currentItems.length === 0) return [];

  const lockedSet = new Set(lockedCategories);
  let lockedSum = 0;
  let unlockedSum = 0;

  for (const item of currentItems) {
    const allocated = roundCurrency(item.allocatedAmount);
    if (lockedSet.has(item.category)) {
      lockedSum += allocated;
    } else {
      unlockedSum += allocated;
    }
  }

  if (unlockedSum === 0 || lockedSum >= targetBudget) {
    // If all locked or locked sum exceeds target, keep locked amounts and zero remaining unlocked
    return currentItems.map((item) => ({
      ...item,
      allocatedAmount: lockedSet.has(item.category)
        ? roundCurrency(item.allocatedAmount)
        : 0,
    }));
  }

  const availableForUnlocked = targetBudget - lockedSum;
  let runningSum = 0;
  const result: BudgetItem[] = [];
  const unlockedItems = currentItems.filter((i) => !lockedSet.has(i.category));

  for (let i = 0; i < currentItems.length; i++) {
    const item = currentItems[i];
    if (lockedSet.has(item.category)) {
      result.push({
        ...item,
        allocatedAmount: roundCurrency(item.allocatedAmount),
      });
    } else {
      const isLastUnlocked = item === unlockedItems[unlockedItems.length - 1];
      if (isLastUnlocked) {
        // Last unlocked takes exact remainder to ensure exact summation with zero drift
        const remainder = Math.max(0, availableForUnlocked - runningSum);
        result.push({
          ...item,
          allocatedAmount: remainder,
        });
      } else {
        const share = item.allocatedAmount / unlockedSum;
        const newAllocated = Math.max(0, roundCurrency(availableForUnlocked * share));
        runningSum += newAllocated;
        result.push({
          ...item,
          allocatedAmount: newAllocated,
        });
      }
    }
  }

  return result;
}

export function applyPercentageAdjustment(
  currentItems: BudgetItem[],
  adjustmentPercent: number, // e.g. -10 for 10% cut, +15 for 15% increase
  lockedCategories: ExpenseCategory[] = []
): { items: BudgetItem[]; difference: number } {
  const lockedSet = new Set(lockedCategories);
  let totalDiff = 0;

  const items = currentItems.map((item) => {
    if (lockedSet.has(item.category)) {
      return { ...item, allocatedAmount: roundCurrency(item.allocatedAmount) };
    }
    const current = roundCurrency(item.allocatedAmount);
    const delta = roundCurrency(current * (adjustmentPercent / 100));
    const nextAmount = Math.max(0, current + delta);
    totalDiff += nextAmount - current;
    return { ...item, allocatedAmount: nextAmount };
  });

  return { items, difference: totalDiff };
}
