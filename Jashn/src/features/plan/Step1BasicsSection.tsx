'use client';

import React from 'react';
import { Calendar, Heart, Cake, Users } from 'lucide-react';
import { WizardDraftState } from './wizard-types';
import { ValidationError } from '@/domain/event-planner/types';

interface Step1BasicsSectionProps {
  draft: WizardDraftState;
  onChange: (updates: Partial<WizardDraftState>) => void;
  errors: ValidationError[];
}

const EVENT_TYPES = [
  {
    id: 'wedding',
    title: 'Wedding',
    subtitle: 'Ceremony and reception',
    icon: Heart,
  },
  {
    id: 'birthday',
    title: 'Birthday',
    subtitle: 'Any age or milestone',
    icon: Cake,
  },
  {
    id: 'community_event',
    title: 'Community',
    subtitle: 'Festival, fundraiser or meetup',
    icon: Users,
  },
];

export const Step1BasicsSection: React.FC<Step1BasicsSectionProps> = ({
  draft,
  onChange,
  errors,
}) => {
  const getError = (field: string) => errors.find((e) => e.field === field)?.message;

  return (
    <section aria-labelledby="section-basics" className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-[#2E2A7A] dark:text-[#FFD98A] flex items-center justify-center shrink-0 shadow-xs">
          <Calendar size={20} />
        </div>
        <div>
          <h3 id="section-basics" className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            The basics
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Core parameters essential to establish your planning timeline.
          </p>
        </div>
      </div>

      {/* Event Type Cards */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2.5">
          Event type <span className="text-rose-500 dark:text-rose-400 font-medium text-xs">(required)</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {EVENT_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = draft.eventType === type.id;
            return (
              <button
                type="button"
                key={type.id}
                onClick={() => onChange({ eventType: type.id })}
                className={`w-full p-4 rounded-xl border text-left flex items-center gap-3.5 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'border-[#2E2A7A] dark:border-[#F5A524] bg-indigo-50/50 dark:bg-[#2E2A7A]/25 ring-2 ring-[#2E2A7A]/20 dark:ring-[#F5A524]/25 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#12141D] hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-md'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'border-[#2E2A7A] dark:border-[#F5A524]' : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-[#2E2A7A] dark:bg-[#F5A524]" />}
                </div>
                <div className="w-10 h-10 rounded-xl p-2.5 bg-indigo-50 dark:bg-indigo-950/70 text-[#2E2A7A] dark:text-[#FFD98A] flex items-center justify-center shrink-0">
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">{type.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{type.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Event Name */}
      <div>
        <label htmlFor="field-eventName" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
          Event name <span className="text-rose-500 dark:text-rose-400 font-medium text-xs">(required)</span>
        </label>
        <input
          id="field-eventName"
          type="text"
          value={draft.eventName}
          onChange={(e) => onChange({ eventName: e.target.value })}
          placeholder="e.g. Dev & Ananya's Royal Sangeet"
          aria-describedby="desc-eventName"
          aria-invalid={Boolean(getError('eventName'))}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#12141D] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#2E2A7A] dark:focus:ring-[#F5A524] focus:border-transparent transition-all"
        />
        <p id="desc-eventName" className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
          A distinctive celebration title, such as &quot;Priya &amp; Rohan&apos;s Vivah&quot; or &quot;Koramangala Community Carnival&quot;.
        </p>
        {getError('eventName') && <p className="text-xs text-rose-500 mt-1 font-medium">{getError('eventName')}</p>}
      </div>

      {/* Event Date & Guest Count */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="field-eventDate" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Event date <span className="text-rose-500 dark:text-rose-400 font-medium text-xs">(required)</span>
          </label>
          <input
            id="field-eventDate"
            type="date"
            value={draft.eventDate}
            onChange={(e) => onChange({ eventDate: e.target.value })}
            aria-describedby="desc-eventDate"
            aria-invalid={Boolean(getError('eventDate'))}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#12141D] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#2E2A7A] dark:focus:ring-[#F5A524] focus:border-transparent transition-all [color-scheme:light] dark:[color-scheme:dark]"
          />
          <p id="desc-eventDate" className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            Pick your celebration date within the next five years.
          </p>
          {getError('eventDate') && <p className="text-xs text-rose-500 mt-1 font-medium">{getError('eventDate')}</p>}
        </div>

        <div>
          <label htmlFor="field-guestCount" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Number of guests <span className="text-rose-500 dark:text-rose-400 font-medium text-xs">(required)</span>
          </label>
          <input
            id="field-guestCount"
            type="number"
            min={1}
            value={draft.guestCount}
            onChange={(e) => onChange({ guestCount: e.target.value })}
            placeholder="e.g. 350"
            aria-describedby="desc-guestCount"
            aria-invalid={Boolean(getError('guestCount'))}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#12141D] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#2E2A7A] dark:focus:ring-[#F5A524] focus:border-transparent transition-all"
          />
          <p id="desc-guestCount" className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            Total attendees expected, including family members and children.
          </p>
          {getError('guestCount') && <p className="text-xs text-rose-500 mt-1 font-medium">{getError('guestCount')}</p>}
        </div>
      </div>
    </section>
  );
};

export default Step1BasicsSection;
