'use client';

import React from 'react';
import { BudgetPlan, CategoryBudgetLine } from '@/domain/event-planner/types';

interface TabBudgetProps {
  budget: BudgetPlan;
  currency: string;
  onUpdateSpending: (categoryId: string, spentAmount: number) => void;
}

export const TabBudget: React.FC<TabBudgetProps> = ({
  budget,
  currency,
  onUpdateSpending,
}) => {
  const totalActual = budget.categories.reduce((acc, c) => acc + c.actualSpent, 0);
  const remainingBudget = budget.totalBudget - totalActual;

  return (
    <div className="space-y-6">
      {/* 1. Header Cards: Total, Contingency, Remaining */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1F2B] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Total Budget
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            ₹{budget.totalBudget.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-1">Planned allocation envelope</div>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-[#D78B13] dark:text-[#F5A524] mb-1">
            Contingency Buffer ({budget.contingencyPercent}%)
          </div>
          <div className="text-2xl font-extrabold text-[#D78B13] dark:text-[#F5A524]">
            ₹{budget.contingencyAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-amber-800/80 dark:text-amber-300 mt-1">Protected emergency reserve</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1F2B] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Actual Spending
          </div>
          <div className={`text-2xl font-extrabold ${remainingBudget < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            ₹{totalActual.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-semibold">
            {remainingBudget >= 0
              ? `₹${remainingBudget.toLocaleString('en-IN')} unspent`
              : `Over budget by ₹${Math.abs(remainingBudget).toLocaleString('en-IN')}`}
          </div>
        </div>
      </div>

      {/* 2. Interactive Spending Tracker Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1F2B] border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Category Allocation & Spending Tracker
        </h3>

        <div className="space-y-4">
          {budget.categories.map((cat) => {
            const diff = cat.actualSpent - cat.allocatedAmount;
            return (
              <div
                key={cat.categoryId}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      {cat.isPriority && <span className="text-[#F5A524] text-xs">⭐ Priority</span>}
                      {cat.categoryName}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Target: ₹{cat.allocatedAmount.toLocaleString('en-IN')} ({cat.sharePercent}%)
                    </span>
                  </div>

                  {/* Spending Input and Variance */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <label htmlFor={`spent-${cat.categoryId}`} className="text-xs font-semibold text-slate-500">
                        Spent: ₹
                      </label>
                      <input
                        id={`spent-${cat.categoryId}`}
                        type="number"
                        min={0}
                        value={cat.actualSpent || ''}
                        onChange={(e) => onUpdateSpending(cat.categoryId, Number(e.target.value) || 0)}
                        placeholder="0"
                        className="w-28 min-h-[36px] px-2.5 py-1 text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1C1F2B] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#F5A524]"
                      />
                    </div>

                    {/* Status Badge (Never Color Alone) */}
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-md shrink-0 ${
                        cat.actualSpent === 0
                          ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          : diff > 0
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                      }`}
                    >
                      {cat.varianceStatus}
                    </span>
                  </div>
                </div>

                {/* Visual Share Bar */}
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${cat.isPriority ? 'bg-[#F5A524]' : 'bg-indigo-600 dark:bg-indigo-400'}`}
                    style={{ width: `${Math.min(100, cat.sharePercent * 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Tier Comparison Diff Box */}
      {(budget.tierComparison?.leanDiffSummary || budget.tierComparison?.premiumDiffSummary) && (
        <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 text-xs text-indigo-950 dark:text-indigo-200 space-y-2">
          <div className="font-bold text-sm">💡 Tier Sensitivity Guide:</div>
          {budget.tierComparison.leanDiffSummary && (
            <div>• <strong>Lean Shift:</strong> {budget.tierComparison.leanDiffSummary}</div>
          )}
          {budget.tierComparison.premiumDiffSummary && (
            <div>• <strong>Premium Shift:</strong> {budget.tierComparison.premiumDiffSummary}</div>
          )}
        </div>
      )}
    </div>
  );
};
