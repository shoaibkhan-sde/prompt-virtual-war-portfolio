import { BudgetPlan, BudgetTier, CategoryBudgetLine, EventDefinition, VenueType } from './types';
import {
  CONTINGENCY_BASE_PERCENT,
  CONTINGENCY_OUTDOOR_SURCHARGE,
  PRIORITY_MULTIPLIER,
} from './constants';
import { getEventDefinition } from './registry';

interface RawQuota {
  category: EventDefinition['categories'][0];
  effectiveWeight: number;
  exactShare: number;
  floorShare: number;
  remainder: number;
  isPriority: boolean;
}

/**
 * Calculates a mathematically exact budget allocation across event categories
 * using the Hare-Niemeyer (Largest-Remainder) integer distribution method.
 *
 * Guarantees:
 * - Exact mathematical integrity: Sum of all category allocations + contingency === totalBudget.
 * - Dynamic tier adjustments (lean, standard, premium) and outdoor weather contingency surcharges.
 * - Prioritized category weight boosting via the priority multiplier.
 *
 * @param totalBudget - Total available budget in integer currency units (e.g. INR rupees).
 * @param eventDef - Canonical event archetype definition containing categories and base weights.
 * @param tier - Budget tier ('lean', 'standard', 'premium').
 * @param priorities - Category IDs selected as user priorities.
 * @param venueType - Venue classification ('indoor', 'outdoor', 'online').
 * @returns A complete `BudgetPlan` with integer allocations, percentages, and protected contingency.
 */
export function calculateBudgetSplit(
  totalBudget: number,
  eventDef: EventDefinition,
  tier: BudgetTier,
  priorities: string[],
  venueType: VenueType = 'indoor'
): BudgetPlan {
  // 1. Contingency calculation
  const contingencyPercent =
    CONTINGENCY_BASE_PERCENT + (venueType === 'outdoor' ? CONTINGENCY_OUTDOOR_SURCHARGE : 0);
  const contingencyAmount = Math.round((totalBudget * contingencyPercent) / 100);
  const distributable = totalBudget - contingencyAmount;

  // 2. Compute effective weights per category
  const prioritySet = new Set(priorities);
  const quotas: RawQuota[] = eventDef.categories.map((c) => {
    let tierMod = 1.0;
    if (tier === 'lean') tierMod = c.leanModifier ?? 0.85;
    else if (tier === 'premium') tierMod = c.premiumModifier ?? 1.2;

    const isPriority = prioritySet.has(c.id);
    const prioMod = isPriority ? PRIORITY_MULTIPLIER : 1.0;
    const effectiveWeight = c.baseWeight * tierMod * prioMod;

    return {
      category: c,
      effectiveWeight,
      exactShare: 0,
      floorShare: 0,
      remainder: 0,
      isPriority,
    };
  });

  const totalEffectiveWeight = quotas.reduce((acc, q) => acc + q.effectiveWeight, 0);

  // 3. Largest-remainder method for exact integer distribution
  let allocatedSum = 0;
  for (const q of quotas) {
    const exact = (q.effectiveWeight / totalEffectiveWeight) * distributable;
    q.exactShare = exact;
    q.floorShare = Math.floor(exact);
    q.remainder = exact - q.floorShare;
    allocatedSum += q.floorShare;
  }

  const deficit = distributable - allocatedSum;
  // Sort indices descending by remainder
  const sortedByRemainder = quotas
    .map((q, idx) => ({ idx, remainder: q.remainder }))
    .sort((a, b) => b.remainder - a.remainder);

  for (let i = 0; i < deficit; i++) {
    const targetIdx = sortedByRemainder[i % sortedByRemainder.length].idx;
    quotas[targetIdx].floorShare += 1;
  }

  // 4. Construct category budget lines
  const categories: CategoryBudgetLine[] = quotas.map((q) => {
    const allocated = q.floorShare;
    const sharePercent = totalBudget > 0 ? (allocated / totalBudget) * 100 : 0;
    return {
      categoryId: q.category.id,
      categoryName: q.category.name,
      allocatedAmount: allocated,
      actualSpent: 0,
      sharePercent: Number(sharePercent.toFixed(1)),
      isPriority: q.isPriority,
      varianceStatus: 'On Track',
    };
  });

  // 5. Tier comparisons
  const tierComparison: BudgetPlan['tierComparison'] = {};
  if (tier === 'standard') {
    tierComparison.leanDiffSummary = 'Shifts focus towards core essentials; trims decor and live production.';
    tierComparison.premiumDiffSummary = 'Boosts high-touch hospitality, immersive decor, and celebrity elements.';
  } else if (tier === 'lean') {
    tierComparison.premiumDiffSummary = 'Moving up to Standard or Premium unlocks professional live talent and higher catering tiers.';
  } else if (tier === 'premium') {
    tierComparison.leanDiffSummary = 'Stepping down to Standard or Lean trims bespoke production by 15-30% while safeguarding key moments.';
  }

  return {
    totalBudget,
    contingencyPercent,
    contingencyAmount,
    distributableBudget: distributable,
    categories,
    tierComparison,
  };
}

export function computeLiveBudgetPreview(
  totalBudget: number,
  eventTypeId: string,
  tier: BudgetTier,
  priorities: string[],
  venueType: VenueType = 'indoor'
): BudgetPlan | null {
  const def = getEventDefinition(eventTypeId);
  if (!def || !totalBudget || totalBudget <= 0) return null;
  return calculateBudgetSplit(totalBudget, def, tier, priorities, venueType);
}

export function updateSpendingLine(line: CategoryBudgetLine, actualSpent: number): CategoryBudgetLine {
  const diff = actualSpent - line.allocatedAmount;
  let status = 'On Track';
  if (actualSpent === 0) {
    status = 'Unspent';
  } else if (diff > 0) {
    status = `Over by ₹${diff.toLocaleString('en-IN')}`;
  } else if (diff < 0) {
    status = `₹${Math.abs(diff).toLocaleString('en-IN')} left`;
  } else {
    status = 'Budget Exhausted (Exact)';
  }

  return {
    ...line,
    actualSpent,
    varianceStatus: status,
  };
}
