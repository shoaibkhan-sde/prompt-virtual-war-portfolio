import {
  GeneratedEventPlan,
  PlanRequestRaw,
  ValidatedPlanInput,
  ValidationError,
} from './types';
import { getEventDefinition } from './registry';
import { validatePlanRequest } from './validation';
import { calculateBudgetSplit } from './budget-math';
import { computeTimelinePlan } from './timeline-math';
import { computeVendorPlan } from './vendors-math';
import { rankAndFilterIdeas } from './ideas-math';
import { computeReadinessScore } from './readiness';

/**
 * Pure deterministic factory function that compiles a full celebration plan
 * from validated user inputs and a server reference date.
 *
 * Orchestration Steps:
 * 1. Budget: Hare-Niemeyer integer allocation with contingency lock.
 * 2. Timeline: Compressed milestone scheduling with dependency mapping.
 * 3. Vendors: Scaled booking deadlines and essential vendor checklists.
 * 4. Ideas: Constraint-filtered concept ranking by theme/interest relevance.
 * 5. Readiness: Initial baseline progress evaluation.
 *
 * @param input - Fully validated and sanitized event planning parameters.
 * @param todayUtcStr - Current reference date in YYYY-MM-DD format.
 * @returns A complete `GeneratedEventPlan` ready for presentation or client caching.
 * @throws Error if the requested event archetype is unregistered.
 */
export function buildPlan(input: ValidatedPlanInput, todayUtcStr: string): GeneratedEventPlan {
  const def = getEventDefinition(input.eventType);
  if (!def) {
    throw new Error(`Cannot build plan: unregistered event type "${input.eventType}"`);
  }

  // 1. Pure deterministic math calculations
  const budget = calculateBudgetSplit(
    input.totalBudget,
    def,
    input.budgetTier,
    input.priorities,
    input.venueType
  );

  const timeline = computeTimelinePlan(input.eventDate, todayUtcStr, def, input.venueType);

  const vendors = computeVendorPlan(
    input.eventDate,
    todayUtcStr,
    def,
    budget,
    input.priorities,
    input.venueType
  );

  const ideas = rankAndFilterIdeas(
    def,
    input.guestCount,
    input.budgetTier,
    input.venueType,
    input.theme,
    input.interests
  );

  const readiness = computeReadinessScore(timeline, vendors, budget);

  const planId = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    id: planId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    input,
    budget,
    timeline,
    vendors,
    ideas,
    readiness,
  };
}

/**
 * High-level orchestration endpoint that validates a raw request payload
 * and constructs a full celebration plan if valid, or returns structured error details.
 *
 * @param raw - Partial user request payload from web form or API request.
 * @param serverTodayUtcStr - Authoritative UTC date from server system clock.
 * @returns Object with `{ success: true, plan }` or `{ success: false, errors }`.
 */
export function planFromRequest(
  raw: Partial<PlanRequestRaw>,
  serverTodayUtcStr: string
): { success: true; plan: GeneratedEventPlan } | { success: false; errors: ValidationError[] } {
  const validation = validatePlanRequest(raw, serverTodayUtcStr);
  if (!validation.isValid || !validation.sanitizedInput) {
    return { success: false, errors: validation.errors };
  }

  const todayDateStr = typeof raw.todayDate === 'string' ? raw.todayDate : serverTodayUtcStr;
  const plan = buildPlan(validation.sanitizedInput, todayDateStr);
  return { success: true, plan };
}
