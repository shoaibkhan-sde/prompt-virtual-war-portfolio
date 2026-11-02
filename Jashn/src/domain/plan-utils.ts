/**
 * Shared utility functions for plan classification, query intent detection,
 * and format adaptation between domain models.
 */

import { CelebrationPlan, EventType, ExpenseCategory } from './types';
import { GeneratedEventPlan } from './event-planner/types';

/**
 * Determines whether a plan is a demo/sample/starter template
 * or a plan created by the user.
 */
export function isSamplePlan(
  plan?: { id?: string; title?: string; isSample?: boolean; isUserCreated?: boolean } | null
): boolean {
  if (!plan) return true;
  if (plan.isSample === true) return true;
  if (plan.isUserCreated === true) return false;

  const id = (plan.id || '').toLowerCase();
  if (
    id.startsWith('sample-') ||
    id.startsWith('plan-wedding-') ||
    id.startsWith('plan-birthday-') ||
    id.startsWith('plan-community-') ||
    id.startsWith('plan-festival-') ||
    id === 'wedding' ||
    id === 'birthday' ||
    id === 'community' ||
    id === 'festival' ||
    id === 'hackathon'
  ) {
    return true;
  }

  const title = (plan.title || '').toLowerCase();
  if (
    title.includes('priya & arjun') ||
    title.includes("priya & arjun's") ||
    title.includes('priya and arjun') ||
    title.includes('aarav') ||
    title.includes('aarav’s') ||
    title.includes('shivaji park') ||
    title.includes('prompt wars') ||
    title.includes('grand wedding gala') ||
    title.includes('30th milestone birthday') ||
    title.includes('24h ai hackathon') ||
    title.includes('eid with family & friends') ||
    title.includes('diwali society celebration')
  ) {
    return true;
  }

  return false;
}

/**
 * Checks whether the user query explicitly mentions or asks for sample/demo plans.
 */
export function isExplicitSamplePlanQuery(query: string): boolean {
  const lower = query.toLowerCase();
  return (
    lower.includes('sample plan') ||
    lower.includes('sample event') ||
    lower.includes('demo plan') ||
    lower.includes('template plan') ||
    lower.includes('starter plan') ||
    lower.includes('priya') ||
    lower.includes('arjun') ||
    lower.includes('aarav') ||
    lower.includes('prompt wars') ||
    lower.includes('show sample') ||
    lower.includes('view sample') ||
    lower.includes('sample wedding') ||
    lower.includes('sample birthday') ||
    lower.includes('tell me about the sample')
  );
}

/**
 * Checks whether the user input is a greeting or introductory pleasantry.
 */
export function isGreetingQuery(query: string): boolean {
  const clean = query.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const greetingWords = new Set([
    'hi',
    'hii',
    'hiii',
    'hello',
    'helloo',
    'hey',
    'heyy',
    'hola',
    'namaste',
    'namaskar',
    'good morning',
    'good afternoon',
    'good evening',
    'howdy',
    'sup',
    'yo',
    'greetings',
    'help',
    'start',
  ]);
  if (greetingWords.has(clean)) return true;
  return /^(hi|hii|hello|hey|hola|namaste)\b/.test(clean);
}

/**
 * Normalizes category IDs to standard ExpenseCategory values.
 */
function normalizeExpenseCategory(catId: string): ExpenseCategory {
  const lower = catId.toLowerCase();
  if (lower.includes('venue') || lower.includes('hall') || lower.includes('pandal')) return 'venue';
  if (lower.includes('cater') || lower.includes('food') || lower.includes('meal') || lower.includes('beverage')) return 'catering';
  if (lower.includes('decor') || lower.includes('floral') || lower.includes('lighting')) return 'decor';
  if (lower.includes('photo') || lower.includes('video') || lower.includes('portrait')) return 'photography';
  if (lower.includes('attire') || lower.includes('wardrobe') || lower.includes('styling')) return 'attire';
  if (lower.includes('entertain') || lower.includes('music') || lower.includes('sound') || lower.includes('dj')) return 'entertainment';
  if (lower.includes('invit') || lower.includes('card')) return 'invitations';
  if (lower.includes('gift') || lower.includes('favor')) return 'gifts';
  return 'miscellaneous';
}

/**
 * Maps a GeneratedEventPlan from the wizard/planner into a CelebrationPlan.
 */
export function convertGeneratedToCelebrationPlan(genPlan: GeneratedEventPlan): CelebrationPlan {
  const isSample = isSamplePlan({ id: genPlan.id, title: genPlan.input.eventName });

  let eventType: EventType = 'wedding';
  if (genPlan.input.eventType === 'birthday') eventType = 'birthday';
  else if (genPlan.input.eventType === 'community_event') eventType = 'community';
  else if (genPlan.input.eventType === 'hackathon' || genPlan.input.eventType === 'college_fest' || genPlan.input.eventType === 'tech_meetup') {
    eventType = 'community';
  }

  return {
    id: genPlan.id,
    eventType,
    title: genPlan.input.eventName,
    date: genPlan.input.eventDate,
    location: genPlan.input.city || 'India',
    totalBudget: genPlan.budget.totalBudget,
    reservePercentage: genPlan.budget.contingencyPercent,
    items: genPlan.budget.categories.map((c, idx) => ({
      id: c.categoryId || `b-${idx}`,
      category: normalizeExpenseCategory(c.categoryId || c.categoryName),
      name: c.categoryName,
      allocatedAmount: c.allocatedAmount,
      spentAmount: c.actualSpent || 0,
    })),
    timeline: genPlan.timeline.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.scheduledDate,
      category: 'general',
      status: t.isCompleted ? 'completed' : 'pending',
      estimatedDaysBeforeEvent: t.offsetDays,
    })),
    vendors: genPlan.vendors.vendors.map((v) => ({
      id: v.id,
      category: normalizeExpenseCategory(v.categoryId || v.role),
      role: v.role,
      status: v.isBooked ? 'booked' : 'not_started',
      deadlineDate: v.bookingDeadline,
      allocatedBudget: v.allocatedBudget,
    })),
    guests: Array.from({ length: genPlan.input.guestCount || 50 }, (_, i) => ({
      id: `g-${i + 1}`,
      name: `Guest ${i + 1}`,
      status: 'confirmed',
      plusOnes: 0,
    })),
    savedIdeaIds: genPlan.ideas.map((idea) => idea.id),
    isSample,
    isUserCreated: !isSample,
  };
}
