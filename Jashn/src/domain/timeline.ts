/**
 * Pure domain logic for celebration timeline and milestone scheduling.
 * Zero external dependencies, pure date calculations.
 */

import { EventType, TimelineMilestone, TimelineStatus } from './types';

/**
 * Calculates calendar days remaining between the current date and a target ISO date string.
 *
 * @param targetDateStr - Target date in YYYY-MM-DD format.
 * @param currentDate - Reference date (defaults to now).
 * @returns Signed integer count of calendar days remaining.
 */
export function calculateDaysRemaining(targetDateStr: string, currentDate = new Date()): number {
  const target = new Date(targetDateStr);
  if (isNaN(target.getTime())) return 0;

  const currentMidnight = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate()
  );
  const targetMidnight = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );

  const diffMs = targetMidnight.getTime() - currentMidnight.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Formats a human-readable urgency badge string for a milestone.
 *
 * @param daysRemaining - Days until due date.
 * @param status - Current completion status.
 * @returns Human-friendly label (e.g. "Done", "Due today", "Overdue by 3d", "In 5 days").
 */
export function formatUrgencyLabel(daysRemaining: number, status: TimelineStatus): string {
  if (status === 'completed') return 'Done';
  if (daysRemaining < 0) return `Overdue by ${Math.abs(daysRemaining)}d`;
  if (daysRemaining === 0) return 'Due today';
  if (daysRemaining === 1) return 'Tomorrow';
  if (daysRemaining <= 14) return `In ${daysRemaining} days`;
  const weeks = Math.round(daysRemaining / 7);
  return `In ${weeks} weeks`;
}

/**
 * Sorts milestones chronologically, placing incomplete items first followed by completed items.
 *
 * @param milestones - Array of milestones.
 * @returns Sorted copy of milestones.
 */
export function sortMilestonesByDueDate(milestones: TimelineMilestone[]): TimelineMilestone[] {
  return [...milestones].sort((a, b) => {
    // Completed items go after pending/in_progress
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
}

/**
 * Toggles a milestone between pending and completed, updating its urgency label.
 *
 * @param milestones - Milestone list.
 * @param milestoneId - ID of milestone to toggle.
 * @returns New array of milestones.
 */
export function toggleMilestoneStatus(
  milestones: TimelineMilestone[],
  milestoneId: string
): TimelineMilestone[] {
  return milestones.map((item) => {
    if (item.id !== milestoneId) return item;
    const nextStatus: TimelineStatus =
      item.status === 'completed' ? 'pending' : 'completed';
    return {
      ...item,
      status: nextStatus,
      urgencyLabel: formatUrgencyLabel(
        calculateDaysRemaining(item.dueDate),
        nextStatus
      ),
    };
  });
}

/**
 * Returns a subset of upcoming milestones enriched with remaining day counts.
 *
 * @param milestones - Source milestones.
 * @param limit - Maximum items to return (defaults to 4).
 * @param currentDate - Reference date.
 * @returns Enriched upcoming milestones.
 */
export function getUpcomingMilestones(
  milestones: TimelineMilestone[],
  limit = 4,
  currentDate = new Date()
): (TimelineMilestone & { daysRemaining: number })[] {
  const withDays = milestones.map((m) => {
    const daysRemaining = calculateDaysRemaining(m.dueDate, currentDate);
    return {
      ...m,
      daysRemaining,
      urgencyLabel: formatUrgencyLabel(daysRemaining, m.status),
    };
  });

  const pending = withDays.filter((m) => m.status !== 'completed');
  pending.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const completed = withDays.filter((m) => m.status === 'completed');
  completed.sort((a, b) => b.dueDate.localeCompare(a.dueDate));

  return [...pending, ...completed].slice(0, limit);
}

/**
 * Generates sample milestone presets mapped to an archetype and event date.
 *
 * @param eventDateStr - Event date string (YYYY-MM-DD).
 * @param eventType - Archetype category.
 * @returns Array of default milestone templates.
 */
export function generateEventMilestones(
  eventDateStr: string,
  eventType: EventType
): TimelineMilestone[] {
  const eventDate = new Date(eventDateStr);
  const baseTime = isNaN(eventDate.getTime()) ? Date.now() : eventDate.getTime();

  const getDateOffset = (daysBefore: number): string => {
    const d = new Date(baseTime - daysBefore * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  };

  if (eventType === 'wedding') {
    return [
      {
        id: 'w-1',
        title: 'Pay venue deposit',
        dueDate: getDateOffset(120),
        category: 'venue',
        status: 'completed',
        estimatedDaysBeforeEvent: 120,
        description: 'Secure main hall and auspicious muhurat timings',
      },
      {
        id: 'w-2',
        title: 'Book photographer',
        dueDate: getDateOffset(100),
        category: 'photography',
        status: 'pending',
        estimatedDaysBeforeEvent: 100,
        description: 'Popular candid photographers fill up 4 months ahead',
      },
      {
        id: 'w-3',
        title: 'Send save-the-dates',
        dueDate: getDateOffset(90),
        category: 'invitations',
        status: 'pending',
        estimatedDaysBeforeEvent: 90,
        description: 'Out-of-town guests need travel & hotel notice',
      },
      {
        id: 'w-4',
        title: 'Caterer menu tasting',
        dueDate: getDateOffset(80),
        category: 'catering',
        status: 'pending',
        estimatedDaysBeforeEvent: 80,
        description: 'Confirm live food stations, vegetarian and Jain menu',
      },
      {
        id: 'w-5',
        title: 'Finalize decorator themes',
        dueDate: getDateOffset(60),
        category: 'decor',
        status: 'pending',
        estimatedDaysBeforeEvent: 60,
        description: 'Mandap, floral entryway, and stage lighting design',
      },
    ];
  }

  return [
    {
      id: 'gen-1',
      title: 'Confirm venue and date',
      dueDate: getDateOffset(30),
      category: 'venue',
      status: 'completed',
      estimatedDaysBeforeEvent: 30,
      description: 'Reserve space and verify audio/visual setup',
    },
    {
      id: 'gen-2',
      title: 'Order cake and catering',
      dueDate: getDateOffset(14),
      category: 'catering',
      status: 'pending',
      estimatedDaysBeforeEvent: 14,
      description: 'Confirm headcount and flavors',
    },
    {
      id: 'gen-3',
      title: 'Send digital invitations',
      dueDate: getDateOffset(10),
      category: 'invitations',
      status: 'pending',
      estimatedDaysBeforeEvent: 10,
      description: 'Track RSVPs via WhatsApp/email',
    },
  ];
}
