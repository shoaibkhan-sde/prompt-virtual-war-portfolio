'use client';

import React, { useState } from 'react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const FaqSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  const faqs: FaqItem[] = [
    {
      id: 'faq-storage',
      question: 'Where is my celebration plan stored, and who has access to it?',
      answer:
        'Your celebration plan lives exclusively in your browser session and local storage. No budget figures, guest tallies, or notes are stored on a centralized database. When you share a plan, it is serialized directly into an encrypted URL fragment or exported as a local .ics calendar file.',
    },
    {
      id: 'faq-math',
      question: 'How is the budget divided between categories without rounding errors?',
      answer:
        'We use the Hare-Niemeyer Largest Remainder algorithm. The system first allocates an untouchable contingency reserve (5% to 12% depending on the occasion). The remaining budget is apportioned using archetype weights and priority boosts, rounding to exact whole rupees so the sum always matches your target to the exact paisa.',
    },
    {
      id: 'faq-leadtime',
      question: 'What happens if my event is only a few weeks or days away?',
      answer:
        'Our timeline algorithm calculates the compression ratio between your chosen celebration date and recommended lead times. It compresses task deadlines proportionally while strictly preserving milestone order (e.g., booking the venue always happens before paying decoration advances).',
    },
    {
      id: 'faq-sharing',
      question: 'Can I share or print the plan for family, vendors, or committee members?',
      answer:
        'Yes. You can export a synchronized .ics calendar file for Google and Apple calendars, print a clean tabular summary formatted for paper binders, or copy a direct URL containing your entire plan configuration without requiring anyone to register an account.',
    },
  ];

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section aria-labelledby="faq-heading" className="py-16 sm:py-20 border-b border-slate-200/80 dark:border-slate-800">
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
        <span className="text-xs font-extrabold uppercase tracking-widest text-[#F5A524] mb-2 block">
          FAQ
        </span>
        <h2 id="faq-heading" className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
          Frequently asked questions
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
          Clear answers about our deterministic calculations, privacy guarantees, and timeline compression.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4 mt-8 sm:mt-12">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1C1F2B] overflow-hidden transition-all shadow-sm"
            >
              <button
                type="button"
                id={`btn-${faq.id}`}
                aria-expanded={isOpen}
                aria-controls={`content-${faq.id}`}
                onClick={() => toggle(faq.id)}
                className="w-full min-h-[56px] px-6 py-4 flex items-center justify-between text-left font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-[#2E2A7A] dark:hover:text-[#F5A524] transition-colors gap-4"
              >
                <span>{faq.question}</span>
                <span className="text-slate-500 dark:text-slate-400 font-normal shrink-0">
                  <svg
                    className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#F5A524]' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>

              {isOpen && (
                <div
                  id={`content-${faq.id}`}
                  role="region"
                  aria-labelledby={`btn-${faq.id}`}
                  className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60"
                >
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
