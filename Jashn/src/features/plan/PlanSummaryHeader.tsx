'use client';

import React from 'react';
import { Download, Printer, Edit3, AlertTriangle, Plus } from 'lucide-react';
import { GeneratedEventPlan } from '@/domain/event-planner/types';

interface PlanSummaryHeaderProps {
  plan: GeneratedEventPlan;
  onExportText: () => void;
  onPrint: () => void;
  onEditDetails: () => void;
  onStartNewPlan: () => void;
}

export const PlanSummaryHeader: React.FC<PlanSummaryHeaderProps> = ({
  plan,
  onExportText,
  onPrint,
  onEditDetails,
  onStartNewPlan,
}) => {
  const { input, budget, timeline } = plan;

  // 1. Calculations
  const eventDateMs = new Date(`${input.eventDate}T00:00:00`).getTime();
  const diffDays = Math.ceil((eventDateMs - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
  const timeToGo = diffDays <= 0 ? 'Today' : diffDays >= 60 ? `${Math.floor(diffDays / 30)} months` : `${diffDays} days`;

  const budgetPerGuest = input.guestCount > 0 ? Math.round(budget.totalBudget / input.guestCount) : 0;
  const totalSpent = budget.categories.reduce((acc, c) => acc + (c.actualSpent || 0), 0) + (budget.contingencySpent || 0);
  const tasksDone = timeline.tasks.filter((t) => t.isCompleted).length;
  const totalTasks = timeline.totalTasks || timeline.tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 0;

  const dateObj = new Date(`${input.eventDate}T00:00:00`);
  const formattedDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : input.eventDate;
  const typeLabel = input.eventType === 'wedding' ? 'Wedding' : input.eventType === 'birthday' ? 'Birthday' : 'Celebration';

  return (
    <div className="space-y-6">
      {/* Event Title & Subtitle with Create New Event Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-serif sm:font-sans tracking-tight">
            {input.eventName}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1 font-medium">
            {typeLabel} on {formattedDate} with {input.guestCount} guests
          </p>
        </div>

        <button
          type="button"
          onClick={onStartNewPlan}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E2A7A] hover:bg-[#1E1B4B] text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-md active:scale-95 self-start sm:self-auto shrink-0 print:hidden"
        >
          <Plus size={16} className="text-[#FFD98A]" />
          <span>Create new event</span>
        </button>
      </div>

      {/* 4 Summary Stat Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 dark:bg-[#12141D] border border-indigo-100 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Time to go</div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#2E2A7A] dark:text-indigo-300 truncate">
            {timeToGo}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 dark:bg-[#12141D] border border-indigo-100 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Budget per guest</div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white truncate">
            ₹{budgetPerGuest.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 dark:bg-[#12141D] border border-indigo-100 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Spent so far</div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white truncate">
            ₹{totalSpent.toLocaleString('en-IN')}{' '}
            <span className="text-xs sm:text-sm font-normal text-slate-500">
              of ₹{budget.totalBudget.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 dark:bg-[#12141D] border border-indigo-100 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Tasks complete</div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white truncate">
            {tasksDone} <span className="text-xs sm:text-sm font-normal text-slate-500">of {totalTasks}</span>
          </div>
        </div>
      </div>

      {/* Planning Progress Bar */}
      <div>
        <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
          <span>Planning progress</span>
          <span className="text-slate-500 dark:text-slate-400">{progressPercent}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#2E2A7A] to-[#F5A524] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, Math.max(progressPercent, 4))}%` }}
          />
        </div>
      </div>

      {/* Celebration Readiness & Diagnosis */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#12141D] border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 dark:text-slate-200">
            Celebration Readiness Score:
          </span>
          <span className="font-extrabold text-[#2E2A7A] dark:text-[#FFD98A]">
            {plan.readiness.score}/100
          </span>
          <span className="text-slate-500">({plan.readiness.level})</span>
        </div>
        <div className="text-slate-600 dark:text-slate-300 text-xs">
          <strong>Status Diagnosis:</strong> {plan.readiness.plainLanguageReason}
        </div>
      </div>

      {/* Compressed Timeline Alert Callout */}
      {timeline.isCompressed && (
        <div
          role="status"
          className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-start gap-3"
        >
          <AlertTriangle className="text-[#D78B13] dark:text-[#F5A524] shrink-0 mt-0.5" size={18} />
          <p className="leading-relaxed">
            {timeline.compressionNotice ||
              'Your event is closer than the 53 weeks usually recommended, so the timeline has been compressed. Start with the vendors that have the longest lead times.'}
          </p>
        </div>
      )}

      {/* Actions Toolbar */}
      <div className="print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onExportText}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#12141D] text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-semibold text-xs sm:text-sm transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <Download size={15} />
            <span>Download as text</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#12141D] text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-semibold text-xs sm:text-sm transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <Printer size={15} />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={onEditDetails}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#12141D] text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-semibold text-xs sm:text-sm transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <Edit3 size={15} />
            <span>Edit details</span>
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          To keep a PDF copy, choose Save as PDF as the destination in the print window.
        </p>
      </div>
    </div>
  );
};
