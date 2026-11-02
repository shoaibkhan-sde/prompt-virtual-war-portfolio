import { describe, it, expect } from 'vitest';
import { getIdeasForEvent, toggleSavedIdea } from '@/domain/ideas';

describe('domain/ideas', () => {
  it('filters ideas by event type', () => {
    const weddingIdeas = getIdeasForEvent('wedding');
    expect(weddingIdeas.length).toBeGreaterThan(0);
    expect(weddingIdeas.every((i) => i.eventType === 'wedding')).toBe(true);

    const birthdayIdeas = getIdeasForEvent('birthday');
    expect(birthdayIdeas.length).toBeGreaterThan(0);
    expect(birthdayIdeas.every((i) => i.eventType === 'birthday')).toBe(true);
  });

  it('filters ideas by category and cost range', () => {
    const filtered = getIdeasForEvent('wedding', 'decor', 'budget');
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered[0].category).toBe('decor');
    expect(filtered[0].estimatedCostRange).toBe('budget');
  });

  it('toggles saved idea IDs correctly', () => {
    const initial = ['idea-w-1'];
    const added = toggleSavedIdea(initial, 'idea-w-2');
    expect(added).toEqual(['idea-w-1', 'idea-w-2']);

    const removed = toggleSavedIdea(added, 'idea-w-1');
    expect(removed).toEqual(['idea-w-2']);
  });
});
