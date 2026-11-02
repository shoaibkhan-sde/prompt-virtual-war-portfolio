'use client';

import React from 'react';
import { GeneratedEventPlan } from '@/domain/event-planner/types';

interface TabOverviewProps {
  plan: GeneratedEventPlan;
  onExportIcs: () => void;
  onDownloadText: () => void;
  onPrintChecklist: () => void;
  onCopyShareLink: () => void;
  onOpenClearDialog: () => void;
  shareCopied: boolean;
}

export const TabOverview: React.FC<TabOverviewProps> = ({
  plan,
  onExportIcs,
  onDownloadText,
  onPrintChecklist,
  onCopyShareLink,
  onOpenClearDialog,
  shareCopied,
}) => {
  const { readiness, budget, timeline, vendors, input } = plan;

  return (
    <div className="space-y-6">
      {/* 1. Readiness Score Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1F2B] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Celebration Readiness Score
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F5A524]/20 text-[#D78B13] dark:text-[#F5A524]">
                {readiness.level}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {readiness.score} <span className="text-base font-medium text-slate-400">/ 100</span>
            </h2>
          </div>

          {/* Quick Metrics */}
          <div className="flex gap-4">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 text-center min-w-[90px]">
              <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                {timeline.completedTasks}/{timeline.totalTasks}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Tasks Done</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 text-center min-w-[90px]">
              <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                {vendors.bookedVendors}/{vendors.totalVendors}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Vendors Locked</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-[#F5A524] to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${readiness.score}%` }}
          />
        </div>

        {/* Plain Language Reason */}
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          📋 <strong>Status Diagnosis:</strong> {readiness.plainLanguageReason}
        </p>

        {/* Breakdown Pills */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Milestones:</span>{' '}
            <strong className="text-slate-800 dark:text-slate-200">{readiness.breakdown.taskScore}/45 pts</strong>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Vendors:</span>{' '}
            <strong className="text-slate-800 dark:text-slate-200">{readiness.breakdown.vendorScore}/35 pts</strong>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Budget Health:</span>{' '}
            <strong className="text-slate-800 dark:text-slate-200">{readiness.breakdown.budgetScore}/20 pts</strong>
          </div>
        </div>
      </div>

      {/* 2. Timeline Compression Notice Banner (if applicable) */}
      {timeline.isCompressed && timeline.compressionNotice && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-sm text-blue-900 dark:text-blue-200 flex items-start gap-3"
        >
          <span className="text-xl">⚡</span>
          <div>
            <strong className="font-bold">Fast-Tracked Timeline:</strong> {timeline.compressionNotice}
          </div>
        </div>
      )}

      {/* 3. Action Toolbar */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#1C1F2B] border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
          Export & Collaboration Tools
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={onExportIcs}
            className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>📅</span> Export Calendar (.ics)
          </button>

          <button
            type="button"
            onClick={onPrintChecklist}
            className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>🖨️</span> Print Checklist
          </button>

          <button
            type="button"
            onClick={onDownloadText}
            className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>📄</span> Download Text
          </button>

          <button
            type="button"
            onClick={onCopyShareLink}
            className="min-h-[44px] px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-xs font-bold text-amber-900 dark:text-amber-200 hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>🔗</span> {shareCopied ? 'Link Copied!' : 'Share Plan Link'}
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <span>All plan state is stored purely inside your browser.</span>
          <button
            type="button"
            onClick={onOpenClearDialog}
            className="text-rose-600 dark:text-rose-400 font-bold hover:underline"
          >
            Clear Plan
          </button>
        </div>
      </div>
    </div>
  );
};
