'use client';

import React from 'react';
import { Check, Plus } from 'lucide-react';

interface BudgetPrioritiesGridProps {
  selectedPriorities: string[];
  onToggle: (id: string) => void;
}

const PRIORITY_OPTIONS = [
  { id: 'venue', label: 'Venue and rentals' },
  { id: 'food', label: 'Food and beverage' },
  { id: 'photo', label: 'Photography and video' },
  { id: 'decor', label: 'Decor and flowers' },
  { id: 'music', label: 'Music and entertainment' },
  { id: 'attire', label: 'Attire and beauty' },
  { id: 'invitations', label: 'Invitations and stationery' },
  { id: 'transport', label: 'Transport and stay' },
];

export const BudgetPrioritiesGrid: React.FC<BudgetPrioritiesGridProps> = ({
  selectedPriorities,
  onToggle,
}) => {
  const isMax = selectedPriorities.length >= 3;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Budget priorities
        </label>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
          {selectedPriorities.length} / 3 selected
        </span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5 leading-relaxed">
        Choose up to three key areas that should receive a larger share of the total budget.
      </p>

      {/* Pill-shaped Interactive Toggle Chips */}
      <div className="flex flex-wrap gap-2.5">
        {PRIORITY_OPTIONS.map((opt) => {
          const isSelected = selectedPriorities.includes(opt.id);
          const isDisabled = isMax && !isSelected;

          return (
            <button
              type="button"
              key={opt.id}
              disabled={isDisabled}
              onClick={() => onToggle(opt.id)}
              aria-pressed={isSelected}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-[#2E2A7A] dark:bg-[#2E2A7A] border border-[#2E2A7A] dark:border-[#F5A524]/60 text-white shadow-sm ring-2 ring-[#2E2A7A]/25 dark:ring-[#F5A524]/25 active:scale-95'
                  : isDisabled
                  ? 'border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-600 opacity-50 cursor-not-allowed'
                  : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#12141D] text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-95'
              }`}
            >
              {isSelected ? (
                <Check size={14} strokeWidth={2.5} className="text-white shrink-0" />
              ) : (
                <Plus size={14} className="text-slate-400 dark:text-slate-400 shrink-0" />
              )}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetPrioritiesGrid;
