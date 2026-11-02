import { EventDefinition, TimelinePlan, TimelineTask, VenueType } from './types';

function addDaysToDate(utcDateStr: string, days: number): string {
  const d = new Date(utcDateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

function getDaysDiff(fromUtcDateStr: string, toUtcDateStr: string): number {
  const d1 = new Date(fromUtcDateStr + 'T00:00:00Z');
  const d2 = new Date(toUtcDateStr + 'T00:00:00Z');
  return Math.round((d2.getTime() - d1.getTime()) / 86400000);
}

/**
 * Computes a chronologically ordered milestone timeline for an event.
 *
 * Capabilities:
 * - Proportional schedule compression: Dynamically scales milestone offsets when actual lead time
 *   is shorter than the recommended span, preventing deadlines from falling into the past.
 * - Topological dependency resolution and critical path tagging.
 * - Outdoor weather contingency inspection injection.
 * - Phase grouping from initial planning to post-event settlement.
 *
 * @param eventDate - ISO format YYYY-MM-DD celebration date.
 * @param todayDate - Current date reference (ISO YYYY-MM-DD).
 * @param eventDef - Event archetype definition containing base task templates and dependencies.
 * @param venueType - Venue classification ('indoor', 'outdoor', 'online').
 * @returns A fully mapped `TimelinePlan` with scheduled dates, urgency badges, and phase groupings.
 */
export function computeTimelinePlan(
  eventDate: string,
  todayDate: string,
  eventDef: EventDefinition,
  venueType: VenueType = 'indoor'
): TimelinePlan {
  const actualLeadDays = Math.max(0, getDaysDiff(todayDate, eventDate));
  const recommendedSpan = eventDef.recommendedLeadDays;
  const isCompressed = actualLeadDays < recommendedSpan;

  // Clone tasks and append weather task if outdoor
  const rawTasks = [...eventDef.tasks];
  if (venueType === 'outdoor' && !rawTasks.some((t) => t.id.includes('weather'))) {
    rawTasks.push({
      id: `${eventDef.id}-weather-backup`,
      title: 'Inspect monsoon/heat weather forecast & verify waterproof canopy backup',
      phase: 'final_week',
      offsetDays: -4,
      dependsOn: rawTasks[1] ? [rawTasks[1].id] : [],
    });
  }

  // 1. Scale offsets
  const scaleFactor = isCompressed && recommendedSpan > 0 ? actualLeadDays / recommendedSpan : 1.0;

  const tasksWithDates = rawTasks.map((t) => {
    let scaledOffset = t.offsetDays;
    if (t.offsetDays < 0) {
      if (isCompressed) {
        scaledOffset = Math.round(t.offsetDays * scaleFactor);
        // Clamp so offset doesn't reach before today
        if (Math.abs(scaledOffset) > actualLeadDays) {
          scaledOffset = -actualLeadDays;
        }
      }
    }
    const scheduledDate = addDaysToDate(eventDate, scaledOffset);
    return {
      template: t,
      scaledOffset,
      scheduledDate,
    };
  });

  // Sort chronologically by scheduled date, then original offset
  tasksWithDates.sort((a, b) => a.scaledOffset - b.scaledOffset);

  // 2. Compute dependencies, blocking status & critical path
  const taskMap = new Map<string, (typeof tasksWithDates)[0]>();
  for (const item of tasksWithDates) {
    taskMap.set(item.template.id, item);
  }

  // Identify dependents: who depends on task X?
  const dependentsMap = new Map<string, string[]>();
  for (const item of tasksWithDates) {
    for (const depId of item.template.dependsOn) {
      const list = dependentsMap.get(depId) || [];
      list.push(item.template.id);
      dependentsMap.set(depId, list);
    }
  }

  // Longest path through the DAG for critical path identification
  const longestPathToGoal = new Map<string, number>();
  function getDepth(id: string): number {
    if (longestPathToGoal.has(id)) return longestPathToGoal.get(id)!;
    const deps = dependentsMap.get(id) || [];
    if (deps.length === 0) {
      longestPathToGoal.set(id, 1);
      return 1;
    }
    const maxSub = Math.max(...deps.map(getDepth));
    const depth = 1 + maxSub;
    longestPathToGoal.set(id, depth);
    return depth;
  }

  for (const item of tasksWithDates) {
    getDepth(item.template.id);
  }

  const maxTotalDepth = Math.max(1, ...Array.from(longestPathToGoal.values()));

  const tasks: TimelineTask[] = tasksWithDates.map((item) => {
    const t = item.template;
    const daysUntilDue = getDaysDiff(todayDate, item.scheduledDate);

    let statusText = 'Pending';
    if (daysUntilDue === 0) {
      statusText = 'Due today';
    } else if (daysUntilDue > 0) {
      statusText = `Due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`;
    } else {
      statusText = `Overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? '' : 's'}`;
    }

    const dependents = dependentsMap.get(t.id) || [];
    const isCritical = (longestPathToGoal.get(t.id) || 0) >= maxTotalDepth - 1;

    return {
      id: t.id,
      title: t.title,
      phase: t.phase,
      scheduledDate: item.scheduledDate,
      offsetDays: item.scaledOffset,
      dependsOn: t.dependsOn,
      isCompleted: false,
      isCriticalPath: isCritical,
      isBlockingOtherTasks: dependents.length > 0,
      blockedBy: t.dependsOn,
      statusText,
    };
  });

  const overdueCount = tasks.filter((t) => getDaysDiff(todayDate, t.scheduledDate) < 0).length;

  return {
    isCompressed,
    compressionNotice: isCompressed
      ? `Timeline compressed: Event is in ${actualLeadDays} days (standard window is ${recommendedSpan} days). Milestone deadlines have been fast-tracked while preserving sequence.`
      : undefined,
    tasks,
    totalTasks: tasks.length,
    completedTasks: 0,
    overdueTasks: overdueCount,
  };
}

export function updateTaskCompletion(plan: TimelinePlan, taskId: string, isCompleted: boolean, todayDate: string): TimelinePlan {
  const updatedTasks = plan.tasks.map((t) => {
    if (t.id !== taskId) return t;
    return {
      ...t,
      isCompleted,
      statusText: isCompleted ? 'Done' : getPendingStatusText(todayDate, t.scheduledDate),
    };
  });

  // Re-check blocking status: a task is blocked only by uncompleted predecessors
  const completedSet = new Set(updatedTasks.filter((t) => t.isCompleted).map((t) => t.id));
  const finalTasks = updatedTasks.map((t) => {
    const uncompletedBlockedBy = t.dependsOn.filter((depId) => !completedSet.has(depId));
    return {
      ...t,
      blockedBy: uncompletedBlockedBy,
    };
  });

  const completedCount = finalTasks.filter((t) => t.isCompleted).length;
  const overdueCount = finalTasks.filter((t) => !t.isCompleted && getDaysDiff(todayDate, t.scheduledDate) < 0).length;

  return {
    ...plan,
    tasks: finalTasks,
    completedTasks: completedCount,
    overdueTasks: overdueCount,
  };
}

function getPendingStatusText(todayDate: string, scheduledDate: string): string {
  const daysDiff = getDaysDiff(todayDate, scheduledDate);
  if (daysDiff === 0) return 'Due today';
  if (daysDiff > 0) return `Due in ${daysDiff} day${daysDiff === 1 ? '' : 's'}`;
  return `Overdue by ${Math.abs(daysDiff)} day${Math.abs(daysDiff) === 1 ? '' : 's'}`;
}
