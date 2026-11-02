'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const PlanSidebarPreview: React.FC = () => {
  return (
    <aside
      aria-label="Plan overview and features preview"
      className="bg-white dark:bg-[#1C1F2B] rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 md:sticky md:top-28"
    >
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-serif sm:font-sans">
          Steps 2 and 3: Your plan
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
          When you create your plan it appears below the form, ready to review and track.
        </p>
      </div>

      <div className="space-y-3">
        {/* 1. Budget breakdown */}
        <div className="border-l-4 border-l-[#2E2A7A] dark:border-l-indigo-400 bg-slate-50 dark:bg-[#12141D] p-3.5 rounded-r-xl text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-200 border-y border-r border-slate-200 dark:border-slate-800">
          <strong className="font-semibold text-slate-900 dark:text-white block sm:inline">Budget breakdown</strong>{' '}
          that adds up exactly, with a tracker for spend.
        </div>

        {/* 2. Dated timeline */}
        <div className="border-l-4 border-l-rose-600 dark:border-l-rose-500 bg-slate-50 dark:bg-[#12141D] p-3.5 rounded-r-xl text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-200 border-y border-r border-slate-200 dark:border-slate-800">
          <strong className="font-semibold text-slate-900 dark:text-white block sm:inline">Dated timeline</strong>{' '}
          that adapts when your event is closer than ideal.
        </div>

        {/* 3. Vendor checklist */}
        <div className="border-l-4 border-l-emerald-600 dark:border-l-emerald-500 bg-slate-50 dark:bg-[#12141D] p-3.5 rounded-r-xl text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-200 border-y border-r border-slate-200 dark:border-slate-800">
          <strong className="font-semibold text-slate-900 dark:text-white block sm:inline">Vendor checklist</strong>{' '}
          with booking deadlines and questions to ask.
        </div>

        {/* 4. Personalised ideas */}
        <div className="border-l-4 border-l-purple-600 dark:border-l-purple-500 bg-slate-50 dark:bg-[#12141D] p-3.5 rounded-r-xl text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-200 border-y border-r border-slate-200 dark:border-slate-800">
          <strong className="font-semibold text-slate-900 dark:text-white block sm:inline">Personalised ideas</strong>{' '}
          based on your theme, guests and budget.
        </div>

        {/* 5. Ask the planner */}
        <div className="border-l-4 border-l-sky-600 dark:border-l-sky-500 bg-slate-50 dark:bg-[#12141D] p-3.5 rounded-r-xl text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-200 border-y border-r border-slate-200 dark:border-slate-800">
          <strong className="font-semibold text-slate-900 dark:text-white block sm:inline">Ask the planner</strong>{' '}
          for quick answers about your plan.
        </div>
      </div>

      {/* Privacy note */}
      <div className="pt-2">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#12141D] border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
          <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-500 shrink-0" />
          <span className="leading-relaxed">Your plan stays in this browser. Nothing is saved on the server.</span>
        </div>
      </div>
    </aside>
  );
};

export default PlanSidebarPreview;
