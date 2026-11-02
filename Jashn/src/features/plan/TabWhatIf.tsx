'use client';

import React, { useMemo, useState } from 'react';
import { GeneratedEventPlan } from '@/domain/event-planner/types';
import { simulateWhatIf } from '@/domain/event-planner/what-if';

interface TabWhatIfProps {
  plan: GeneratedEventPlan;
  onApplyWhatIf: (newGuestCount: number, newTotalBudget: number) => void;
}

export const TabWhatIf: React.FC<TabWhatIfProps> = ({ plan, onApplyWhatIf }) => {
  const [simGuestCount, setSimGuestCount] = useState<number>(plan.input.guestCount);
  const [simBudget, setSimBudget] = useState<number>(plan.input.totalBudget);

  const diff = useMemo(() => {
    return simulateWhatIf(plan, simGuestCount, simBudget);
  }, [plan, simGuestCount, simBudget]);

  const hasChanges = simGuestCount !== plan.input.guestCount || simBudget !== plan.input.totalBudget;

  return (
    <div className="space-y-6">
      {/* 1. Simulation Controls */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1F2B] border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          &ldquo;What-If&rdquo; Scenario Simulator
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Experiment with adjusting your budget envelope or guest count. View instant delta comparisons before committing changes.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Guest Count Slider */}
          <div>
            <div className="flex justify-between items-center mb-1 text-sm font-bold text-slate-900 dark:text-white">
              <label htmlFor="sim-guest-input">Simulated Guest Count</label>
              <span className="text-base font-extrabold text-[#D78B13] dark:text-[#F5A524]">
                {simGuestCount} attendees
              </span>
            </div>
            <input
              id="sim-guest-input"
              type="range"
              min={Math.max(10, Math.round(plan.input.guestCount * 0.4))}
              max={Math.round(plan.input.guestCount * 2.2)}
              step={5}
              value={simGuestCount}
              onChange={(e) => setSimGuestCount(Number(e.target.value))}
              className="w-full accent-[#F5A524] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>Current: {plan.input.guestCount}</span>
              <span>Delta: {simGuestCount - plan.input.guestCount > 0 ? `+${simGuestCount - plan.input.guestCount}` : simGuestCount - plan.input.guestCount}</span>
            </div>
          </div>

          {/* Budget Slider */}
          <div>
            <div className="flex justify-between items-center mb-1 text-sm font-bold text-slate-900 dark:text-white">
              <label htmlFor="sim-budget-input">Simulated Total Budget</label>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                ₹{simBudget.toLocaleString('en-IN')}
              </span>
            </div>
            <input
              id="sim-budget-input"
              type="range"
              min={Math.round(plan.input.totalBudget * 0.5)}
              max={Math.round(plan.input.totalBudget * 2.0)}
              step={25000}
              value={simBudget}
              onChange={(e) => setSimBudget(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>Current: ₹{plan.input.totalBudget.toLocaleString('en-IN')}</span>
              <span>Delta: ₹{(simBudget - plan.input.totalBudget).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Simulation Explanatory Notes */}
      {diff && diff.explanatoryNotes.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-950 dark:text-amber-200 space-y-1">
          {diff.explanatoryNotes.map((note, idx) => (
            <div key={idx}>• {note}</div>
          ))}
        </div>
      )}

      {/* 3. Budget Line Diff Table */}
      {diff && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1F2B] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Category Allocation Diff
            </h4>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              New Contingency: ₹{diff.newContingency.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="space-y-3">
            {diff.budgetDeltas.map((item) => (
              <div
                key={item.categoryId}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-xs"
              >
                <span className="font-bold text-slate-800 dark:text-slate-200">{item.categoryName}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 line-through">₹{item.oldAmount.toLocaleString('en-IN')}</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{item.newAmount.toLocaleString('en-IN')}</span>
                  <span
                    className={`font-extrabold px-2 py-0.5 rounded ${
                      item.delta > 0
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                        : item.delta < 0
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                    }`}
                  >
                    {item.delta > 0 ? `+₹${item.delta.toLocaleString('en-IN')}` : item.delta < 0 ? `-₹${Math.abs(item.delta).toLocaleString('en-IN')}` : 'No Change'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              disabled={!hasChanges}
              onClick={() => onApplyWhatIf(simGuestCount, simBudget)}
              className="min-h-[46px] px-6 rounded-xl font-bold text-sm bg-[#F5A524] hover:bg-[#D78B13] disabled:opacity-50 text-[#14161C] shadow-md transition-all active:scale-95"
            >
              Apply Simulation to Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
