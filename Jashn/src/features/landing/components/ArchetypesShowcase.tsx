'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getAllEventDefinitions } from '@/domain/event-planner/registry';

export const ArchetypesShowcase: React.FC = () => {
  const definitions = getAllEventDefinitions();
  const [selectedId, setSelectedId] = useState<string>(definitions[0]?.id || 'wedding');

  const selectedDef = definitions.find((d) => d.id === selectedId) || definitions[0];

  return (
    <section aria-labelledby="archetypes-heading" className="py-16 sm:py-20 border-b border-slate-200/80 dark:border-slate-800">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-extrabold uppercase tracking-widest text-[#F5A524] mb-2 block">
          SUPPORTED OCCASIONS
        </span>
        <h2 id="archetypes-heading" className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
          Specialized blueprints for every occasion
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Not generic templates—each celebration archetype has custom weights, lead times, safety protocols, and contractor questionnaires.
        </p>
      </div>

      {/* Archetype Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 justify-start sm:justify-center mb-8 scrollbar-none">
        {definitions.map((def) => {
          const isSelected = def.id === selectedId;
          return (
            <button
              key={def.id}
              type="button"
              onClick={() => setSelectedId(def.id)}
              className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-[#2E2A7A] text-white shadow-md ring-2 ring-[#F5A524]/40'
                  : 'bg-white dark:bg-[#1C1F2B] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {def.displayName}
            </button>
          );
        })}
      </div>

      {/* Selected Archetype Deep Dive Card */}
      {selectedDef && (
        <div className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1C1F2B] border border-slate-200 dark:border-slate-800 shadow-md grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F5A524]/20 text-[#D78B13] dark:text-[#F5A524]">
                Lead Time: {selectedDef.recommendedLeadDays} Days
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {selectedDef.allowAlcohol ? 'Bar provisions supported' : 'Alcohol excluded by default'}
              </span>
            </div>

            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {selectedDef.displayName}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedDef.tagline}
            </p>

            {/* Quick Spec Matrix */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Guest Capacity</span>
                <strong className="text-slate-900 dark:text-white font-extrabold text-sm">
                  {selectedDef.minGuests} – {selectedDef.maxGuests.toLocaleString('en-IN')}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Budget Range</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                  ₹{selectedDef.minBudget.toLocaleString('en-IN')} – ₹{selectedDef.maxBudget.toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/plan"
                className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-xl font-bold text-xs bg-[#F5A524] hover:bg-[#D78B13] text-[#14161C] shadow-md transition-all active:scale-95"
              >
                <span>Plan a {selectedDef.displayName}</span>
                <span className="ml-1.5">→</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Category Split Blueprint */}
          <div className="md:col-span-5 p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2.5">
            <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Core Budget Categories ({selectedDef.categories.length})
            </div>
            {selectedDef.categories.map((cat) => (
              <div key={cat.id}>
                <div className="flex justify-between font-medium text-slate-800 dark:text-slate-200 mb-1">
                  <span className="truncate pr-2">{cat.name}</span>
                  <span className="font-bold">{cat.baseWeight}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-[#F5A524] rounded-full"
                    style={{ width: `${cat.baseWeight * 2}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
