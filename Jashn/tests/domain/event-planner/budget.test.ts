import { describe, it, expect } from 'vitest';
import { calculateBudgetSplit, computeLiveBudgetPreview } from '@/domain/event-planner/budget-math';
import { getAllEventDefinitions, getEventDefinition } from '@/domain/event-planner/registry';
import { BudgetTier, VenueType } from '@/domain/event-planner/types';

describe('domain/event-planner/budget-math', () => {
  const allDefinitions = getAllEventDefinitions();
  const tiers: BudgetTier[] = ['lean', 'standard', 'premium'];
  const venueTypes: VenueType[] = ['indoor', 'outdoor', 'hybrid', 'online'];

  it('largest-remainder invariant: contingency + sum(categories) strictly equals totalBudget for all event types and tiers', () => {
    for (const def of allDefinitions) {
      for (const tier of tiers) {
        for (const venue of venueTypes) {
          const testBudgets = [
            def.minBudget,
            def.minBudget + 1,
            def.minBudget + 33333,
            Math.round((def.minBudget + def.maxBudget) / 2),
            999999,
            1234567,
            5000000,
          ].filter((b) => b <= def.maxBudget);

          for (const total of testBudgets) {
            const plan = calculateBudgetSplit(total, def, tier, [], venue);
            const catSum = plan.categories.reduce((acc, c) => acc + c.allocatedAmount, 0);
            const totalSum = plan.contingencyAmount + catSum;

            expect(totalSum).toBe(total);
            expect(plan.distributableBudget).toBe(catSum);

            // Ensure every allocation is an integer
            for (const cat of plan.categories) {
              expect(Number.isInteger(cat.allocatedAmount)).toBe(true);
            }
          }
        }
      }
    }
  });

  it('property-style randomized test across 100 pseudorandom inputs guarantees zero penny discrepancy', () => {
    const weddingDef = getEventDefinition('wedding')!;
    const rng = (seed: number) => {
      let s = seed;
      return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
      };
    };
    const random = rng(42);

    for (let i = 0; i < 100; i++) {
      const budget = Math.floor(random() * (10000000 - 250000)) + 250000;
      const tier = tiers[Math.floor(random() * tiers.length)];
      const venue = venueTypes[Math.floor(random() * venueTypes.length)];
      const availableCategories = weddingDef.categories.map((c) => c.id);
      const prioCount = Math.floor(random() * 4); // 0 to 3
      const priorities = availableCategories.slice(0, prioCount);

      const plan = calculateBudgetSplit(budget, weddingDef, tier, priorities, venue);
      const catSum = plan.categories.reduce((acc, c) => acc + c.allocatedAmount, 0);

      expect(plan.contingencyAmount + catSum).toBe(budget);
    }
  });

  it('applies priority multiplier to selected categories', () => {
    const def = getEventDefinition('wedding')!;
    const unprioritized = calculateBudgetSplit(1000000, def, 'standard', []);
    const prioritized = calculateBudgetSplit(1000000, def, 'standard', ['floral_ambience']);

    const baselineFloral = unprioritized.categories.find((c) => c.categoryId === 'floral_ambience')!;
    const boostedFloral = prioritized.categories.find((c) => c.categoryId === 'floral_ambience')!;

    expect(boostedFloral.allocatedAmount).toBeGreaterThan(baselineFloral.allocatedAmount);
    expect(boostedFloral.isPriority).toBe(true);
  });

  it('reserves 12% contingency for outdoor venues vs 8% for indoor', () => {
    const def = getEventDefinition('wedding')!;
    const indoorPlan = calculateBudgetSplit(1000000, def, 'standard', [], 'indoor');
    const outdoorPlan = calculateBudgetSplit(1000000, def, 'standard', [], 'outdoor');

    expect(indoorPlan.contingencyPercent).toBe(8);
    expect(indoorPlan.contingencyAmount).toBe(80000);

    expect(outdoorPlan.contingencyPercent).toBe(12);
    expect(outdoorPlan.contingencyAmount).toBe(120000);
  });

  it('computeLiveBudgetPreview returns null for invalid or zero inputs', () => {
    expect(computeLiveBudgetPreview(0, 'wedding', 'standard', [])).toBeNull();
    expect(computeLiveBudgetPreview(1000000, 'nonexistent_event', 'standard', [])).toBeNull();
  });
});
