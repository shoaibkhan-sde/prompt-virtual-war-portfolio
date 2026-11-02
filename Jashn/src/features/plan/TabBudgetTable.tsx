'use client';

import React from 'react';
import { BudgetPlan } from '@/domain/event-planner/types';

interface TabBudgetTableProps {
  budget: BudgetPlan;
  currency: string;
  onUpdateSpending: (categoryId: string, spentAmount: number) => void;
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  venue_hospitality: 'Ceremony and reception space, furniture, lighting.',
  culinary_feasts: 'Meals, drinks, cake and service staff.',
  floral_ambience: 'Florals, centrepieces, signage and styling.',
  visual_storytelling: 'Photographer, videographer and albums.',
  attire_jewels: 'Outfits, alterations, hair and makeup.',
  sound_revelry: 'DJ or band, sound system, performers.',
  venue: 'Ceremony and reception space, furniture, lighting.',
  food: 'Meals, drinks, cake and service staff.',
  photo: 'Photographer, videographer and albums.',
  decor: 'Florals, centrepieces, signage and styling.',
  music: 'DJ or band, sound system, performers.',
  attire: 'Outfits, alterations, hair and makeup.',
  invitations: 'Save-the-dates, invitations, programmes.',
  transport: 'Guest shuttles, couple transport, accommodation.',
};

export const TabBudgetTable: React.FC<TabBudgetTableProps> = ({
  budget,
  currency,
  onUpdateSpending,
}) => {
  const totalActual =
    budget.categories.reduce((acc, c) => acc + (c.actualSpent || 0), 0) +
    (budget.contingencySpent || 0);
  const remainingBudget = budget.totalBudget - totalActual;

  return (
    <div className="space-y-6">
      {/* Title & Explanatory Subtitle */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-serif sm:font-sans">
          Budget breakdown
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
          Amounts add up exactly to your total. Enter what you spend in each category to see how much remains.
        </p>
      </div>

      {/* Responsive Budget Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1C1F2B] shadow-xs">
        <table className="w-full text-left border-collapse min-w-[620px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-[#14161F] text-xs font-bold text-slate-700 dark:text-slate-300">
              <th scope="col" className="py-3.5 px-4 sm:px-6">Category</th>
              <th scope="col" className="py-3.5 px-4 text-center">Share</th>
              <th scope="col" className="py-3.5 px-4 text-right">Planned</th>
              <th scope="col" className="py-3.5 px-4 text-center">Spent so far</th>
              <th scope="col" className="py-3.5 px-4 sm:px-6 text-right">Remaining</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
            {budget.categories.map((cat) => {
              const diff = cat.allocatedAmount - (cat.actualSpent || 0);
              const remainingText = diff >= 0 ? `₹${diff.toLocaleString('en-IN')} left` : `₹${Math.abs(diff).toLocaleString('en-IN')} over`;
              const desc = CATEGORY_DESCRIPTIONS[cat.categoryId] || 'Tailored allocation envelope for this celebration area.';

              return (
                <tr key={cat.categoryId} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white">{cat.categoryName}</span>
                      {cat.isPriority && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-300 dark:border-indigo-500/60 text-[#2E2A7A] dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40">
                          Priority
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{cat.sharePercent}%</td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="font-semibold text-slate-900 dark:text-white">₹{cat.allocatedAmount.toLocaleString('en-IN')}</div>
                    <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full ml-auto mt-1 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#2E2A7A] to-purple-500 rounded-full" style={{ width: `${Math.min(100, cat.sharePercent * 2.5)}%` }} />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <input
                      type="number"
                      min={0}
                      aria-label={`Spent for ${cat.categoryName}`}
                      value={cat.actualSpent || ''}
                      onChange={(e) => onUpdateSpending(cat.categoryId, Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-28 sm:w-32 px-3 py-1.5 text-center text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#12141D] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#F5A524] transition-all [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                    <span className={`font-semibold text-xs sm:text-sm ${diff < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {remainingText}
                    </span>
                  </td>
                </tr>
              );
            })}

            {/* Contingency Reserve Row */}
            {budget.contingencyAmount > 0 && (
              <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-900/30 transition-colors">
                <td className="py-4 px-4 sm:px-6">
                  <div className="font-bold text-slate-900 dark:text-white">Contingency reserve</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Held back for price changes and surprises.
                  </div>
                </td>
                <td className="py-4 px-4 text-center font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {budget.contingencyPercent}%
                </td>
                <td className="py-4 px-4 text-right whitespace-nowrap">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    ₹{budget.contingencyAmount.toLocaleString('en-IN')}
                  </div>
                  <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full ml-auto mt-1 overflow-hidden">
                    <div className="h-full bg-purple-400 rounded-full w-full" />
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <input
                    type="number"
                    min={0}
                    aria-label="Spent for Contingency reserve"
                    value={budget.contingencySpent || ''}
                    onChange={(e) => onUpdateSpending('contingency', Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-28 sm:w-32 px-3 py-1.5 text-center text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#12141D] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#F5A524] transition-all [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </td>
                <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap font-semibold text-slate-700 dark:text-slate-200 text-xs sm:text-sm">
                  {(() => {
                    const diff = budget.contingencyAmount - (budget.contingencySpent || 0);
                    return (
                      <span className={diff < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}>
                        {diff >= 0 ? `₹${diff.toLocaleString('en-IN')} left` : `₹${Math.abs(diff).toLocaleString('en-IN')} over`}
                      </span>
                    );
                  })()}
                </td>
              </tr>
            )}
          </tbody>

          {/* Table Footer / Total Row */}
          <tfoot>
            <tr className="border-t-2 border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-[#14161F] font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
              <td className="py-4 px-4 sm:px-6">Total</td>
              <td className="py-4 px-4 text-center">100%</td>
              <td className="py-4 px-4 text-right">
                ₹{budget.totalBudget.toLocaleString('en-IN')}
              </td>
              <td className="py-4 px-4 text-center">
                ₹{totalActual.toLocaleString('en-IN')}
              </td>
              <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                <span
                  className={
                    remainingBudget < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-900 dark:text-white'
                  }
                >
                  {remainingBudget >= 0
                    ? `₹${remainingBudget.toLocaleString('en-IN')} left`
                    : `₹${Math.abs(remainingBudget).toLocaleString('en-IN')} over`}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default TabBudgetTable;
