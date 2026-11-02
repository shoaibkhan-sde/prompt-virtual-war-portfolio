'use client';

import React from 'react';
import { TimelinePlan, TimelineTask } from '@/domain/event-planner/types';

interface TabTimelineProps {
  timeline: TimelinePlan;
  onToggleTask: (taskId: string, isCompleted: boolean) => void;
}

const PHASE_LABELS: Record<string, string> = {
  foundations: '1. Foundations & Clearances',
  booking: '2. Vendor Bookings & Contracts',
  details: '3. Details, Invites & Styling',
  final_week: '4. Final Week Rehearsals & Walkthrough',
  event_day: '5. Event Day Execution',
  after: '6. Post-Event Wrap & Settlements',
};

export const TabTimeline: React.FC<TabTimelineProps> = ({
  timeline,
  onToggleTask,
}) => {
  // Group tasks by phase
  const phases = ['foundations', 'booking', 'details', 'final_week', 'event_day', 'after'] as const;

  return (
    <div className="space-y-6">
      {/* Overview Stat Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1F2B] border border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm">
        <div className="flex gap-4">
          <span>
            Total Milestones: <strong>{timeline.totalTasks}</strong>
          </span>
          <span>
            Completed: <strong className="text-emerald-600">{timeline.completedTasks}</strong>
          </span>
          {timeline.overdueTasks > 0 && (
            <span className="text-rose-600 font-bold">
              Overdue: {timeline.overdueTasks}
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500">Tick items as you execute</div>
      </div>

      {phases.map((phaseKey) => {
        const tasksInPhase = timeline.tasks.filter((t) => t.phase === phaseKey);
        if (tasksInPhase.length === 0) return null;

        return (
          <div
            key={phaseKey}
            className="p-5 rounded-3xl bg-white dark:bg-[#1C1F2B] border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              {PHASE_LABELS[phaseKey] || phaseKey}
            </h3>

            <div className="space-y-3">
              {tasksInPhase.map((task) => {
                const isBlocked = task.blockedBy && task.blockedBy.length > 0;
                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      task.isCompleted
                        ? 'border-emerald-200 dark:border-emerald-950 bg-emerald-50/30 dark:bg-emerald-950/10'
                        : isBlocked
                        ? 'border-amber-200 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={`task-${task.id}`}
                        checked={task.isCompleted}
                        onChange={(e) => onToggleTask(task.id, e.target.checked)}
                        className="w-5 h-5 mt-0.5 rounded text-[#F5A524] focus:ring-[#F5A524] cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <label
                            htmlFor={`task-${task.id}`}
                            className={`text-sm font-bold cursor-pointer ${
                              task.isCompleted
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {task.title}
                          </label>

                          {task.isCriticalPath && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200">
                              Critical Path
                            </span>
                          )}

                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded ${
                              task.isCompleted
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                                : task.statusText.includes('Overdue')
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {task.statusText}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                          <span>Target: {task.scheduledDate}</span>
                          {isBlocked && (
                            <span className="text-amber-700 dark:text-amber-300 font-medium">
                              ⚠️ Waiting on prerequisite task ({task.blockedBy?.length} pending)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
