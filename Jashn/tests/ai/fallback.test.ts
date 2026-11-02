import { describe, it, expect } from 'vitest';
import { runDeterministicFallback } from '@/ai/fallback';
import { WEDDING_TEMPLATE } from '@/domain/templates';

describe('ai/fallback', () => {
  it('correctly handles budget cut queries and proposes domain rebalance', () => {
    const res = runDeterministicFallback(
      'Cut 10% from the total but keep the photographer.',
      WEDDING_TEMPLATE
    );

    expect(res.source).toBe('built-in');
    expect(res.intent).toBe('budget_cut');
    expect(res.proposedBudgetChange).toBeDefined();
    expect(res.proposedBudgetChange?.cutPercentage).toBe(10);
    expect(res.proposedBudgetChange?.lockedCategories).toContain('photography');

    // Total must be recalculated by domain: 18,00,000 - 10% = 16,20,000
    expect(res.proposedBudgetChange?.targetBudget).toBe(1620000);
    expect(res.reply).toContain('16,20,000');
    expect(res.reply).toContain('recalculated by the planner domain engine');
  });

  it('detects locked venue and catering keywords in budget cuts', () => {
    const res = runDeterministicFallback(
      'reduce 15% budget but preserve venue and catering',
      WEDDING_TEMPLATE
    );

    expect(res.intent).toBe('budget_cut');
    expect(res.proposedBudgetChange?.cutPercentage).toBe(15);
    expect(res.proposedBudgetChange?.lockedCategories).toContain('venue');
    expect(res.proposedBudgetChange?.lockedCategories).toContain('catering');
  });

  it('handles cut with no explicitly locked categories', () => {
    const res = runDeterministicFallback(
      'Cut 5% across everything',
      WEDDING_TEMPLATE,
      []
    );

    expect(res.intent).toBe('budget_cut');
    expect(res.proposedBudgetChange?.lockedCategories).toEqual([]);
    expect(res.reply).toContain('None');
  });

  it('answers photography vendor queries with budget and timeline guidelines', () => {
    const res = runDeterministicFallback('When should I book the photographer?', WEDDING_TEMPLATE);
    expect(res.source).toBe('built-in');
    expect(res.intent).toBe('vendor_advice');
    expect(res.reply).toContain('photography');
  });

  it('answers catering menu inquiries with guidelines', () => {
    const res = runDeterministicFallback('What catering options are best?', WEDDING_TEMPLATE);
    expect(res.source).toBe('built-in');
    expect(res.reply).toContain('Catering');
  });

  it('does NOT mention sample plan names on greetings like Hii or Hello', () => {
    const res = runDeterministicFallback('Hii', WEDDING_TEMPLATE);
    expect(res.source).toBe('built-in');
    expect(res.intent).toBe('general_advice');
    expect(res.reply).toContain('Hello! 👋 I am Jashn');
    expect(res.reply).not.toContain('Priya');
    expect(res.reply).not.toContain('Arjun');
    expect(res.reply).not.toContain('Aarav');
  });

  it('provides general celebration guidance on sample plans without mentioning sample names', () => {
    const res = runDeterministicFallback('How is my event looking?', WEDDING_TEMPLATE);
    expect(res.source).toBe('built-in');
    expect(res.intent).toBe('general_advice');
    expect(res.reply).not.toContain(WEDDING_TEMPLATE.title);
    expect(res.reply).toContain('Jashn Celebration & Event Planning assistant');
  });

  it('acknowledges user created plan on inquiries and greetings', () => {
    const userPlan = {
      ...WEDDING_TEMPLATE,
      id: 'plan_user_created_123',
      title: "Kavya's 16th Birthday Celebration",
      isUserCreated: true,
      isSample: false,
    };

    const res = runDeterministicFallback('How is my event looking?', userPlan);
    expect(res.source).toBe('built-in');
    expect(res.intent).toBe('general_advice');
    expect(res.reply).toContain("Kavya's 16th Birthday Celebration");

    const greetRes = runDeterministicFallback('Hello', userPlan);
    expect(greetRes.reply).toContain("Kavya's 16th Birthday Celebration");
  });

  it('only reveals sample plan details when user explicitly asks for sample plan', () => {
    const res = runDeterministicFallback('What is the sample plan budget?', WEDDING_TEMPLATE);
    expect(res.source).toBe('built-in');
    expect(res.intent).toBe('general_advice');
    expect(res.reply).toContain(WEDDING_TEMPLATE.title);
  });
});
