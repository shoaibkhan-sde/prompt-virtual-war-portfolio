'use client';

import React from 'react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Describe Your Event',
      desc: 'Specify your celebration archetype, date, guest counts, venue setup, dietary needs, and total budget constraints.',
      icon: '✍️',
      tag: 'Step 1: Event Details',
    },
    {
      num: '02',
      title: 'Review Your Plan',
      desc: 'Receive an instant integer budget allocation with contingency protection, synchronized contractor deadlines, and ranked ideas.',
      icon: '✨',
      tag: 'Step 2: Instant Blueprint',
    },
    {
      num: '03',
      title: 'Track and Refine',
      desc: 'Tick milestone tasks, log actual contractor spending with real-time status warnings, and refine details with AI assistance.',
      icon: '📋',
      tag: 'Step 3: Execution Tracker',
    },
  ];

  return (
    <section aria-labelledby="how-heading" className="py-16 sm:py-20 border-b border-slate-200/80 dark:border-slate-800">
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
        <span className="text-xs font-extrabold uppercase tracking-widest text-[#F5A524] mb-2 block">
          HOW IT WORKS
        </span>
        <h2 id="how-heading" className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
          From initial spark to celebration in three steps
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
          Our pure deterministic engine turns event parameters into an actionable plan you can execute with confidence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-12">
        {steps.map((s, idx) => (
          <div
            key={idx}
            className="p-6 rounded-3xl bg-white dark:bg-[#1C1F2B] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shadow-inner">
                  {s.icon}
                </span>
                <span className="text-xl font-black text-slate-300 dark:text-slate-700 font-mono">
                  {s.num}
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F5A524] block mb-1">
                {s.tag}
              </span>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mb-2">
                {s.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {s.desc}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 group-hover:text-[#F5A524] transition-colors">
              {idx < 2 ? 'Proceeds to Next →' : 'Plan Ready to Execute ✓'}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
