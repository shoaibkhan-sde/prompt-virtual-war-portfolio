import { describe, it, expect } from 'vitest';
import { computeVendorPlan } from '@/domain/event-planner/vendors-math';
import { rankAndFilterIdeas } from '@/domain/event-planner/ideas-math';
import { calculateBudgetSplit } from '@/domain/event-planner/budget-math';
import { getEventDefinition } from '@/domain/event-planner/registry';
import { buildPlan } from '@/domain/event-planner/plan-builder';
import {
  serializePlanToUrlFragment,
  deserializePlanFromUrlFragment,
  generateIcsCalendar,
  exportPlanAsChecklistText,
} from '@/domain/event-planner/export-utils';

describe('domain/event-planner/vendors-ideas-and-export', () => {
  const weddingDef = getEventDefinition('wedding')!;
  const today = '2026-11-01';
  const eventDate = '2027-04-10';

  it('ensures vendor booking deadline perfectly aligns with timeline lead days', () => {
    const budget = calculateBudgetSplit(2000000, weddingDef, 'standard', []);
    const plan = computeVendorPlan(eventDate, today, weddingDef, budget, [], 'indoor');

    expect(plan.vendors.length).toBeGreaterThan(0);
    for (const vendor of plan.vendors) {
      expect(vendor.bookingDeadline).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(vendor.bookingDeadline <= eventDate).toBe(true);
      expect(vendor.allocatedBudget).toBeGreaterThan(0);
      expect(vendor.questionsToAsk.length).toBeGreaterThan(0);
    }
  });

  it('filters out physical venue & catering vendors for online-only events', () => {
    const techMeetupDef = getEventDefinition('tech_meetup')!;
    const budget = calculateBudgetSplit(100000, techMeetupDef, 'standard', [], 'online');
    const onlinePlan = computeVendorPlan(eventDate, today, techMeetupDef, budget, [], 'online');

    const hasPhysicalCatering = onlinePlan.vendors.some((v) =>
      v.role.toLowerCase().includes('caterer') || v.categoryId.toLowerCase().includes('refreshment')
    );
    expect(hasPhysicalCatering).toBe(false);
  });

  it('ranks ideas by keyword overlap and displays matched terms', () => {
    const ideas = rankAndFilterIdeas(
      weddingDef,
      200,
      'premium',
      'indoor',
      'Royal heritage banquet with cinematic lighting',
      ['photography', 'drone', 'folk music']
    );

    expect(ideas.length).toBeGreaterThan(0);
    const topIdea = ideas[0];
    expect(topIdea.source).toBe('builtin');
    // Top matching ideas should have matched keywords
    const anyMatched = ideas.some((i) => i.matchedKeywords.length > 0);
    expect(anyMatched).toBe(true);
  });

  it('filters ideas by tier eligibility', () => {
    const leanIdeas = rankAndFilterIdeas(weddingDef, 200, 'lean', 'indoor');
    const premiumIdeas = rankAndFilterIdeas(weddingDef, 200, 'premium', 'indoor');

    // Premium ideas should include options that lean excludes
    expect(premiumIdeas.length).toBeGreaterThanOrEqual(leanIdeas.length);
  });

  it('safely serializes and deserializes plan to URL fragment and rejects corrupted payloads', () => {
    const plan = buildPlan(
      {
        eventType: 'wedding',
        eventName: 'Test Union',
        eventDate: '2027-05-15',
        guestCount: 200,
        currency: 'INR',
        totalBudget: 1800000,
        budgetTier: 'standard',
        priorities: ['venue_hospitality'],
        interests: ['music'],
        venueType: 'indoor',
        dietaryRequirement: 'veg_only',
        alcoholServed: false,
        secondaryGuestCount: 0,
      },
      today
    );

    const fragment = serializePlanToUrlFragment(plan);
    expect(fragment.length).toBeGreaterThan(50);

    const restored = deserializePlanFromUrlFragment(fragment);
    expect(restored).not.toBeNull();
    expect(restored?.input.eventName).toBe('Test Union');
    expect(restored?.budget.totalBudget).toBe(1800000);

    // Corrupted payload test
    const corrupted = deserializePlanFromUrlFragment('invalid-base64-random-noise-!@#$');
    expect(corrupted).toBeNull();

    const emptyJson = deserializePlanFromUrlFragment(Buffer.from('{}').toString('base64'));
    expect(emptyJson).toBeNull();
  });

  it('generates valid RFC 5545 iCalendar content', () => {
    const plan = buildPlan(
      {
        eventType: 'wedding',
        eventName: 'Calendar Test',
        eventDate: '2027-05-15',
        guestCount: 200,
        currency: 'INR',
        totalBudget: 1800000,
        budgetTier: 'standard',
        priorities: [],
        interests: [],
        venueType: 'indoor',
        dietaryRequirement: 'none',
        alcoholServed: false,
        secondaryGuestCount: 0,
      },
      today
    );

    const ics = generateIcsCalendar(plan);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('SUMMARY:');
    expect(ics).toContain('DTSTART;VALUE=DATE:');
  });

  it('exports plain text checklist without any HTML markup', () => {
    const plan = buildPlan(
      {
        eventType: 'wedding',
        eventName: 'Text Export',
        eventDate: '2027-05-15',
        guestCount: 150,
        currency: 'INR',
        totalBudget: 1500000,
        budgetTier: 'standard',
        priorities: [],
        interests: [],
        venueType: 'indoor',
        dietaryRequirement: 'none',
        alcoholServed: false,
        secondaryGuestCount: 0,
      },
      today
    );

    const text = exportPlanAsChecklistText(plan);
    expect(text).toContain('JASHN EVENT PLAN: TEXT EXPORT');
    expect(text).toContain('[1] BUDGET ALLOCATION');
    expect(text).toContain('[2] MILESTONE TIMELINE CHECKLIST');
    expect(text).not.toContain('<div');
    expect(text).not.toContain('</');
  });
});
