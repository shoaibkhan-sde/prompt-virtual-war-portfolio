import { describe, it, expect } from 'vitest';
import { computeTimelinePlan, updateTaskCompletion } from '@/domain/event-planner/timeline-math';
import { getEventDefinition } from '@/domain/event-planner/registry';

describe('domain/event-planner/timeline-math', () => {
  const weddingDef = getEventDefinition('wedding')!;
  const today = '2026-11-01';

  it('generates chronological milestone tasks with standard lead time', () => {
    // 200 days ahead (standard wedding is 180 days)
    const eventDate = '2027-05-20';
    const plan = computeTimelinePlan(eventDate, today, weddingDef, 'indoor');

    expect(plan.isCompressed).toBe(false);
    expect(plan.compressionNotice).toBeUndefined();
    expect(plan.tasks.length).toBe(weddingDef.tasks.length);

    // Verify all scheduled dates are valid YYYY-MM-DD strings
    for (const task of plan.tasks) {
      expect(task.scheduledDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(task.isCompleted).toBe(false);
    }
  });

  it('scales and compresses tasks proportionally when event date is tighter than recommended lead time', () => {
    // 18 days ahead vs 180 days recommended (10x compression)
    const eventDate = '2026-11-19';
    const plan = computeTimelinePlan(eventDate, today, weddingDef, 'indoor');

    expect(plan.isCompressed).toBe(true);
    expect(plan.compressionNotice).toContain('Timeline compressed');

    // Pre-event tasks should all be clamped between today and eventDate
    for (const task of plan.tasks) {
      if (task.offsetDays <= 0) {
        expect(task.scheduledDate >= today).toBe(true);
        expect(task.scheduledDate <= eventDate).toBe(true);
      }
    }
  });

  it('preserves DAG dependencies and dynamically resolves blocking tasks', () => {
    const eventDate = '2027-06-01';
    let plan = computeTimelinePlan(eventDate, today, weddingDef, 'indoor');

    const firstTask = plan.tasks[0];
    const secondTask = plan.tasks[1];

    expect(secondTask.dependsOn).toContain(firstTask.id);
    expect(secondTask.blockedBy).toContain(firstTask.id);

    // Mark first task as completed
    plan = updateTaskCompletion(plan, firstTask.id, true, today);

    const updatedFirst = plan.tasks.find((t) => t.id === firstTask.id)!;
    const updatedSecond = plan.tasks.find((t) => t.id === secondTask.id)!;

    expect(updatedFirst.isCompleted).toBe(true);
    expect(updatedFirst.statusText).toBe('Done');
    // Second task should no longer be blocked by firstTask
    expect(updatedSecond.blockedBy).not.toContain(firstTask.id);
  });

  it('appends weather-backup task for outdoor venues', () => {
    const eventDate = '2027-06-01';
    const indoorPlan = computeTimelinePlan(eventDate, today, weddingDef, 'indoor');
    const outdoorPlan = computeTimelinePlan(eventDate, today, weddingDef, 'outdoor');

    expect(outdoorPlan.tasks.length).toBe(indoorPlan.tasks.length + 1);
    const weatherTask = outdoorPlan.tasks.find((t) => t.id.includes('weather'));
    expect(weatherTask).toBeDefined();
    expect(weatherTask?.title).toContain('weather forecast');
  });
});
