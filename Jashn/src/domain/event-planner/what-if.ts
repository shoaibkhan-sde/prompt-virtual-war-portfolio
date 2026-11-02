import { GeneratedEventPlan, WhatIfDiff } from './types';
import { calculateBudgetSplit } from './budget-math';
import { getEventDefinition } from './registry';

/**
 * Simulates a hypothetical what-if scenario adjusting both guest count and total budget.
 * Recalculates category allocations and produces comparative deltas and plain-English notes.
 *
 * @param currentPlan - Active generated celebration plan.
 * @param newGuestCount - Proposed guest count.
 * @param newTotalBudget - Proposed new total budget.
 * @returns A `WhatIfDiff` object containing before/after comparisons, or `null` if event type is unknown.
 */
export function simulateWhatIf(
  currentPlan: GeneratedEventPlan,
  newGuestCount: number,
  newTotalBudget: number
): WhatIfDiff | null {
  const def = getEventDefinition(currentPlan.input.eventType);
  if (!def) return null;

  // 1. Recalculate budget with newTotalBudget
  const newBudget = calculateBudgetSplit(
    newTotalBudget,
    def,
    currentPlan.input.budgetTier,
    currentPlan.input.priorities,
    currentPlan.input.venueType
  );

  const budgetDeltas = newBudget.categories.map((newCat) => {
    const oldCat = currentPlan.budget.categories.find((c) => c.categoryId === newCat.categoryId);
    const oldAmount = oldCat ? oldCat.allocatedAmount : 0;
    const delta = newCat.allocatedAmount - oldAmount;
    return {
      categoryId: newCat.categoryId,
      categoryName: newCat.categoryName,
      oldAmount,
      newAmount: newCat.allocatedAmount,
      delta,
    };
  });

  const guestDiff = newGuestCount - currentPlan.input.guestCount;
  const budgetDiff = newTotalBudget - currentPlan.input.totalBudget;

  const notes: string[] = [];
  if (guestDiff !== 0) {
    notes.push(
      guestDiff > 0
        ? `Guest count increases by +${guestDiff} (per-head food & seat costs will scale up).`
        : `Guest count reduced by ${Math.abs(guestDiff)} (lowers banquet foot-print).`
    );
  }

  if (budgetDiff !== 0) {
    notes.push(
      budgetDiff > 0
        ? `Budget increases by ₹${budgetDiff.toLocaleString('en-IN')}; expands contingency by ₹${(newBudget.contingencyAmount - currentPlan.budget.contingencyAmount).toLocaleString('en-IN')}.`
        : `Budget tightens by ₹${Math.abs(budgetDiff).toLocaleString('en-IN')}; trims category allocations across all tiers.`
    );
  }

  return {
    originalGuestCount: currentPlan.input.guestCount,
    proposedGuestCount: newGuestCount,
    originalBudget: currentPlan.input.totalBudget,
    proposedBudget: newTotalBudget,
    budgetDeltas,
    newContingency: newBudget.contingencyAmount,
    explanatoryNotes: notes,
  };
}
