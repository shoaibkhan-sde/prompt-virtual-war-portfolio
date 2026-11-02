'use client';

import React from 'react';
import { WizardStepNumber } from './wizard-types';

interface StepIndicatorProps {
  currentStep: WizardStepNumber;
  onStepClick: (step: WizardStepNumber) => void;
  maxAccessibleStep: WizardStepNumber;
}

const STEPS: { number: WizardStepNumber; title: string; subtitle: string }[] = [
  { number: 1, title: 'Basics', subtitle: 'Type, title & dates' },
  { number: 2, title: 'Venue & Audience', subtitle: 'Setting & guests' },
  { number: 3, title: 'Money & Priorities', subtitle: 'Budget & focus' },
  { number: 4, title: 'Review', subtitle: 'Confirm & plan' },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  onStepClick,
  maxAccessibleStep,
}) => {
  return (
    <nav aria-label="Celebration Wizard Steps" className="mb-10">
      <ol className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {STEPS.map((step) => {
          const isCurrent = step.number === currentStep;
          const isCompleted = step.number < currentStep;
          const isClickable = step.number <= maxAccessibleStep;

          return (
            <li key={step.number} className="relative">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(step.number)}
                aria-current={isCurrent ? 'step' : undefined}
                className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex flex-col justify-between min-h-[82px] ${
                  isCurrent
                    ? 'border-[#F5A524] bg-white dark:bg-[#1C1F2B] shadow-md ring-2 ring-[#F5A524]/20'
                    : isCompleted
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      isCurrent
                        ? 'bg-[#F5A524] text-[#14161C]'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {isCompleted ? '✓' : step.number}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Step {step.number} of 4
                  </span>
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                    {step.title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {step.subtitle}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
