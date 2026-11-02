'use client';

import React from 'react';
import { Calendar, Users, Wallet, CheckCircle2, ArrowRight, Trash2, Edit3, MapPin } from 'lucide-react';
import { GeneratedEventPlan } from '@/domain/event-planner/types';

interface EventCardProps {
  plan: GeneratedEventPlan;
  onOpen: (plan: GeneratedEventPlan) => void;
  onEdit: (plan: GeneratedEventPlan) => void;
  onDeleteRequest: (plan: GeneratedEventPlan) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  plan,
  onOpen,
  onEdit,
  onDeleteRequest,
}) => {
  const { input, budget, timeline, readiness } = plan;

  const eventDateMs = new Date(`${input.eventDate}T00:00:00`).getTime();
  const diffDays = Math.ceil((eventDateMs - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
  const timeToGo = diffDays <= 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`;

  const dateObj = new Date(`${input.eventDate}T00:00:00`);
  const formattedDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : input.eventDate;

  const tasksDone = timeline.tasks.filter((t) => t.isCompleted).length;
  const totalTasks = timeline.totalTasks || timeline.tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 0;
  const totalSpent = budget.categories.reduce((acc, c) => acc + (c.actualSpent || 0), 0) + (budget.contingencySpent || 0);

  const typeLabels: Record<string, string> = {
    wedding: 'Wedding',
    birthday: 'Birthday',
    community_event: 'Festival',
    tech_meetup: 'Tech Meetup',
    hackathon: 'Hackathon',
    college_fest: 'College Fest',
  };
  const typeLabel = typeLabels[input.eventType] || 'Celebration';

  return (
    <article className="flex flex-col rounded-2xl bg-white dark:bg-[#1C1F2B] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all duration-200 overflow-hidden group">
      {/* Top Banner Accent */}
      <div className="h-2 w-full bg-gradient-to-r from-[#2E2A7A] via-[#B83280] to-[#F5A524]" />

      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-5">
        {/* Header: Title & Badges */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-[#2E2A7A] dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
              {typeLabel}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {timeToGo}
            </span>
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-3 font-serif sm:font-sans tracking-tight group-hover:text-[#2E2A7A] dark:group-hover:text-[#FFD98A] transition-colors line-clamp-1">
            {input.eventName}
          </h3>

          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400" />
              <span>{formattedDate}</span>
            </div>
            {input.city && (
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-slate-400" />
                <span>{input.city}</span>
              </div>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 py-3 border-y border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#14161F]">
            <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1 font-medium">
              <Users size={13} />
              <span>Guests</span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {input.guestCount}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#14161F]">
            <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1 font-medium">
              <Wallet size={13} />
              <span>Total Budget</span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
              ₹{budget.totalBudget.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#14161F]">
            <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1 font-medium">
              <Wallet size={13} />
              <span>Spent so far</span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
              ₹{totalSpent.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#14161F]">
            <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1 font-medium">
              <CheckCircle2 size={13} />
              <span>Readiness</span>
            </div>
            <div className="text-sm font-bold text-[#2E2A7A] dark:text-[#FFD98A]">
              {readiness?.score ?? 0}/100
            </div>
          </div>
        </div>

        {/* Planning Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-medium text-slate-600 dark:text-slate-300">
            <span>Tasks completed</span>
            <span>{tasksDone} of {totalTasks} ({progressPercent}%)</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#2E2A7A] to-[#F5A524] rounded-full transition-all duration-300"
              style={{ width: `${Math.max(progressPercent, 4)}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => onOpen(plan)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#2E2A7A] hover:bg-[#1E1B4B] text-white text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <span>Open Plan</span>
            <ArrowRight size={14} className="text-[#FFD98A]" />
          </button>

          <button
            type="button"
            onClick={() => onEdit(plan)}
            aria-label={`Edit ${input.eventName}`}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Edit event details"
          >
            <Edit3 size={16} />
          </button>

          <button
            type="button"
            onClick={() => onDeleteRequest(plan)}
            aria-label={`Delete ${input.eventName}`}
            className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            title="Delete event"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </article>
  );
};
