import { describe, it, expect } from 'vitest';
import {
  createScenarioSimulation,
  simulateBudgetCut,
  simulateGuestCountChange,
  applyScenarioToPlan,
} from '@/domain/scenarios';
import { BudgetItem, CelebrationPlan } from '@/domain/types';

describe('domain/scenarios', () => {
  const sampleItems: BudgetItem[] = [
    { id: '1', category: 'venue', name: 'Venue', allocatedAmount: 400000, spentAmount: 100000 },
    { id: '2', category: 'catering', name: 'Catering', allocatedAmount: 500000, spentAmount: 50000 },
    { id: '3', category: 'photography', name: 'Photo', allocatedAmount: 100000, spentAmount: 20000 },
  ];

  it('creates scenario simulation with exact differences', () => {
    const scenario = createScenarioSimulation(
      'sc-1',
      'Reduce by 100k',
      'Trim unlocked categories',
      sampleItems,
      900000,
      ['photography']
    );

    expect(scenario.oldTotalBudget).toBe(1000000);
    expect(scenario.newTotalBudget).toBe(900000);
    expect(scenario.totalDifference).toBe(-100000);

    const photogAdj = scenario.adjustments.find((a) => a.categoryId === 'photography');
    expect(photogAdj?.newAmount).toBe(100000); // Locked, unchanged!
    expect(photogAdj?.difference).toBe(0);
  });

  it('simulates 10% budget cut while locking categories', () => {
    const cut = simulateBudgetCut(sampleItems, 10, ['venue']);
    expect(cut.newTotalBudget).toBe(900000);
    expect(cut.totalDifference).toBe(-100000);

    const venueAdj = cut.adjustments.find((a) => a.categoryId === 'venue');
    expect(venueAdj?.newAmount).toBe(400000);
  });

  it('simulates guest count scaling on variable categories', () => {
    const sim = simulateGuestCountChange(sampleItems, 100, 150, ['photography']);
    // Catering is variable (500,000 * 1.5 = 750,000)
    // Venue (400,000) and Photo (100,000) are fixed
    // New total should be 12,50,000
    expect(sim.newTotalBudget).toBe(1250000);
  });

  it('applies scenario simulation cleanly to a celebration plan', () => {
    const plan: CelebrationPlan = {
      id: 'p-1',
      eventType: 'wedding',
      title: 'Test Wedding',
      date: '2027-01-01',
      location: 'Pune',
      totalBudget: 1000000,
      reservePercentage: 5,
      items: sampleItems,
      timeline: [],
      vendors: [],
      guests: [],
      savedIdeaIds: [],
    };

    const cut = simulateBudgetCut(sampleItems, 10, ['photography']);
    const updatedPlan = applyScenarioToPlan(plan, cut);

    expect(updatedPlan.totalBudget).toBe(900000);
    const sum = updatedPlan.items.reduce((acc, i) => acc + i.allocatedAmount, 0);
    expect(sum).toBe(900000);
  });
});
