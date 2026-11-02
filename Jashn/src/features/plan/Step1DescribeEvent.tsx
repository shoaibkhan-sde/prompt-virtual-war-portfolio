'use client';

import React from 'react';
import { Loader2, Sparkles, RotateCcw } from 'lucide-react';
import { WizardDraftState } from './wizard-types';
import { ValidationError } from '@/domain/event-planner/types';
import { Step1BasicsSection } from './Step1BasicsSection';
import { Step1BudgetPersonalSection } from './Step1BudgetPersonalSection';

interface Step1DescribeEventProps {
  draft: WizardDraftState;
  onChange: (updates: Partial<WizardDraftState>) => void;
  errors: ValidationError[];
  onSubmit: () => void;
  onClearDraft?: () => void;
  isSubmitting: boolean;
  isEditing?: boolean;
  onCancelEdit?: () => void;
}

export const Step1DescribeEvent: React.FC<Step1DescribeEventProps> = ({
  draft,
  onChange,
  errors,
  onSubmit,
  onClearDraft,
  isSubmitting,
  isEditing,
  onCancelEdit,
}) => {
  return (
    <div className="bg-white dark:bg-[#1C1F2B] rounded-2xl p-6 sm:p-8 lg:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
      {/* Step Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-serif sm:font-sans">
          {isEditing ? 'Edit event details' : 'Step 1: Event details'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
          {isEditing
            ? 'Update your celebration parameters below to recalculate and refresh your blueprint.'
            : 'Tell us about your celebration. Fields marked required are needed to build your deterministic blueprint.'}
        </p>
      </div>

      {/* Part 1: The Basics */}
      <Step1BasicsSection draft={draft} onChange={onChange} errors={errors} />

      {/* Part 2: Budget & Part 3: Personalization */}
      <Step1BudgetPersonalSection draft={draft} onChange={onChange} errors={errors} />

      {/* Action Bar */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Primary Action Button */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="bg-[#2E2A7A] hover:bg-[#1E1B4B] active:bg-[#171445] text-white font-medium py-3 px-6 rounded-xl shadow-lg shadow-indigo-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 size={18} className="animate-spin text-white" />
          ) : (
            <Sparkles size={17} className="text-[#FFD98A]" />
          )}
          <span>
            {isSubmitting
              ? 'Building your blueprint…'
              : isEditing
              ? 'Save & update plan'
              : 'Create my plan'}
          </span>
        </button>

        {/* Secondary Action Button */}
        {onCancelEdit ? (
          <button
            type="button"
            onClick={onCancelEdit}
            disabled={isSubmitting}
            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 font-medium py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <span>Cancel editing</span>
          </button>
        ) : onClearDraft ? (
          <button
            type="button"
            onClick={onClearDraft}
            disabled={isSubmitting}
            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 font-medium py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RotateCcw size={15} />
            <span>Clear saved plan</span>
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default Step1DescribeEvent;
