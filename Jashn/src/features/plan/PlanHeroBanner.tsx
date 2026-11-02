'use client';

import React from 'react';
import { Edit3, Sparkles, ListChecks, Check } from 'lucide-react';

interface PlanHeroBannerProps {
  currentStep?: number;
}

export const PlanHeroBanner: React.FC<PlanHeroBannerProps> = ({ currentStep = 1 }) => {
  const steps = [
    { number: 1, label: 'Describe your event', icon: Edit3 },
    { number: 2, label: 'Review your plan', icon: Sparkles },
    { number: 3, label: 'Track and refine', icon: ListChecks },
  ];

  return (
    <header
      style={{ minHeight: '340px' }}
      className="relative w-full bg-[#2E2A7A] text-white min-h-[340px] flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-10 sm:py-12 border-b border-[#F5A524]/25 shadow-2xl overflow-hidden"
    >
      {/* Background ambient lighting accents */}
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-purple-400/10 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none"
      />

      <div className="relative max-w-6xl mx-auto w-full">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#FFD98A] bg-[#F5A524]/15 border border-[#F5A524]/40 px-3.5 py-1.5 rounded-full mb-2.5 shadow-xs">
          Event Planner
        </span>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-2 font-serif sm:font-sans">
          Plan your event
        </h1>

        <p className="text-purple-100/90 text-sm sm:text-base max-w-xl mb-6 sm:mb-7 font-normal leading-relaxed">
          Three short steps take you from an idea to a plan you can follow.
        </p>

        {/* Progress Stepper with Connecting Lines */}
        <nav aria-label="Planning stages" className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.number;
            const isActive = currentStep === step.number;

            return (
              <React.Fragment key={step.number}>
                <div
                  className={`inline-flex items-center gap-2.5 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-semibold transition-all ${isActive
                    ? 'bg-white !text-[#2E2A7A] shadow-lg ring-2 ring-white/40 dark:bg-white dark:!text-[#2E2A7A]'
                    : isCompleted
                      ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/50'
                      : 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/15'
                    }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isActive
                      ? 'bg-[#2E2A7A] text-white shadow-xs'
                      : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/20 text-white'
                      }`}
                  >
                    {isCompleted ? <Check size={13} strokeWidth={3} /> : step.number}
                  </span>
                  <Icon
                    size={16}
                    className={
                      isActive
                        ? 'text-[#2E2A7A] dark:text-[#2E2A7A] shrink-0'
                        : isCompleted
                          ? 'text-emerald-300 shrink-0'
                          : 'text-white/80 shrink-0'
                    }
                  />
                  <span
                    className={
                      isActive
                        ? 'text-[#2E2A7A] dark:text-[#2E2A7A] font-extrabold'
                        : isCompleted
                          ? 'text-emerald-100 font-medium'
                          : 'text-white/80 font-medium'
                    }
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connecting track line between steps */}
                {idx < steps.length - 1 && (
                  <div
                    aria-hidden="true"
                    className={`hidden sm:block h-0.5 w-6 md:w-20 transition-colors ${currentStep > step.number ? 'bg-emerald-400/60' : 'bg-white/35'
                      }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default PlanHeroBanner;
