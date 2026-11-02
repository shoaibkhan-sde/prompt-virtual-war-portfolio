import { describe, it, expect } from 'vitest';
import {
  calculateDaysRemaining,
  formatUrgencyLabel,
  sortMilestonesByDueDate,
  toggleMilestoneStatus,
  getUpcomingMilestones,
  generateEventMilestones,
} from '@/domain/timeline';
import { TimelineMilestone } from '@/domain/types';

describe('domain/timeline', () => {
  const baseDate = new Date('2026-10-25T00:00:00.000Z');

  it('calculates days remaining accurately', () => {
    // 6 days in future: 2026-10-31
    expect(calculateDaysRemaining('2026-10-31', baseDate)).toBe(6);
    // Today: 2026-10-25
    expect(calculateDaysRemaining('2026-10-25', baseDate)).toBe(0);
    // Yesterday: 2026-10-24
    expect(calculateDaysRemaining('2026-10-24', baseDate)).toBe(-1);
    // Invalid date string
    expect(calculateDaysRemaining('invalid-date', baseDate)).toBe(0);
  });

  it('formats urgency labels based on remaining days and status', () => {
    expect(formatUrgencyLabel(5, 'completed')).toBe('Done');
    expect(formatUrgencyLabel(-3, 'pending')).toBe('Overdue by 3d');
    expect(formatUrgencyLabel(0, 'pending')).toBe('Due today');
    expect(formatUrgencyLabel(1, 'pending')).toBe('Tomorrow');
    expect(formatUrgencyLabel(6, 'pending')).toBe('In 6 days');
    expect(formatUrgencyLabel(28, 'pending')).toBe('In 4 weeks');
  });

  it('sorts milestones by due date with pending before completed', () => {
    const list: TimelineMilestone[] = [
      { id: '1', title: 'A', dueDate: '2026-10-10', category: 'venue', status: 'completed', estimatedDaysBeforeEvent: 30 },
      { id: '2', title: 'B', dueDate: '2026-11-01', category: 'catering', status: 'pending', estimatedDaysBeforeEvent: 10 },
      { id: '3', title: 'C', dueDate: '2026-10-28', category: 'decor', status: 'pending', estimatedDaysBeforeEvent: 14 },
    ];

    const sorted = sortMilestonesByDueDate(list);
    expect(sorted[0].id).toBe('3'); // Pending, earliest
    expect(sorted[1].id).toBe('2'); // Pending, later
    expect(sorted[2].id).toBe('1'); // Completed
  });

  it('toggles milestone status between completed and pending', () => {
    const list: TimelineMilestone[] = [
      { id: '1', title: 'A', dueDate: '2026-11-01', category: 'venue', status: 'pending', estimatedDaysBeforeEvent: 20 },
    ];

    const toggled = toggleMilestoneStatus(list, '1');
    expect(toggled[0].status).toBe('completed');
    expect(toggled[0].urgencyLabel).toBe('Done');

    const untoggled = toggleMilestoneStatus(toggled, '1');
    expect(untoggled[0].status).toBe('pending');
  });

  it('returns upcoming milestones limited to count', () => {
    const milestones = generateEventMilestones('2027-02-20', 'wedding');
    const upcoming = getUpcomingMilestones(milestones, 3, baseDate);
    expect(upcoming.length).toBeLessThanOrEqual(3);
    expect(upcoming[0]).toHaveProperty('daysRemaining');
  });

  it('generates milestones for birthday and generic event types', () => {
    const milestones = generateEventMilestones('2027-03-15', 'birthday');
    expect(milestones.length).toBeGreaterThanOrEqual(3);

    // Invalid date fallback
    const fallbackMilestones = generateEventMilestones('not-a-date', 'wedding');
    expect(fallbackMilestones.length).toBeGreaterThan(0);
  });

  it('keeps other milestones unchanged when toggling status', () => {
    const list: TimelineMilestone[] = [
      { id: '1', title: 'A', dueDate: '2026-11-01', category: 'venue', status: 'pending', estimatedDaysBeforeEvent: 20 },
      { id: '2', title: 'B', dueDate: '2026-11-05', category: 'decor', status: 'pending', estimatedDaysBeforeEvent: 15 },
    ];
    const updated = toggleMilestoneStatus(list, '1');
    expect(updated[1].status).toBe('pending');
  });
});

