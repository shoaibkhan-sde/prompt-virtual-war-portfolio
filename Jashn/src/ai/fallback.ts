/**
 * Deterministic built-in AI fallback engine.
 * Ensures all planner capabilities work offline and without an API key.
 * Strictly relies on domain math functions for any budget calculations.
 */

import { CelebrationPlan, ExpenseCategory } from '@/domain/types';
import { simulateBudgetCut } from '@/domain/scenarios';
import { formatINR } from '@/domain/format';
import { isSamplePlan, isExplicitSamplePlanQuery, isGreetingQuery } from '@/domain/plan-utils';
import { AssistantResponse } from './schemas';

export function runDeterministicFallback(
  query: string,
  plan: CelebrationPlan,
  explicitLockedCategories: ExpenseCategory[] = []
): AssistantResponse {
  const lower = query.toLowerCase();
  const timestamp = new Date().toISOString();
  const isSample = isSamplePlan(plan);
  const explicitSample = isExplicitSamplePlanQuery(query);
  const isGreeting = isGreetingQuery(query);

  // Pattern 0: Greetings & Welcome (e.g. "hi", "hello", "namaste")
  if (isGreeting) {
    if (!isSample) {
      // User created plan
      return {
        reply: `Hello! 👋 I am Jashn, your AI Celebration & Event Planner.\n\nI'm ready to help you orchestrate "**${plan.title}**" with exact budget calculations, milestone deadlines, and vendor checklists.\n\nHow can I help you today?`,
        intent: 'general_advice',
        source: 'built-in',
        modelUsed: 'deterministic-rule-engine-v1',
        timestamp,
      };
    }

    // Sample plan / browsing mode: do NOT mention sample plan names
    return {
      reply: `Hello! 👋 I am Jashn, your AI Celebration & Event Planner.\n\nI can help you design, budget, and organize weddings, milestone birthdays, festivals, or community gatherings with exact math, lead-time scalers, and vendor checklists.\n\nHow can I help you plan your celebration today?`,
      intent: 'general_advice',
      source: 'built-in',
      modelUsed: 'deterministic-rule-engine-v1',
      timestamp,
    };
  }

  // Pattern 1: Budget cut (e.g. "cut 10%", "reduce 15%", "save 10% but keep photographer")
  const cutMatch = lower.match(/(?:cut|reduce|trim|save)\s+(\d+)%/);
  if (cutMatch || lower.includes('cut') || lower.includes('reduce')) {
    const cutPercent = cutMatch ? parseInt(cutMatch[1], 10) : 10;

    // Detect mentioned locked categories from text
    const detectedLocked: ExpenseCategory[] = [...explicitLockedCategories];
    if (lower.includes('photograph') && !detectedLocked.includes('photography')) {
      detectedLocked.push('photography');
    }
    if (lower.includes('venue') && !detectedLocked.includes('venue')) {
      detectedLocked.push('venue');
    }
    if (lower.includes('cater') && !detectedLocked.includes('catering')) {
      detectedLocked.push('catering');
    }

    const simulation = simulateBudgetCut(plan.items, cutPercent, detectedLocked);
    const oldFmt = formatINR(simulation.oldTotalBudget);
    const newFmt = formatINR(simulation.newTotalBudget);

    const changedLines = simulation.adjustments
      .filter((a) => a.difference !== 0)
      .map(
        (a) =>
          `• **${a.categoryId.charAt(0).toUpperCase() + a.categoryId.slice(1)}**: ${formatINR(
            a.oldAmount
          )} → ${formatINR(a.newAmount)} (${formatINR(a.difference)})`
      )
      .join('\n');

    const lockedNames =
      detectedLocked.length > 0
        ? detectedLocked.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')
        : 'None';

    const intro = isSample && !explicitSample
      ? `Here is a simulated budget reduction. Totals were recalculated by the planner domain engine, not estimated:\n\n`
      : `Here is the proposed change for "${plan.title}". Totals were recalculated by the planner domain engine, not estimated.\n\n`;

    const reply = `${intro}` +
      `**Total Budget:** ${oldFmt} → **${newFmt}** (−${cutPercent}%)\n` +
      `**Locked (Unchanged):** ${lockedNames}\n\n` +
      `**Category Breakdown Adjustments:**\n${changedLines}\n\n` +
      `Click **Apply changes** below to update your event plan.`;

    return {
      reply,
      intent: 'budget_cut',
      proposedBudgetChange: {
        type: 'cut_percentage',
        cutPercentage: cutPercent,
        targetBudget: simulation.newTotalBudget,
        lockedCategories: detectedLocked,
      },
      source: 'built-in',
      modelUsed: 'deterministic-rule-engine-v1',
      timestamp,
    };
  }

  // Pattern 2: Photographer or Vendor inquiry
  if (lower.includes('photo') || lower.includes('vendor') || lower.includes('book')) {
    const photogVendor = plan.vendors.find((v) => v.category === 'photography');
    const budgetFmt = photogVendor ? formatINR(photogVendor.allocatedBudget) : 'allocated amount';
    const deadline = photogVendor ? photogVendor.deadlineDate : '4 months before event';

    const allocationNote = !isSample || explicitSample
      ? `• **Current Allocation:** ${budgetFmt} (${plan.title})\n`
      : `• **Typical Allocation:** 8%–12% of total celebration budget\n`;

    return {
      reply: `For wedding and celebration photography, experienced candids fill up rapidly.\n\n` +
        allocationNote +
        `• **Recommended Booking Deadline:** ${deadline}\n` +
        `• **Recommendation:** Book a team that covers both traditional family portraits and candid documentary moments. Schedule a pre-wedding consultation to align on key rituals.`,
      intent: 'vendor_advice',
      source: 'built-in',
      modelUsed: 'deterministic-rule-engine-v1',
      timestamp,
    };
  }

  // Pattern 3: Catering / Menu inquiry
  if (lower.includes('cater') || lower.includes('food') || lower.includes('menu')) {
    const cateringItem = plan.items.find((i) => i.category === 'catering');
    const costFmt = cateringItem ? formatINR(cateringItem.allocatedAmount) : 'allocated amount';

    const cateringCostNote = !isSample || explicitSample
      ? `(currently ${costFmt} in "${plan.title}")`
      : `(typically 25%–35% of celebration budget)`;

    return {
      reply: `Catering is typically 25%–35% of a celebration budget ${cateringCostNote}.\n\n` +
        `• **Tasting Check:** Schedule tasting 2–3 months in advance to test live counters and regional specialties.\n` +
        `• **Dietary Provisions:** Ensure separate counters for strict Jain, vegetarian, and dietary-restricted guests.\n` +
        `• **Cost Optimization:** Replace static courses with dynamic live stations (chaat, dosas, pasta) to reduce food waste.`,
      intent: 'vendor_advice',
      source: 'built-in',
      modelUsed: 'deterministic-rule-engine-v1',
      timestamp,
    };
  }

  // Pattern 4: Explicit inquiry about sample/demo plans
  if (explicitSample) {
    const totalFmt = formatINR(plan.totalBudget);
    return {
      reply: `You are exploring the demonstration celebration "${plan.title}".\n\n` +
        `• **Archetype:** ${plan.eventType.toUpperCase()}\n` +
        `• **Target Budget:** ${totalFmt}\n` +
        `• **Guest Count:** ${plan.guests.length} guests\n` +
        `• **Contingency Reserve:** ${plan.reservePercentage}%\n\n` +
        `You can test budget rebalancing, check vendor deadlines, or create your own real celebration under **Start a new plan**!`,
      intent: 'general_advice',
      source: 'built-in',
      modelUsed: 'deterministic-rule-engine-v1',
      timestamp,
    };
  }

  // Pattern 5: Default General Advice
  if (!isSample) {
    // User created plan: user knows their event
    const totalFmt = formatINR(plan.totalBudget);
    return {
      reply: `Your celebration "${plan.title}" is currently planned for **${totalFmt}** with ${plan.guests.length} guests.\n\n` +
        `You can ask me to:\n` +
        `1. *"Cut 10% from the total but keep the photographer"*\n` +
        `2. *"Suggest menu options for your guests"*\n` +
        `3. *"What vendors should I book first?"*\n` +
        `4. *"Check reserve protection and contingency buffer"*`,
      intent: 'general_advice',
      source: 'built-in',
      modelUsed: 'deterministic-rule-engine-v1',
      timestamp,
    };
  }

  // Active plan is sample/template, and query is not explicit:
  // Do NOT mention sample plan names
  return {
    reply: `Hello! I'm your Jashn Celebration & Event Planning assistant.\n\n` +
      `You can ask me to:\n` +
      `1. *"Suggest menu options for a celebration"*\n` +
      `2. *"What vendors should I book first?"*\n` +
      `3. *"How does the integer budget split work?"*\n` +
      `4. *"How far in advance should I start planning?"*\n\n` +
      `To organize your own celebration with custom budgets and vendor checklists, click **Start a new plan**!`,
    intent: 'general_advice',
    source: 'built-in',
    modelUsed: 'deterministic-rule-engine-v1',
    timestamp,
  };
}
