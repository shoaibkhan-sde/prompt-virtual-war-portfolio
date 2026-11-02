'use client';

import React from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { calculateBudgetTotals } from '@/domain/budget';
import { formatINR } from '@/domain/format';

export const BudgetCard: React.FC = () => {
  const { plan } = usePlannerStore();
  const totals = calculateBudgetTotals(
    plan.totalBudget,
    plan.items,
    plan.guests.length,
    plan.reservePercentage
  );

  const spentPercent =
    totals.totalBudget > 0
      ? Math.round((totals.totalSpent / totals.totalBudget) * 100)
      : 0;

  return (
    <section
      aria-labelledby="budget-heading"
      className="card bg-white dark:bg-[#1C1F2B] border border-[#E6E7EE] dark:border-[#2C3040] rounded-2xl p-6 shadow-sm"
    >
      <div className="flex justify-between items-start flex-wrap gap-3 pb-3 border-b border-[#EEF0F6] dark:border-[#2C3040]">
        <div>
          <h2 id="budget-heading" className="text-base font-bold text-[#14161C] dark:text-white">
            Budget
          </h2>
          <div className="text-xs sm:text-sm text-[#5B6070] dark:text-[#C9CCD8] mt-1">
            {formatINR(totals.costPerGuest)} per guest · {totals.reservePercentage}% reserve protected ({formatINR(totals.reserveAmount)})
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl sm:text-3xl font-extrabold text-[#14161C] dark:text-white">
            {formatINR(totals.totalSpent)}{' '}
            <span className="text-sm font-medium text-[#5B6070] dark:text-[#C9CCD8]">
              of {formatINR(totals.totalBudget)}
            </span>
          </div>
          <div className="text-xs font-semibold text-[#5B6070] dark:text-[#C9CCD8]">
            {spentPercent}% spent
          </div>
        </div>
      </div>

      {/* Category Progress Rows */}
      <div className="mt-4 space-y-3">
        {totals.categories.map((cat) => {
          const fillWidth = `${Math.min(100, Math.max(0, cat.percentageSpent))}%`;
          return (
            <div
              key={cat.category}
              className="brow grid grid-cols-[110px_1fr_160px] gap-4 items-center text-sm py-1.5"
            >
              <span className="font-medium text-[#14161C] dark:text-white truncate">
                {cat.name}
              </span>

              <div
                className="track h-2.5 bg-[#EEF0F6] dark:bg-[#2C3040] rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={cat.percentageSpent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${cat.name} budget spent`}
              >
                <div
                  className="fill h-full bg-[#2E2A7A] dark:bg-[#F5A524] rounded-full transition-all duration-500"
                  style={{ width: fillWidth }}
                />
              </div>

              <span className="text-xs sm:text-sm font-medium text-[#5B6070] dark:text-[#C9CCD8] text-right truncate">
                {formatINR(cat.spent)} / {formatINR(cat.allocated)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Safety contingency buffer notice */}
      <div className="mt-5 pt-3 border-t border-[#EEF0F6] dark:border-[#2C3040] flex justify-between items-center text-xs text-[#5B6070] dark:text-[#C9CCD8]">
        <span>Effective Available (after reserve):</span>
        <strong className="text-[#0F6B3F] dark:text-[#E3F5EA] font-bold">
          {formatINR(totals.effectiveAvailable)}
        </strong>
      </div>
    </section>
  );
};
