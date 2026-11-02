'use client';

import React from 'react';

export const AboutMetricsSection: React.FC = () => {
  const metrics = [
    {
      icon: (
        <svg className="w-6 h-6 text-[#F5A524]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      stat: '6 Archetypes',
      label: 'Specialized celebrations',
      desc: 'Weddings, Birthdays, College Fests, Hackathons, Tech Meetups & Melas.',
      borderColor: 'border-amber-200 dark:border-amber-900/60',
      bgColor: 'bg-amber-50/40 dark:bg-amber-950/20',
    },
    {
      icon: (
        <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      stat: '100% Exact Math',
      label: 'Zero Penny Discrepancy',
      desc: 'Largest-remainder algorithm ensures contingency & categories add up exactly.',
      borderColor: 'border-indigo-200 dark:border-indigo-900/60',
      bgColor: 'bg-indigo-50/40 dark:bg-indigo-950/20',
    },
    {
      icon: (
        <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      stat: 'DAG Milestones',
      label: 'Dependency Critical Path',
      desc: 'Proportional lead-time scaler that compresses gracefully without breaking order.',
      borderColor: 'border-emerald-200 dark:border-emerald-900/60',
      bgColor: 'bg-emerald-50/40 dark:bg-emerald-950/20',
    },
    {
      icon: (
        <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      stat: '100% Local Privacy',
      label: 'In-Browser State Only',
      desc: 'Zero server database storage. Encrypted URL fragments and instant .ics export.',
      borderColor: 'border-purple-200 dark:border-purple-900/60',
      bgColor: 'bg-purple-50/40 dark:bg-purple-950/20',
    },
  ];

  return (
    <section aria-labelledby="about-heading" className="py-16 sm:py-20 border-b border-slate-200/80 dark:border-slate-800">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Copy Column */}
        <div className="lg:col-span-5 space-y-4">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#F5A524]">
            ABOUT JASHN
          </span>
          <h2 id="about-heading" className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-[1.2]">
            Celebration planning engineered for joy, clarity, and peace of mind
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Every memorable event is a rich symphony of guests, ceremonies, food, and logistics. Jashn turns what you know about your event into an unshakeable blueprint so nothing is left to the last minute.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            From multi-day weddings and milestone birthdays to college fests and overnight hackathons, Jashn calibrates budget envelopes, lead times, and contractor checklists to your exact requirements.
          </p>
        </div>

        {/* Right 2x2 Metric Cards Grid */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {metrics.map((m, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-3xl border-2 ${m.borderColor} ${m.bgColor} shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[170px]`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-2xl bg-white dark:bg-[#1C1F2B] shadow-sm">
                  {m.icon}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Feature 0{idx + 1}
                </span>
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-0.5">
                  {m.stat}
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  {m.label}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {m.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
