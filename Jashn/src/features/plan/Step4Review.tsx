'use client';

import React from 'react';
import { WizardDraftState, WizardStepNumber } from './wizard-types';
import { getEventDefinition } from '@/domain/event-planner/registry';

interface Step4ReviewProps {
  draft: WizardDraftState;
  onJumpToStep: (step: WizardStepNumber) => void;
  onSubmitPlan: () => void;
  isSubmitting: boolean;
}

export const Step4Review: React.FC<Step4ReviewProps> = ({
  draft,
  onJumpToStep,
  onSubmitPlan,
  isSubmitting,
}) => {
  const def = getEventDefinition(draft.eventType);
  const totalBudgetNum = Number(draft.totalBudget) || 0;

  const priorityNames = draft.priorities
    .map((pId) => def?.categories.find((c) => c.id === pId)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 text-sm text-indigo-950 dark:text-indigo-200">
        ✨ <strong>Almost ready!</strong> Review all celebration details below. Click <strong>Edit</strong> on any section if you would like to adjust anything before generating your full timeline and vendor blueprint.
      </div>

      {/* Section 1: Basics Review */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1C1F2B] shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <span>📅</span> Celebration Basics
          </h3>
          <button
            type="button"
            onClick={() => onJumpToStep(1)}
            className="text-xs font-bold text-[#F5A524] hover:text-[#D78B13] underline underline-offset-2 px-2 py-1 rounded focus:ring-2 focus:ring-[#F5A524]"
          >
            Edit Basics
          </button>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-sm">
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Type</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-200">{def?.displayName || draft.eventType}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Title</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-200">{draft.eventName || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Date</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-200">{draft.eventDate || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Timing & Duration</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-200">
              {draft.startTime || 'Time not set'} {draft.durationHours ? `(${draft.durationHours} hrs)` : ''}
            </dd>
          </div>
        </dl>
      </div>

      {/* Section 2: Venue & Audience Review */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1C1F2B] shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <span>📍</span> Venue & Audience
          </h3>
          <button
            type="button"
            onClick={() => onJumpToStep(2)}
            className="text-xs font-bold text-[#F5A524] hover:text-[#D78B13] underline underline-offset-2 px-2 py-1 rounded focus:ring-2 focus:ring-[#F5A524]"
          >
            Edit Venue & Audience
          </button>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-sm">
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Setting</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{draft.venueType}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Host City</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-200">{draft.city || 'Not specified'}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Guest Count</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-200">
              {draft.guestCount} {def?.primaryGuestLabel || 'Guests'}
              {Number(draft.secondaryGuestCount) > 0 && ` + ${draft.secondaryGuestCount} ${def?.secondaryGuestLabel || 'Extra'}`}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Dietary & Bar</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-200">
              {draft.dietaryRequirement.replace('_', ' ').toUpperCase()} | {draft.alcoholServed ? 'Bar Included' : 'No Alcohol'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Section 3: Money & Priorities Review */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1C1F2B] shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <span>💎</span> Budget & Focus
          </h3>
          <button
            type="button"
            onClick={() => onJumpToStep(3)}
            className="text-xs font-bold text-[#F5A524] hover:text-[#D78B13] underline underline-offset-2 px-2 py-1 rounded focus:ring-2 focus:ring-[#F5A524]"
          >
            Edit Budget
          </button>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-sm">
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Total Budget</dt>
            <dd className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
              {draft.currency} {totalBudgetNum.toLocaleString('en-IN')}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Experience Tier</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{draft.budgetTier}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-slate-500 dark:text-slate-400">Top Priorities</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-200">{priorityNames || 'Balanced evenly across all categories'}</dd>
          </div>
          {draft.theme && (
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Theme</dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-200">{draft.theme}</dd>
            </div>
          )}
          {draft.interests && (
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Interests</dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-200">{draft.interests}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Submission CTA */}
      <div className="pt-2">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onSubmitPlan}
          className="w-full min-h-[52px] px-8 rounded-2xl font-extrabold text-base bg-[#F5A524] hover:bg-[#D78B13] disabled:bg-slate-300 dark:disabled:bg-slate-800 text-[#14161C] shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-[0.99]"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Generating Celebration Plan...</span>
            </>
          ) : (
            <>
              <span>✨ Build Celebration Plan</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
