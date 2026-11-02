'use client';

import React from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { getUpcomingMilestones } from '@/domain/timeline';
import { CheckCircle2, Circle } from 'lucide-react';

export const TimelineCard: React.FC = () => {
  const { plan, toggleMilestone } = usePlannerStore();
  const upcoming = getUpcomingMilestones(plan.timeline, 6);

  const getChipStyle = (daysRemaining: number, isCompleted: boolean) => {
    if (isCompleted) {
      return 'bg-[#E3F5EA] text-[#0F6B3F] dark:bg-[#0F6B3F]/20 dark:text-[#E3F5EA]';
    }
    if (daysRemaining <= 7) {
      return 'bg-[#FFF1D6] text-[#7A4300] dark:bg-[#7A4300]/25 dark:text-[#FACF79]';
    }
    return 'bg-[#EEF0F6] text-[#3F4457] dark:bg-[#2C3040] dark:text-[#C9CCD8]';
  };

  const formatDueDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section
      aria-labelledby="timeline-heading"
      className="card bg-white dark:bg-[#1C1F2B] border border-[#E6E7EE] dark:border-[#2C3040] rounded-2xl p-6 shadow-sm"
    >
      <div className="flex justify-between items-center pb-2">
        <h2 id="timeline-heading" className="text-base font-bold text-[#14161C] dark:text-white">
          Next up
        </h2>
        <span className="text-xs text-[#5B6070] dark:text-[#C9CCD8]">
          Click item to toggle status
        </span>
      </div>

      <div className="divide-y divide-[#EEF0F6] dark:divide-[#2C3040] mt-2">
        {upcoming.map((item) => {
          const isDone = item.status === 'completed';
          const chipStyle = getChipStyle(item.daysRemaining, isDone);

          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => toggleMilestone(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleMilestone(item.id);
                }
              }}
              className="flex items-start gap-3 py-3.5 cursor-pointer hover:bg-[#F7F7FA] dark:hover:bg-[#242838] px-2 rounded-xl transition-colors text-sm"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 text-[#2E2A7A] dark:text-[#F5A524] flex-shrink-0"
              >
                {isDone ? (
                  <CheckCircle2 size={18} className="text-[#0F6B3F] dark:text-[#38A169]" />
                ) : (
                  <Circle size={18} className="text-[#D5D7E2] dark:text-[#5B6070]" />
                )}
              </span>

              <span
                className={`chip px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap self-start ${chipStyle}`}
              >
                {item.urgencyLabel}
              </span>

              <div className="flex-1 min-w-0">
                <strong
                  className={`block font-semibold ${
                    isDone
                      ? 'line-through text-[#5B6070] dark:text-[#7A8299]'
                      : 'text-[#14161C] dark:text-white'
                  }`}
                >
                  {item.title}
                </strong>
                {item.description && (
                  <div className="text-xs text-[#5B6070] dark:text-[#C9CCD8] mt-0.5 truncate">
                    {item.description}
                  </div>
                )}
              </div>

              <span className="text-xs font-medium text-[#5B6070] dark:text-[#C9CCD8] flex-shrink-0">
                {formatDueDate(item.dueDate)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
