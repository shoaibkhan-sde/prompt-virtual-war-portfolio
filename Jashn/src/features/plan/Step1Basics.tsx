'use client';

import React from 'react';
import { WizardDraftState } from './wizard-types';
import { getAllEventDefinitions, getEventDefinition } from '@/domain/event-planner/registry';
import { ValidationError } from '@/domain/event-planner/types';

interface Step1BasicsProps {
  draft: WizardDraftState;
  onChange: (updates: Partial<WizardDraftState>) => void;
  errors: ValidationError[];
  typeResetNotice: string | null;
}

export const Step1Basics: React.FC<Step1BasicsProps> = ({
  draft,
  onChange,
  errors,
  typeResetNotice,
}) => {
  const definitions = getAllEventDefinitions();
  const selectedDef = getEventDefinition(draft.eventType);

  const getError = (field: string) => errors.find((e) => e.field === field)?.message;

  const todayStr = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 3);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  // Lead-time calculation for notice
  let isLeadTimeCompressed = false;
  if (selectedDef && draft.eventDate) {
    const diffDays = Math.round(
      (new Date(draft.eventDate + 'T00:00:00Z').getTime() - new Date(todayStr + 'T00:00:00Z').getTime()) /
        86400000
    );
    if (diffDays >= 0 && diffDays < selectedDef.recommendedLeadDays) {
      isLeadTimeCompressed = true;
    }
  }

  const handleTypeChange = (newType: string) => {
    // Reset type-specific fields and priorities with notice
    onChange({
      eventType: newType,
      priorities: [],
      secondaryGuestCount: '0',
      sponsorshipTarget: '',
      prizePool: '',
    });
  };

  return (
    <div className="space-y-6">
      {typeResetNotice && (
        <div
          role="status"
          aria-live="polite"
          className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-sm font-medium flex items-center gap-2"
        >
          <span className="text-base">ℹ️</span>
          <span>{typeResetNotice}</span>
        </div>
      )}

      {/* 1. Celebration Type */}
      <div>
        <label htmlFor="field-eventType" className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
          Celebration Type <span className="text-rose-500">*</span>
        </label>
        <select
          id="field-eventType"
          value={draft.eventType}
          onChange={(e) => handleTypeChange(e.target.value)}
          aria-invalid={Boolean(getError('eventType'))}
          aria-describedby={getError('eventType') ? 'field-eventType-error' : 'field-eventType-desc'}
          className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1C1F2B] text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#F5A524] transition-shadow"
        >
          {definitions.map((def) => (
            <option key={def.id} value={def.id}>
              {def.displayName}
            </option>
          ))}
        </select>
        {selectedDef && (
          <p id="field-eventType-desc" className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {selectedDef.tagline} (Standard planning horizon: {selectedDef.recommendedLeadDays} days)
          </p>
        )}
        {getError('eventType') && (
          <p id="field-eventType-error" className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
            {getError('eventType')}
          </p>
        )}
      </div>

      {/* 2. Celebration Title */}
      <div>
        <label htmlFor="field-eventName" className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
          Celebration Title / Event Name <span className="text-rose-500">*</span>
        </label>
        <input
          id="field-eventName"
          type="text"
          maxLength={80}
          value={draft.eventName}
          onChange={(e) => onChange({ eventName: e.target.value })}
          placeholder="e.g. Maya & Kabir's Sangeet & Reception"
          aria-invalid={Boolean(getError('eventName'))}
          aria-describedby={getError('eventName') ? 'field-eventName-error' : 'field-eventName-desc'}
          className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1C1F2B] text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#F5A524] transition-shadow placeholder:text-slate-400"
        />
        <div className="flex justify-between items-center mt-1 text-xs">
          {getError('eventName') ? (
            <p id="field-eventName-error" className="font-semibold text-rose-600 dark:text-rose-400">
              {getError('eventName')}
            </p>
          ) : (
            <p id="field-eventName-desc" className="text-slate-500 dark:text-slate-400">
              Between 2 and 80 characters.
            </p>
          )}
          <span className="text-slate-500 dark:text-slate-400 font-medium">{draft.eventName.length}/80</span>
        </div>
      </div>

      {/* 3. Event Date */}
      <div>
        <label htmlFor="field-eventDate" className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
          Event Date <span className="text-rose-500">*</span>
        </label>
        <input
          id="field-eventDate"
          type="date"
          min={todayStr}
          max={maxDateStr}
          value={draft.eventDate}
          onChange={(e) => onChange({ eventDate: e.target.value })}
          aria-invalid={Boolean(getError('eventDate'))}
          aria-describedby={getError('eventDate') ? 'field-eventDate-error' : 'field-eventDate-desc'}
          className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1C1F2B] text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#F5A524] transition-shadow"
        />
        {isLeadTimeCompressed && !getError('eventDate') && (
          <div className="mt-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
            ⚡ <strong>Compressed Timeline:</strong> Your celebration is closer than the recommended {selectedDef?.recommendedLeadDays} days. Milestones will be fast-tracked proportionally.
          </div>
        )}
        {getError('eventDate') && (
          <p id="field-eventDate-error" className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
            {getError('eventDate')}
          </p>
        )}
      </div>

      {/* 4. Start Time & Duration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="field-startTime" className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
            Event Start Time (Optional)
          </label>
          <input
            id="field-startTime"
            type="time"
            value={draft.startTime}
            onChange={(e) => onChange({ startTime: e.target.value })}
            className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1C1F2B] text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#F5A524] transition-shadow"
          />
        </div>
        <div>
          <label htmlFor="field-durationHours" className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
            Duration in Hours (Optional)
          </label>
          <input
            id="field-durationHours"
            type="number"
            min={1}
            max={72}
            value={draft.durationHours}
            onChange={(e) => onChange({ durationHours: e.target.value })}
            placeholder="e.g. 6"
            className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1C1F2B] text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#F5A524] transition-shadow placeholder:text-slate-400"
          />
        </div>
      </div>
    </div>
  );
};
