'use client';

import React from 'react';

interface FeatureCard {
  title: string;
  tagline: string;
  desc: string;
  icon: React.ReactNode;
  badge: string;
}

export const FeaturesGridSection: React.FC = () => {
  const features: FeatureCard[] = [
    {
      title: 'Integer Split Engine',
      tagline: '100% Exact to the Rupee',
      desc: 'Largest-remainder mathematical distribution guarantees categories and emergency contingency sum to your exact target without a single penny lost.',
      badge: 'Zero Discrepancy',
      icon: (
        <svg className="w-6 h-6 text-[#F5A524]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Dynamic Lead-Time Scaler',
      tagline: 'Adaptive Task Timeline',
      desc: 'Milestones scale automatically based on days until your celebration, preserving critical path dependencies whether you have six months or two weeks.',
      badge: 'DAG Dependencies',
      icon: (
        <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: 'Contractor Blueprints',
      tagline: 'Vetted Interview Questionnaires',
      desc: 'Get role-specific contractor guides with essential questions, booking windows, deposit records, and deliverables checklists for caterers, decors, and sound.',
      badge: 'Negotiation Ready',
      icon: (
        <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      title: 'Local Privacy & .ICS Sync',
      tagline: 'Zero Data Retention',
      desc: 'Your financial split and guest counts remain strictly in your browser. One-click .ics export syncs deadlines to Google or Apple Calendar without logins.',
      badge: 'Zero-Storage',
      icon: (
        <svg className="w-6 h-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
    },
  ];

  return (
    <section aria-labelledby="features-heading" className="py-16 sm:py-20 border-b border-slate-200/80 dark:border-slate-800">
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        <span className="text-xs font-extrabold uppercase tracking-widest text-[#F5A524] mb-2 block">
          ENGINEERED CAPABILITIES
        </span>
        <h2 id="features-heading" className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
          Everything required to orchestrate with total certainty
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
          Combines deterministic algorithms with modern event craftsmanship to eliminate surprises from your budget and calendar.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 sm:mt-12">
        {features.map((f, idx) => (
          <div
            key={idx}
            className="p-6 rounded-3xl bg-white dark:bg-[#1C1F2B] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700/60 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 shadow-inner">
                  {f.icon}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {f.badge}
                </span>
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-1">
                {f.title}
              </h3>
              <div className="text-xs font-bold text-[#F5A524] dark:text-[#F5A524] mb-2">
                {f.tagline}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {f.desc}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Built into core runtime ✓
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
