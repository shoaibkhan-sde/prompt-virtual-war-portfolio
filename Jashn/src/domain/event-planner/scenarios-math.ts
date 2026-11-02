/**
 * Pure deterministic simulation math for GeneratedEventPlan.
 * Supports category locking, budget trimming, and headcount scaling
 * with largest-remainder exact integer allocation guarantees.
 */

import { BudgetPlan, GeneratedEventPlan } from './types';

export interface EventPlanSimulation {
  id: string;
  name: string;
  description: string;
  originalTotalBudget: number;
  simulatedTotalBudget: number;
  totalDifference: number;
  originalContingency: number;
  simulatedContingency: number;
  categoryAdjustments: {
    categoryId: string;
    categoryName: string;
    originalAllocated: number;
    simulatedAllocated: number;
    difference: number;
    isLocked: boolean;
  }[];
}

/**
 * Simulates a proportional percentage budget cut while strictly preserving locked categories.
 * Uses the Hare-Niemeyer largest-remainder method across unlocked categories to guarantee
 * that allocations remain exact integers and sum precisely to the target distributable budget.
 *
 * @param budget - Current active budget plan.
 * @param percentCut - Requested percentage budget cut (clamped between 1% and 50%).
 * @param lockedCategoryIds - Array of category IDs exempt from reduction.
 * @returns An `EventPlanSimulation` object comparing baseline vs simulated state.
 */
export function simulatePlanBudgetCut(
  budget: BudgetPlan,
  percentCut: number,
  lockedCategoryIds: string[]
): EventPlanSimulation {
  const safePercent = Math.min(Math.max(percentCut, 1), 50);
  const originalTotal = budget.totalBudget;
  const simulatedTotal = Math.round(originalTotal * (1 - safePercent / 100));
  const totalDiff = simulatedTotal - originalTotal;

  // Contingency scales proportionally with total budget
  const contingencyRatio = originalTotal > 0 ? budget.contingencyAmount / originalTotal : 0.1;
  const simulatedContingency = Math.round(simulatedTotal * contingencyRatio);
  const targetDistributable = simulatedTotal - simulatedContingency;

  const lockedSet = new Set(lockedCategoryIds);
  let lockedSum = 0;
  let unlockedOriginalSum = 0;

  for (const cat of budget.categories) {
    if (lockedSet.has(cat.categoryId)) {
      lockedSum += cat.allocatedAmount;
    } else {
      unlockedOriginalSum += cat.allocatedAmount;
    }
  }

  // Calculate available distributable for unlocked categories
  const availableForUnlocked = Math.max(0, targetDistributable - lockedSum);

  // Compute allocations using largest-remainder integer distribution
  interface CategoryDraft {
    categoryId: string;
    categoryName: string;
    originalAllocated: number;
    simulatedAllocated: number;
    isLocked: boolean;
    exactShare: number;
    remainder: number;
  }

  const drafts: CategoryDraft[] = budget.categories.map((c) => {
    const isLocked = lockedSet.has(c.categoryId);
    if (isLocked) {
      return {
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        originalAllocated: c.allocatedAmount,
        simulatedAllocated: c.allocatedAmount,
        isLocked: true,
        exactShare: c.allocatedAmount,
        remainder: 0,
      };
    }

    const weight = unlockedOriginalSum > 0 ? c.allocatedAmount / unlockedOriginalSum : 1 / budget.categories.length;
    const exact = weight * availableForUnlocked;
    const floor = Math.floor(exact);

    return {
      categoryId: c.categoryId,
      categoryName: c.categoryName,
      originalAllocated: c.allocatedAmount,
      simulatedAllocated: floor,
      isLocked: false,
      exactShare: exact,
      remainder: exact - floor,
    };
  });

  // Distribute integer remainder across unlocked categories with highest fractional remainder
  const currentSum = drafts.reduce((sum, d) => sum + d.simulatedAllocated, 0);
  const discrepancy = targetDistributable - currentSum;

  if (discrepancy > 0) {
    const unlockedDrafts = drafts.filter((d) => !d.isLocked);
    unlockedDrafts.sort((a, b) => b.remainder - a.remainder);
    for (let i = 0; i < discrepancy && i < unlockedDrafts.length; i++) {
      unlockedDrafts[i].simulatedAllocated += 1;
    }
  }

  const categoryAdjustments = drafts.map((d) => ({
    categoryId: d.categoryId,
    categoryName: d.categoryName,
    originalAllocated: d.originalAllocated,
    simulatedAllocated: d.simulatedAllocated,
    difference: d.simulatedAllocated - d.originalAllocated,
    isLocked: d.isLocked,
  }));

  return {
    id: `sim_cut_${safePercent}`,
    name: `${safePercent}% Budget Trim`,
    description: `Reduces total expenditure by ${safePercent}% while keeping locked categories protected.`,
    originalTotalBudget: originalTotal,
    simulatedTotalBudget: simulatedTotal,
    totalDifference: totalDiff,
    originalContingency: budget.contingencyAmount,
    simulatedContingency,
    categoryAdjustments,
  };
}

/**
 * Simulates scaling guest-sensitive variable categories (catering, hospitality, favors, invites)
 * when attendance expands or contracts, while keeping fixed overheads and locked categories constant.
 *
 * @param budget - Current active budget plan.
 * @param currentGuests - Baseline guest count.
 * @param guestDelta - Headcount difference (+N or -N).
 * @param lockedCategoryIds - Array of category IDs exempt from scaling.
 * @returns An `EventPlanSimulation` object with modified per-head budget projections.
 */
export function simulatePlanGuestChange(
  budget: BudgetPlan,
  currentGuests: number,
  guestDelta: number,
  lockedCategoryIds: string[]
): EventPlanSimulation {
  const safeCurrentGuests = Math.max(1, currentGuests);
  const targetGuests = Math.max(10, safeCurrentGuests + guestDelta);
  const ratio = targetGuests / safeCurrentGuests;

  const lockedSet = new Set(lockedCategoryIds);
  const isVariableCategory = (id: string, name: string) => {
    const lower = `${id} ${name}`.toLowerCase();
    return (
      lower.includes('catering') ||
      lower.includes('food') ||
      lower.includes('hospitality') ||
      lower.includes('gift') ||
      lower.includes('invite') ||
      lower.includes('snack') ||
      lower.includes('beverage') ||
      lower.includes('cake')
    );
  };

  let simulatedCategoriesSum = 0;
  const categoryAdjustments = budget.categories.map((c) => {
    const isLocked = lockedSet.has(c.categoryId);
    let newAmount = c.allocatedAmount;

    if (!isLocked && isVariableCategory(c.categoryId, c.categoryName)) {
      newAmount = Math.round(c.allocatedAmount * ratio);
    }

    simulatedCategoriesSum += newAmount;

    return {
      categoryId: c.categoryId,
      categoryName: c.categoryName,
      originalAllocated: c.allocatedAmount,
      simulatedAllocated: newAmount,
      difference: newAmount - c.allocatedAmount,
      isLocked,
    };
  });

  // Calculate revised contingency based on original percentage
  const contingencyRatio = budget.totalBudget > 0 ? budget.contingencyAmount / budget.totalBudget : 0.1;
  const simulatedTotal = Math.round(simulatedCategoriesSum / (1 - contingencyRatio));
  const simulatedContingency = simulatedTotal - simulatedCategoriesSum;

  const deltaSign = guestDelta >= 0 ? `+${guestDelta}` : `${guestDelta}`;

  return {
    id: `sim_guests_${guestDelta}`,
    name: `${deltaSign} Guests (${targetGuests} Total)`,
    description: `Scales catering, hospitality, and guest favors for ${targetGuests} attendees.`,
    originalTotalBudget: budget.totalBudget,
    simulatedTotalBudget: simulatedTotal,
    totalDifference: simulatedTotal - budget.totalBudget,
    originalContingency: budget.contingencyAmount,
    simulatedContingency,
    categoryAdjustments,
  };
}

/**
 * Applies a simulation cleanly to a GeneratedEventPlan, updating the budget, category allocations,
 * and recalculating variance status strings.
 *
 * @param plan - The original generated plan to mutate.
 * @param simulation - The accepted simulation delta.
 * @returns A fresh `GeneratedEventPlan` reflecting simulated amounts and updated timestamp.
 */
export function applySimulationToPlan(
  plan: GeneratedEventPlan,
  simulation: EventPlanSimulation
): GeneratedEventPlan {
  const updatedCategories = plan.budget.categories.map((cat) => {
    const adj = simulation.categoryAdjustments.find((a) => a.categoryId === cat.categoryId);
    const newAllocated = adj ? adj.simulatedAllocated : cat.allocatedAmount;
    const spent = cat.actualSpent || 0;
    const diff = newAllocated - spent;
    const varianceStatus = diff >= 0 ? `₹${diff.toLocaleString('en-IN')} left` : `₹${Math.abs(diff).toLocaleString('en-IN')} over`;

    return {
      ...cat,
      allocatedAmount: newAllocated,
      varianceStatus,
    };
  });

  return {
    ...plan,
    budget: {
      ...plan.budget,
      totalBudget: simulation.simulatedTotalBudget,
      contingencyAmount: simulation.simulatedContingency,
      distributableBudget: simulation.simulatedTotalBudget - simulation.simulatedContingency,
      categories: updatedCategories,
    },
    updatedAt: new Date().toISOString(),
  };
}
