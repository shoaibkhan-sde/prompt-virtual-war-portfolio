'use client';

import React, { useMemo } from 'react';
import { WizardDraftState } from './wizard-types';
import { getEventDefinition } from '@/domain/event-planner/registry';
import { computeLiveBudgetPreview } from '@/domain/event-planner/budget-math';
import { BudgetTier, ValidationError } from '@/domain/event-planner/types';

interface Step3MoneyPrioritiesProps {
  draft: WizardDraftState;
  onChange: (updates: Partial<WizardDraftState>) => void;
  errors: ValidationError[];
}

export const Step3MoneyPriorities: React.FC<Step3MoneyPrioritiesProps> = ({
  draft,
  onChange,
  errors,
}) => {
  const def = getEventDefinition(draft.eventType);
  const getError = (field: string) => errors.find((e) => e.field === field)?.message;

  const numBudget = Number(draft.totalBudget) || 0;

  // Live client-side budget preview without a server call!
  const livePreview = useMemo(() => {
    if (!draft.eventType || numBudget <= 0) return null;
    return computeLiveBudgetPreview(
      numBudget,
      draft.eventType,
      draft.budgetTier,
      draft.priorities,
      draft.venueType
    );
  }, [numBudget, draft.eventType, draft.budgetTier, draft.priorities, draft.venueType]);

  const handlePriorityToggle = (categoryId: string) => {
    const current = draft.priorities;
    if (current.includes(categoryId)) {
      onChange({ priorities: current.filter((id) => id !== categoryId) });
    } else if (current.length < 3) {
      onChange({ priorities: [...current, categoryId] });
    }
  };

  const isMaxPriorities = draft.priorities.length >= 3;

  return (
    <div className="space-y-6">
      {/* 1. Currency & Total Budget */}
      <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-4">
        <div>
          <label htmlFor="field-currency" className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
            Currency
          </label>
          <select
            id="field-currency"
            value={draft.currency}
            onChange={(e) => onChange({ currency: e.target.value })}
            className="w-full min-h-[46px] px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1C1F2B] text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-[#F5A524]"
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        <div>
          <label htmlFor="field-totalBudget" className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
            Target Total Budget <span className="text-rose-500">*</span>
          </label>
          <input
            id="field-totalBudget"
            type="number"
            min={1}
            step={500}
            value={draft.totalBudget}
            onChange={(e) => onChange({ totalBudget: e.target.value })}
            placeholder="e.g. 50000"
            aria-invalid={Boolean(getError('totalBudget'))}
            aria-describedby={getError('totalBudget') ? 'field-totalBudget-error' : 'field-totalBudget-desc'}
            className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1C1F2B] text-slate-900 dark:text-white font-bold text-lg focus:ring-2 focus:ring-[#F5A524] placeholder:text-slate-400 placeholder:text-sm placeholder:font-normal"
          />
          {getError('totalBudget') ? (
            <p id="field-totalBudget-error" className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {getError('totalBudget')}
            </p>
          ) : (
            <p id="field-totalBudget-desc" className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Enter any budget amount you wish to allocate.
            </p>
          )}
        </div>
      </div>

      {/* 2. Budget Tier */}
      <fieldset>
        <legend className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
          Experience Tier <span className="text-rose-500">*</span>
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['lean', 'standard', 'premium'] as BudgetTier[]).map((tier) => {
            const isSelected = draft.budgetTier === tier;
            return (
              <label
                key={tier}
                className={`p-3.5 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'border-[#F5A524] bg-amber-50/50 dark:bg-[#1C1F2B] ring-2 ring-[#F5A524]/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="budgetTier"
                    value={tier}
                    checked={isSelected}
                    onChange={() => onChange({ budgetTier: tier })}
                    className="w-4 h-4 text-[#F5A524] focus:ring-[#F5A524]"
                  />
                  <span className="font-bold text-sm text-slate-900 dark:text-white capitalize">{tier}</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {tier === 'lean' && 'Essential focus; trims excess decor and luxuries.'}
                  {tier === 'standard' && 'Balanced experience with professional partners.'}
                  {tier === 'premium' && 'Bespoke design, celebrity talent & high-touch hospitality.'}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* 3. Conditional Fest / Hackathon Fields */}
      {(def?.requiresSponsorshipTarget || def?.requiresPrizePool) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
          {def.requiresSponsorshipTarget && (
            <div>
              <label htmlFor="field-sponsorshipTarget" className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                Corporate Sponsorship Target (₹)
              </label>
              <input
                id="field-sponsorshipTarget"
                type="number"
                value={draft.sponsorshipTarget}
                onChange={(e) => onChange({ sponsorshipTarget: e.target.value })}
                placeholder="e.g. 500000"
                className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1C1F2B] text-slate-900 dark:text-white text-sm"
              />
            </div>
          )}
          {def.requiresPrizePool && (
            <div>
              <label htmlFor="field-prizePool" className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                Contest Prize Pool & Trophies (₹)
              </label>
              <input
                id="field-prizePool"
                type="number"
                value={draft.prizePool}
                onChange={(e) => onChange({ prizePool: e.target.value })}
                placeholder="e.g. 150000"
                className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1C1F2B] text-slate-900 dark:text-white text-sm"
              />
            </div>
          )}
        </div>
      )}

      {/* 4. Budget Priorities */}
      <fieldset>
        <legend className="block text-sm font-bold text-slate-900 dark:text-white mb-1">
          Top Celebration Priorities (Pick up to 3)
        </legend>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3" aria-live="polite">
          {isMaxPriorities
            ? '✓ Maximum 3 priorities selected. Other categories disabled to preserve allocation balance.'
            : `Selected ${draft.priorities.length} of 3. Chosen categories receive a 35% weight multiplier.`}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {def?.categories.map((cat) => {
            const isChecked = draft.priorities.includes(cat.id);
            const isDisabled = isMaxPriorities && !isChecked;
            return (
              <label
                key={cat.id}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm transition-all ${
                  isChecked
                    ? 'border-[#F5A524] bg-amber-50/60 dark:bg-[#1C1F2B] text-slate-900 dark:text-white font-semibold'
                    : isDisabled
                    ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 cursor-not-allowed opacity-60'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={() => handlePriorityToggle(cat.id)}
                  className="w-4 h-4 rounded text-[#F5A524] focus:ring-[#F5A524] disabled:cursor-not-allowed"
                />
                <span className="truncate">{cat.name}</span>
                {isChecked && <span className="ml-auto text-xs text-[#D78B13] font-bold">+35%</span>}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* 5. Live Budget Preview Card */}
      {livePreview && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-amber-50/40 dark:from-indigo-950/30 dark:to-slate-900/60 border border-indigo-200/80 dark:border-indigo-900/50 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Budget Split Preview
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
              Contingency: {livePreview.contingencyPercent}% (₹{livePreview.contingencyAmount.toLocaleString('en-IN')})
            </span>
          </div>

          <div className="space-y-2">
            {livePreview.categories.map((c) => (
              <div key={c.categoryId} className="text-xs">
                <div className="flex justify-between font-medium text-slate-800 dark:text-slate-200 mb-0.5">
                  <span className="truncate pr-2">
                    {c.isPriority ? '⭐ ' : ''}{c.categoryName}
                  </span>
                  <span className="font-bold shrink-0">
                    ₹{c.allocatedAmount.toLocaleString('en-IN')} ({c.sharePercent}%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      c.isPriority ? 'bg-[#F5A524]' : 'bg-indigo-600 dark:bg-indigo-400'
                    }`}
                    style={{ width: `${Math.min(100, c.sharePercent * 2.2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Theme and Interests */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="field-theme" className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
            Celebration Theme / Motif (Optional)
          </label>
          <input
            id="field-theme"
            type="text"
            maxLength={60}
            value={draft.theme}
            onChange={(e) => onChange({ theme: e.target.value })}
            placeholder="e.g. Royal Twilight / Boho Garden"
            className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1C1F2B] text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-[#F5A524] placeholder:text-slate-400"
          />
        </div>
        <div>
          <label htmlFor="field-interests" className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
            Key Focus Areas / Interests (Comma-separated)
          </label>
          <input
            id="field-interests"
            type="text"
            value={draft.interests}
            onChange={(e) => onChange({ interests: e.target.value })}
            placeholder="e.g. Photography, Folk Band, Drone"
            className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1C1F2B] text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-[#F5A524] placeholder:text-slate-400"
          />
        </div>
      </div>
    </div>
  );
};
