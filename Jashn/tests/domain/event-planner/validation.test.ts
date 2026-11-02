import { describe, it, expect } from 'vitest';
import { validatePlanRequest, sanitizeText } from '@/domain/event-planner/validation';

describe('domain/event-planner/validation', () => {
  const serverToday = '2026-11-01';

  it('strips control characters and bidirectional override markers', () => {
    const malicious = 'Rohit \u202E\u200E& Meera\u0000 Wedding\u001F';
    const cleaned = sanitizeText(malicious);
    expect(cleaned).toBe('Rohit & Meera Wedding');
  });

  it('reports ALL validation errors at once when multiple fields are invalid', () => {
    const invalidPayload = {
      todayDate: serverToday,
      eventType: 'invalid_type',
      eventName: 'A', // too short (< 2)
      eventDate: '2025-01-01', // in the past
      guestCount: -10, // negative
      totalBudget: -50, // invalid negative budget
      budgetTier: 'invalid_tier' as any,
    };

    const result = validatePlanRequest(invalidPayload, serverToday);
    expect(result.isValid).toBe(false);

    const errorFields = result.errors.map((e) => e.field);
    expect(errorFields).toContain('eventType');
    expect(errorFields).toContain('eventName');
    expect(errorFields).toContain('eventDate');
    expect(errorFields).toContain('guestCount');
    expect(errorFields).toContain('budgetTier');
    expect(result.errors.length).toBeGreaterThanOrEqual(5);

    // Each error has a helpful diagnostic message
    for (const err of result.errors) {
      expect(err.message.length).toBeGreaterThan(10);
    }
  });

  it('rejects dates beyond the 3-year maximum threshold', () => {
    const farFutureDate = '2030-12-31';
    const result = validatePlanRequest(
      {
        todayDate: serverToday,
        eventType: 'wedding',
        eventName: 'Far Future Union',
        eventDate: farFutureDate,
        guestCount: 200,
        totalBudget: 1500000,
        budgetTier: 'standard',
      },
      serverToday
    );

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.field === 'eventDate')).toBe(true);
  });

  it('accepts valid inputs and sanitizes tags properly', () => {
    const validPayload = {
      todayDate: serverToday,
      eventType: 'wedding',
      eventName: '  Aditya & Ananya Celebration  ',
      eventDate: '2027-02-15',
      guestCount: 250,
      totalBudget: 2500000,
      budgetTier: 'standard' as const,
      priorities: ['venue_hospitality', 'culinary_feasts'],
      theme: 'Royal Marigold Twilight',
      interests: 'photography, Drone, Live Music, photography, DRONE',
      venueType: 'indoor' as const,
      dietaryRequirement: 'veg_only' as const,
    };

    const result = validatePlanRequest(validPayload, serverToday);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.sanitizedInput?.eventName).toBe('Aditya & Ananya Celebration');
    // Interests de-duplicated and lowercased
    expect(result.sanitizedInput?.interests).toEqual(['photography', 'drone', 'live music']);
  });

  it('resolves canonical priorities and aliases for birthday gala without errors', () => {
    const payload = {
      todayDate: serverToday,
      eventType: 'birthday',
      eventName: "Aarav's 30th Milestone Celebration",
      eventDate: '2027-03-15',
      guestCount: 60,
      totalBudget: 250000,
      budgetTier: 'standard' as const,
      priorities: ['food_beverage', 'entertainment'],
    };

    const result = validatePlanRequest(payload, serverToday);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.sanitizedInput?.priorities).toEqual(['b_gourmet', 'b_experience']);
  });
});
