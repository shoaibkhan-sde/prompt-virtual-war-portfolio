import { describe, it, expect } from 'vitest';
import {
  WEDDING_TEMPLATE,
  BIRTHDAY_TEMPLATE,
  COMMUNITY_TEMPLATE,
  FESTIVAL_TEMPLATE,
  getTemplateByEventType,
} from '@/domain/templates';

describe('domain/templates', () => {
  it('wedding template satisfies Main.dc exact figures', () => {
    expect(WEDDING_TEMPLATE.title).toBe('Priya & Arjun’s Wedding');
    expect(WEDDING_TEMPLATE.totalBudget).toBe(1800000);
    expect(WEDDING_TEMPLATE.guests.length).toBe(220);

    // Sum of allocated items must equal totalBudget
    const sumAllocated = WEDDING_TEMPLATE.items.reduce((s, i) => s + i.allocatedAmount, 0);
    expect(sumAllocated).toBe(1800000);

    // Spent sum must equal 3,95,000 (22% of 18,00,000)
    const sumSpent = WEDDING_TEMPLATE.items.reduce((s, i) => s + i.spentAmount, 0);
    expect(sumSpent).toBe(395000);
  });

  it('all templates have valid dates, categories, and vendors', () => {
    const templates = [WEDDING_TEMPLATE, BIRTHDAY_TEMPLATE, COMMUNITY_TEMPLATE, FESTIVAL_TEMPLATE];
    for (const t of templates) {
      expect(t.totalBudget).toBeGreaterThan(0);
      expect(t.items.length).toBeGreaterThan(0);
      expect(t.timeline.length).toBeGreaterThan(0);
      expect(t.vendors.length).toBeGreaterThan(0);
      expect(t.guests.length).toBeGreaterThan(0);

      const sum = t.items.reduce((acc, item) => acc + item.allocatedAmount, 0);
      expect(sum).toBe(t.totalBudget);
    }
  });

  it('getTemplateByEventType retrieves appropriate template', () => {
    expect(getTemplateByEventType('wedding').id).toBe(WEDDING_TEMPLATE.id);
    expect(getTemplateByEventType('birthday').id).toBe(BIRTHDAY_TEMPLATE.id);
    expect(getTemplateByEventType('community').id).toBe(COMMUNITY_TEMPLATE.id);
    expect(getTemplateByEventType('festival').id).toBe(FESTIVAL_TEMPLATE.id);
  });
});
