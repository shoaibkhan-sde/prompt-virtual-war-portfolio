import { BudgetPlan, ReadinessScore, TimelinePlan, VendorPlan } from './types';

/**
 * Computes a weighted overall celebration readiness health score (0 to 100).
 *
 * Scoring Formula:
 * - Milestone Tasks (Max 45 points): Critical path tasks carry 3x weight; points earned for completion.
 * - Vendor Lock-in (Max 35 points): Essential vendors carry 3x weight; points awarded for contract progress.
 * - Budget Health (Max 20 points): Full 20 points when within budget; proportional penalty for overspending.
 *
 * @param timeline - Current event timeline containing milestone tasks and status.
 * @param vendors - Current vendor checklist with booking progress.
 * @param budget - Budget plan with total and actual spent amounts.
 * @returns A composite `ReadinessScore` containing numerical score, qualitative level, breakdown, and warnings.
 */
export function computeReadinessScore(
  timeline: TimelinePlan,
  vendors: VendorPlan,
  budget: BudgetPlan
): ReadinessScore {
  // 1. Task Score (Max 45 points)
  // Higher weight for critical path and overdue tasks
  let taskTotalWeight = 0;
  let taskEarnedWeight = 0;

  for (const t of timeline.tasks) {
    const weight = t.isCriticalPath ? 3 : 1;
    taskTotalWeight += weight;
    if (t.isCompleted) {
      taskEarnedWeight += weight;
    }
  }

  const taskScore =
    taskTotalWeight > 0 ? Math.round((taskEarnedWeight / taskTotalWeight) * 45) : 45;

  // 2. Vendor Score (Max 35 points)
  // Essential vendors carry triple weight
  let vendorTotalWeight = 0;
  let vendorEarnedWeight = 0;

  for (const v of vendors.vendors) {
    const weight = v.isEssential ? 3 : 1;
    vendorTotalWeight += weight;
    // Partial points for steps completed, full points if booked
    if (v.isBooked) {
      vendorEarnedWeight += weight;
    } else if (v.totalSteps > 0 && v.completedSteps > 0) {
      vendorEarnedWeight += weight * (v.completedSteps / v.totalSteps) * 0.5;
    }
  }

  const vendorScore =
    vendorTotalWeight > 0 ? Math.round((vendorEarnedWeight / vendorTotalWeight) * 35) : 35;

  // 3. Budget Variance Score (Max 20 points)
  const totalActual = budget.categories.reduce((acc, c) => acc + c.actualSpent, 0);
  let budgetScore = 20;

  if (totalActual > budget.totalBudget) {
    const overspendRatio = (totalActual - budget.totalBudget) / budget.totalBudget;
    // Deduct points as overspend increases
    const penalty = Math.min(20, Math.round(overspendRatio * 50));
    budgetScore = Math.max(0, 20 - penalty);
  }

  const totalScore = Math.min(100, Math.max(0, taskScore + vendorScore + budgetScore));

  // Determine qualitative readiness tier
  let level: ReadinessScore['level'] = 'Initial Planning';
  if (totalScore >= 80) level = 'Ready to Celebrate';
  else if (totalScore >= 55) level = 'Well Prepared';
  else if (totalScore >= 25) level = 'Gaining Momentum';

  // Construct descriptive plain-language explanation
  const reasons: string[] = [];
  if (timeline.completedTasks === timeline.totalTasks && timeline.totalTasks > 0) {
    reasons.push('All milestone deadlines are checked off');
  } else {
    reasons.push(`${timeline.completedTasks} of ${timeline.totalTasks} milestones completed`);
  }

  if (vendors.bookedVendors === vendors.totalVendors && vendors.totalVendors > 0) {
    reasons.push('all vendor partners confirmed');
  } else {
    reasons.push(`${vendors.bookedVendors} of ${vendors.totalVendors} vendors locked`);
  }

  if (timeline.overdueTasks > 0) {
    reasons.push(`${timeline.overdueTasks} deadline${timeline.overdueTasks === 1 ? '' : 's'} overdue`);
  }

  if (totalActual > budget.totalBudget) {
    const overAmt = totalActual - budget.totalBudget;
    reasons.push(`spending exceeds initial plan by ₹${overAmt.toLocaleString('en-IN')}`);
  } else if (totalActual > 0) {
    reasons.push('expenses securely tracked within target envelope');
  }

  const plainLanguageReason = `${reasons.join(', ')}.`;

  return {
    score: totalScore,
    level,
    breakdown: {
      taskScore,
      vendorScore,
      budgetScore,
    },
    plainLanguageReason: plainLanguageReason.charAt(0).toUpperCase() + plainLanguageReason.slice(1),
  };
}
