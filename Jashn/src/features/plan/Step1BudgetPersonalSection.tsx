'use client';

import React from 'react';
import { Wallet, Sparkles } from 'lucide-react';
import { WizardDraftState } from './wizard-types';
import { ValidationError } from '@/domain/event-planner/types';
import { BudgetPrioritiesGrid } from './BudgetPrioritiesGrid';

interface Step1BudgetPersonalSectionProps {
  draft: WizardDraftState;
  onChange: (updates: Partial<WizardDraftState>) => void;
  errors: ValidationError[];
}

export const Step1BudgetPersonalSection: React.FC<Step1BudgetPersonalSectionProps> = ({
  draft,
  onChange,
  errors,
}) => {
  const getError = (field: string) => errors.find((e) => e.field === field)?.message;

  const handlePriorityToggle = (prioId: string) => {
    const current = draft.priorities || [];
    if (current.includes(prioId)) {
      onChange({ priorities: current.filter((id) => id !== prioId) });
    } else if (current.length < 3) {
      onChange({ priorities: [...current, prioId] });
    }
  };

  return (
    <>
      {/* Part 2: Budget */}
      <section aria-labelledby="section-budget" className="space-y-6 pt-8 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-[#2E2A7A] dark:text-[#FFD98A] flex items-center justify-center shrink-0 shadow-xs">
            <Wallet size={20} />
          </div>
          <div>
            <h3 id="section-budget" className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Budget
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Deterministic allocation with zero variance across all category envelopes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-5">
          <div>
            <label htmlFor="field-currency" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Currency
            </label>
            <select
              id="field-currency"
              value={draft.currency}
              onChange={(e) => onChange({ currency: e.target.value })}
              aria-describedby="desc-currency"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#12141D] text-slate-900 dark:text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#2E2A7A] dark:focus:ring-[#F5A524] focus:border-transparent transition-all [color-scheme:light] dark:[color-scheme:dark]"
            >
              <option value="INR">INR - Indian Rupee</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
            <p id="desc-currency" className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Applied to all category envelopes.
            </p>
          </div>

          <div>
            <label htmlFor="field-totalBudget" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Total budget <span className="text-rose-500 dark:text-rose-400 font-medium text-xs">(required)</span>
            </label>
            <input
              id="field-totalBudget"
              type="number"
              step={1000}
              value={draft.totalBudget}
              onChange={(e) => onChange({ totalBudget: e.target.value })}
              placeholder="e.g. 1800000"
              aria-describedby="desc-totalBudget"
              aria-invalid={Boolean(getError('totalBudget'))}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#12141D] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#2E2A7A] dark:focus:ring-[#F5A524] focus:border-transparent transition-all"
            />
            <p id="desc-totalBudget" className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              The full expenditure cap you are prepared to spend.
            </p>
            {getError('totalBudget') && <p className="text-xs text-rose-500 mt-1 font-medium">{getError('totalBudget')}</p>}
          </div>
        </div>

        {/* Budget Priorities Toggle Chips */}
        <BudgetPrioritiesGrid
          selectedPriorities={draft.priorities || []}
          onToggle={handlePriorityToggle}
        />
      </section>

      {/* Part 3: Make it personal */}
      <section aria-labelledby="section-personal" className="space-y-6 pt-8 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-[#2E2A7A] dark:text-[#FFD98A] flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 id="section-personal" className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Make it personal
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customize local flavor, ambiance styling, and curated guest experiences.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="field-city" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              City or area
            </label>
            <input
              id="field-city"
              type="text"
              value={draft.city}
              onChange={(e) => onChange({ city: e.target.value })}
              placeholder="e.g. Udaipur, Rajasthan or South Mumbai"
              aria-describedby="desc-city"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#12141D] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#2E2A7A] dark:focus:ring-[#F5A524] focus:border-transparent transition-all"
            />
            <p id="desc-city" className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Optional. Host city or locality for tailored timeline deadlines.
            </p>
          </div>

          <div>
            <label htmlFor="field-theme" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Theme or style
            </label>
            <input
              id="field-theme"
              type="text"
              value={draft.theme}
              onChange={(e) => onChange({ theme: e.target.value })}
              placeholder="e.g. Royal Marwar Heritage, Live Acoustic, Boho Pastel Elegance"
              aria-describedby="desc-theme"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#12141D] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#2E2A7A] dark:focus:ring-[#F5A524] focus:border-transparent transition-all"
            />
            <p id="desc-theme" className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Optional. Creative aesthetic, such as Regal Heritage or Modern Minimalist.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="field-interests" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Interests and preferences
          </label>
          <textarea
            id="field-interests"
            rows={3}
            value={draft.interests}
            onChange={(e) => onChange({ interests: e.target.value })}
            placeholder="e.g. Live Rajasthani folk fusion, gourmet street food chaat counters, drone cinematography, marigold floral arches..."
            aria-describedby="desc-interests"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#12141D] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#2E2A7A] dark:focus:ring-[#F5A524] focus:border-transparent transition-all"
          />
          <p id="desc-interests" className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            Optional. Key culinary, musical, decor, or entertainment wishes used to craft bespoke vendor recommendations.
          </p>
        </div>
      </section>
    </>
  );
};

export default Step1BudgetPersonalSection;
