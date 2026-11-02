import { describe, it, expect } from 'vitest';
import {
  isSamplePlan,
  isExplicitSamplePlanQuery,
  isGreetingQuery,
  convertGeneratedToCelebrationPlan,
} from '@/domain/plan-utils';
import { WEDDING_TEMPLATE, BIRTHDAY_TEMPLATE } from '@/domain/templates';
import { SAMPLE_PLANS } from '@/domain/event-planner/sample-plans';

describe('domain/plan-utils', () => {
  describe('isSamplePlan', () => {
    it('returns true for null or undefined plan', () => {
      expect(isSamplePlan(null)).toBe(true);
      expect(isSamplePlan(undefined)).toBe(true);
    });

    it('returns true if isSample flag is true', () => {
      expect(isSamplePlan({ isSample: true })).toBe(true);
    });

    it('returns false if isUserCreated flag is true', () => {
      expect(isSamplePlan({ isUserCreated: true })).toBe(false);
    });

    it('identifies starter templates by ID or title', () => {
      expect(isSamplePlan(WEDDING_TEMPLATE)).toBe(true);
      expect(isSamplePlan(BIRTHDAY_TEMPLATE)).toBe(true);
      expect(isSamplePlan({ id: 'sample-hackathon-1' })).toBe(true);
      expect(isSamplePlan({ id: 'plan-wedding-demo' })).toBe(true);
      expect(isSamplePlan({ id: 'wedding' })).toBe(true);
      expect(isSamplePlan({ title: "Priya & Arjun's Grand Wedding Gala" })).toBe(true);
      expect(isSamplePlan({ title: "Aarav's 10th Birthday Bash" })).toBe(true);
      expect(isSamplePlan({ title: 'Prompt Wars AI Hackathon' })).toBe(true);
      expect(isSamplePlan({ title: 'Eid with Family & Friends' })).toBe(true);
      expect(isSamplePlan({ title: 'Shivaji Park Cultural Mela' })).toBe(true);
      expect(isSamplePlan({ title: 'Diwali Society Celebration' })).toBe(true);
    });

    it('identifies user-created plans correctly', () => {
      expect(isSamplePlan({ id: 'plan_1730000000_abc', title: "Sameer's Sangeet" })).toBe(false);
      expect(isSamplePlan({ id: 'custom-event-1', title: 'Tech Conference 2027' })).toBe(false);
    });
  });

  describe('isExplicitSamplePlanQuery', () => {
    it('detects queries asking explicitly for sample or demo plans', () => {
      expect(isExplicitSamplePlanQuery('Show me the sample plan')).toBe(true);
      expect(isExplicitSamplePlanQuery('Tell me about the sample wedding')).toBe(true);
      expect(isExplicitSamplePlanQuery('What is Priya and Arjun budget?')).toBe(true);
      expect(isExplicitSamplePlanQuery('Show Aarav birthday demo plan')).toBe(true);
      expect(isExplicitSamplePlanQuery('What is prompt wars hackathon?')).toBe(true);
    });

    it('returns false for generic or custom queries', () => {
      expect(isExplicitSamplePlanQuery('Hii')).toBe(false);
      expect(isExplicitSamplePlanQuery('Hello')).toBe(false);
      expect(isExplicitSamplePlanQuery('Cut 10% budget')).toBe(false);
      expect(isExplicitSamplePlanQuery('Book a photographer')).toBe(false);
      expect(isExplicitSamplePlanQuery('How do I start planning?')).toBe(false);
    });
  });

  describe('isGreetingQuery', () => {
    it('detects standard greetings', () => {
      expect(isGreetingQuery('hi')).toBe(true);
      expect(isGreetingQuery('hii')).toBe(true);
      expect(isGreetingQuery('hiii')).toBe(true);
      expect(isGreetingQuery('hello')).toBe(true);
      expect(isGreetingQuery('helloo')).toBe(true);
      expect(isGreetingQuery('hey')).toBe(true);
      expect(isGreetingQuery('heyy')).toBe(true);
      expect(isGreetingQuery('namaste')).toBe(true);
      expect(isGreetingQuery('good morning')).toBe(true);
      expect(isGreetingQuery('Hi there! How are you?')).toBe(true);
      expect(isGreetingQuery('Hello assistant')).toBe(true);
    });

    it('returns false for non-greeting requests', () => {
      expect(isGreetingQuery('Cut 10% from the budget')).toBe(false);
      expect(isGreetingQuery('What is the venue cost?')).toBe(false);
      expect(isGreetingQuery('Suggest catering ideas')).toBe(false);
    });
  });

  describe('convertGeneratedToCelebrationPlan', () => {
    it('converts a GeneratedEventPlan to CelebrationPlan correctly', () => {
      const sample = SAMPLE_PLANS[0].plan;
      const converted = convertGeneratedToCelebrationPlan(sample);

      expect(converted.id).toBe(sample.id);
      expect(converted.title).toBe(sample.input.eventName);
      expect(converted.totalBudget).toBe(sample.budget.totalBudget);
      expect(converted.items.length).toBeGreaterThan(0);
      expect(converted.timeline.length).toBeGreaterThan(0);
      expect(converted.vendors.length).toBeGreaterThan(0);
      expect(converted.guests.length).toBe(sample.input.guestCount);
      expect(converted.isSample).toBe(true);
      expect(converted.isUserCreated).toBe(false);
    });

    it('marks non-sample generated plan as user-created', () => {
      const sample = SAMPLE_PLANS[1].plan;
      const customGenerated = {
        ...sample,
        id: 'plan_1730000000_custom',
        input: {
          ...sample.input,
          eventName: "Kavya's Sweet 16",
          eventType: 'birthday' as const,
        },
      };

      const converted = convertGeneratedToCelebrationPlan(customGenerated);
      expect(converted.title).toBe("Kavya's Sweet 16");
      expect(converted.isSample).toBe(false);
      expect(converted.isUserCreated).toBe(true);
      expect(converted.eventType).toBe('birthday');
    });

    it('maps hackathon/community event types properly', () => {
      const hackathon = SAMPLE_PLANS[2].plan;
      const converted = convertGeneratedToCelebrationPlan(hackathon);
      expect(converted.eventType).toBe('community');
    });
  });
});
