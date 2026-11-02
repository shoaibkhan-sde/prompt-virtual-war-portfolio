'use client';

import React, { useEffect, useRef } from 'react';
import { ValidationError } from '@/domain/event-planner/types';

interface ErrorSummaryProps {
  errors: ValidationError[];
}

export const ErrorSummary: React.FC<ErrorSummaryProps> = ({ errors }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errors.length > 0 && containerRef.current) {
      containerRef.current.focus();
    }
  }, [errors]);

  if (errors.length === 0) return null;

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      role="alert"
      aria-labelledby="error-summary-title"
      className="mb-8 p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-700 outline-none focus:ring-4 focus:ring-rose-300 transition-all shadow-sm"
    >
      <div className="flex items-start gap-3">
        <svg
          className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div className="flex-1">
          <h2 id="error-summary-title" className="text-base font-bold text-rose-900 dark:text-rose-200 mb-2">
            There {errors.length === 1 ? 'is 1 issue' : `are ${errors.length} issues`} that need your attention:
          </h2>
          <ul className="space-y-1.5 list-disc list-inside text-sm text-rose-800 dark:text-rose-300">
            {errors.map((err, index) => (
              <li key={`${err.field}-${index}`}>
                <a
                  href={`#field-${err.field}`}
                  className="font-semibold underline underline-offset-2 hover:text-rose-950 dark:hover:text-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500 rounded px-1"
                >
                  {err.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
