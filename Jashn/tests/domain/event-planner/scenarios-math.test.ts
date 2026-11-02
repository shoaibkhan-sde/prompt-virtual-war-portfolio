import { describe, it, expect } from 'vitest';
import {
  simulatePlanBudgetCut,
  simulatePlanGuestChange,
  applySimulationToPlan,
} from '@/domain/event-planner/scenarios-math';
import { BudgetPlan, GeneratedEventPlan } from '@/domain/event-planner/types';

describe('domain/event-planner/scenarios-math', () => {
  const sampleBudget: BudgetPlan = {
    totalBudget: 1000000,
    contingencyPercent: 10,
    contingencyAmount: 100000,
    distributableBudget: 900000,
    categories: [
      { categoryId: 'venue', categoryName: 'Venue & Lawns', allocatedAmount: 400000, actualSpent: 100000, sharePercent: 40, isPriority: true, varianceStatus: '₹3,00,000 left' },
      { categoryId: 'catering', categoryName: 'Catering & Food', allocatedAmount: 300000, actualSpent: 50000, sharePercent: 30, isPriority: false, varianceStatus: '₹2,50,000 left' },
      { categoryId: 'photography', categoryName: 'Photography', allocatedAmount: 200000, actualSpent: 0, sharePercent: 20, isPriority: false, varianceStatus: '₹2,00,000 left' },
    ],
  };

  it('simulates 10% budget cut while locking categories', () => {
    const sim = simulatePlanBudgetCut(sampleBudget, 10, ['photography']);

    expect(sim.originalTotalBudget).toBe(1000000);
    expect(sim.simulatedTotalBudget).toBe(900000);
    expect(sim.totalDifference).toBe(-100000);
    expect(sim.simulatedContingency).toBe(90000);

    const photoAdj = sim.categoryAdjustments.find((a) => a.categoryId === 'photography');
    expect(photoAdj?.simulatedAllocated).toBe(200000); // Locked, unchanged
    expect(photoAdj?.difference).toBe(0);
    expect(photoAdj?.isLocked).toBe(true);

    const sumCategories = sim.categoryAdjustments.reduce((sum, a) => sum + a.simulatedAllocated, 0);
    expect(sumCategories + sim.simulatedContingency).toBe(sim.simulatedTotalBudget);
  });

  it('simulates guest count scaling on variable categories', () => {
    const sim = simulatePlanGuestChange(sampleBudget, 100, 50, ['venue']); // +50 guests (150 total, ratio 1.5)

    const catAdj = sim.categoryAdjustments.find((a) => a.categoryId === 'catering');
    expect(catAdj?.simulatedAllocated).toBe(450000); // 300000 * 1.5

    const venueAdj = sim.categoryAdjustments.find((a) => a.categoryId === 'venue');
    expect(venueAdj?.simulatedAllocated).toBe(400000); // Venue is fixed/locked
  });

  it('applies simulation cleanly to GeneratedEventPlan', () => {
    const samplePlan: GeneratedEventPlan = {
      id: 'test-plan',
      createdAt: '2026-10-26T00:00:00Z',
      input: {
        eventType: 'wedding',
        eventName: 'Test Wedding',
        eventDate: '2027-01-01',
        guestCount: 200,
        currency: 'INR',
        totalBudget: 1000000,
        budgetTier: 'standard',
        priorities: [],
        interests: [],
        venueType: 'indoor',
        dietaryRequirement: 'none',
        alcoholServed: false,
        secondaryGuestCount: 0,
      },
      budget: sampleBudget,
      timeline: { isCompressed: false, tasks: [], totalTasks: 0, completedTasks: 0, overdueTasks: 0 },
      vendors: { vendors: [], totalVendors: 0, bookedVendors: 0 },
      ideas: [],
      updatedAt: '2026-10-26T00:00:00Z',
      readiness: { score: 75, level: 'Well Prepared', breakdown: { taskScore: 25, vendorScore: 25, budgetScore: 25 }, plainLanguageReason: 'All on track' },
    };

    const sim = simulatePlanBudgetCut(sampleBudget, 10, []);
    const updated = applySimulationToPlan(samplePlan, sim);

    expect(updated.budget.totalBudget).toBe(900000);
    expect(updated.budget.contingencyAmount).toBe(90000);
  });
});
