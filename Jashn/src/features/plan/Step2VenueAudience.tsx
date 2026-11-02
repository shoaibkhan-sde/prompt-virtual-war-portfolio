'use client';

import React from 'react';
import { WizardDraftState } from './wizard-types';
import { getEventDefinition } from '@/domain/event-planner/registry';
import { DietaryType, ValidationError, VenueType } from '@/domain/event-planner/types';

interface Step2VenueAudienceProps {
  draft: WizardDraftState;
  onChange: (updates: Partial<WizardDraftState>) => void;
  errors: ValidationError[];
}

export const Step2VenueAudience: React.FC<Step2VenueAudienceProps> = ({
  draft,
  onChange,
  errors,
}) => {
  const def = getEventDefinition(draft.eventType);
  const getError = (field: string) => errors.find((e) => e.field === field)?.message;

  const venueOptions: { type: VenueType; title: string; note: string }[] = [
    { type: 'indoor', title: 'Indoor Venue', note: 'Standard banquet / hall' },
    { type: 'outdoor', title: 'Outdoor / Open Lawn', note: '+4% weather buffer & tent vendor' },
    { type: 'hybrid', title: 'Hybrid (Live + Stream)', note: 'Includes streaming & on-site AV' },
    { type: 'online', title: 'Online / Virtual Only', note: 'Hides physical venue & catering' },
  ];

  const dietaryOptions: { value: DietaryType; label: string }[] = [
    { value: 'none', label: 'Standard / Multi-Cuisine' },
    { value: 'veg_only', label: 'Strict Vegetarian' },
    { value: 'jain', label: 'Jain Friendly (No Root Veg)' },
    { value: 'vegan', label: '100% Plant-Based / Vegan' },
    { value: 'halal', label: 'Halal Certified' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Venue Type */}
      <fieldset>
        <legend className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
          Venue & Setting Environment <span className="text-rose-500">*</span>
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {venueOptions.map((opt) => {
            const isSelected = draft.venueType === opt.type;
            return (
              <label
                key={opt.type}
                className={`flex flex-col p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#F5A524] bg-amber-50/40 dark:bg-[#1C1F2B] ring-2 ring-[#F5A524]/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1">
                  <input
                    type="radio"
                    name="venueType"
                    value={opt.type}
                    checked={isSelected}
                    onChange={() => onChange({ venueType: opt.type })}
                    className="w-4 h-4 text-[#F5A524] focus:ring-[#F5A524]"
                  />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{opt.title}</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 pl-6.5">{opt.note}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* 2. City & Location */}
      <div>
        <label htmlFor="field-city" className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
          Host City / Region
        </label>
        <input
          id="field-city"
          type="text"
          maxLength={60}
          value={draft.city}
          onChange={(e) => onChange({ city: e.target.value })}
          placeholder="e.g. Pune / Mumbai / Bengaluru"
          className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1C1F2B] text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#F5A524] transition-shadow placeholder:text-slate-400"
        />
      </div>

      {/* 3. Primary & Secondary Guest Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="field-guestCount" className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
            {def?.primaryGuestLabel || 'Guest Count'} <span className="text-rose-500">*</span>
          </label>
          <input
            id="field-guestCount"
            type="number"
            min={def?.minGuests || 10}
            max={def?.maxGuests || 5000}
            value={draft.guestCount}
            onChange={(e) => onChange({ guestCount: e.target.value })}
            placeholder={`Min ${def?.minGuests || 10}`}
            aria-invalid={Boolean(getError('guestCount'))}
            aria-describedby={getError('guestCount') ? 'field-guestCount-error' : 'field-guestCount-desc'}
            className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1C1F2B] text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#F5A524] transition-shadow placeholder:text-slate-400"
          />
          {getError('guestCount') ? (
            <p id="field-guestCount-error" className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {getError('guestCount')}
            </p>
          ) : (
            <p id="field-guestCount-desc" className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Allowed: {def?.minGuests || 10} to {def?.maxGuests?.toLocaleString('en-IN') || 5000} guests.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="field-secondaryGuestCount" className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
            {def?.secondaryGuestLabel || 'Children / Extra Attendees'} (Optional)
          </label>
          <input
            id="field-secondaryGuestCount"
            type="number"
            min={0}
            max={2000}
            value={draft.secondaryGuestCount}
            onChange={(e) => onChange({ secondaryGuestCount: e.target.value })}
            placeholder="0"
            className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1C1F2B] text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#F5A524] transition-shadow placeholder:text-slate-400"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Helps calibrate seating, kids entertainment & gift kits.
          </p>
        </div>
      </div>

      {/* 4. Dietary Preferences & Alcohol */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="field-dietary" className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
            Catering Dietary Profile
          </label>
          <select
            id="field-dietary"
            value={draft.dietaryRequirement}
            onChange={(e) => onChange({ dietaryRequirement: e.target.value as DietaryType })}
            className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1C1F2B] text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#F5A524] transition-shadow"
          >
            {dietaryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {def?.allowAlcohol ? (
          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
              Beverage & Bar Service
            </label>
            <label className="flex items-center gap-3 min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1C1F2B] cursor-pointer">
              <input
                type="checkbox"
                checked={draft.alcoholServed}
                onChange={(e) => onChange({ alcoholServed: e.target.checked })}
                className="w-4 h-4 rounded text-[#F5A524] focus:ring-[#F5A524]"
              />
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                Include cocktail / licensed bar provisions
              </span>
            </label>
          </div>
        ) : (
          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 pt-7">
            ℹ️ Alcohol license is excluded by default for this celebration type.
          </div>
        )}
      </div>
    </div>
  );
};
