'use client';

import React from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { calculateBudgetTotals } from '@/domain/budget';
import { calculateDaysRemaining } from '@/domain/timeline';
import { AlertCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export const NeedsAttentionCard: React.FC = () => {
  const { plan } = usePlannerStore();
  const totals = calculateBudgetTotals(
    plan.totalBudget,
    plan.items,
    plan.guests.length,
    plan.reservePercentage
  );

  const cateringSummary = totals.categories.find((c) => c.category === 'catering');
  const photogVendor = plan.vendors.find((v) => v.category === 'photography');
  const photogDays = photogVendor ? calculateDaysRemaining(photogVendor.deadlineDate) : 0;

  return (
    <section
      aria-labelledby="attention-heading"
      className="card bg-white dark:bg-[#1C1F2B] border border-[#E6E7EE] dark:border-[#2C3040] rounded-2xl p-6 shadow-sm"
    >
      <h2 id="attention-heading" className="text-base font-bold text-[#14161C] dark:text-white mb-3">
        Needs attention
      </h2>

      <div className="space-y-3 text-sm">
        {/* Deadline alert */}
        <div className="flex gap-2.5 items-start">
          <span className="chip px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF1D6] text-[#7A4300] dark:bg-[#7A4300]/30 dark:text-[#FACF79] flex-shrink-0 flex items-center gap-1">
            <AlertTriangle size={12} />
            <span>Deadline</span>
          </span>
          <span className="text-[#14161C] dark:text-[#C9CCD8] text-xs sm:text-sm">
            {photogDays > 0
              ? `Photographer booking is due in ${photogDays} days.`
              : 'Upcoming vendor bookings require confirmation.'}
          </span>
        </div>

        {/* Budget percentage alert */}
        {cateringSummary && (
          <div className="flex gap-2.5 items-start">
            <span className="chip px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF1D6] text-[#7A4300] dark:bg-[#7A4300]/30 dark:text-[#FACF79] flex-shrink-0 flex items-center gap-1">
              <AlertCircle size={12} />
              <span>Budget</span>
            </span>
            <span className="text-[#14161C] dark:text-[#C9CCD8] text-xs sm:text-sm">
              Catering is {cateringSummary.percentageOfTotal}% of your total. Typical celebration range is 25% to 35%.
            </span>
          </div>
        )}

        {/* Reserve Protection status */}
        <div className="flex gap-2.5 items-start">
          <span className="chip px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E3F5EA] text-[#0F6B3F] dark:bg-[#0F6B3F]/20 dark:text-[#E3F5EA] flex-shrink-0 flex items-center gap-1">
            <ShieldCheck size={12} />
            <span>Reserve</span>
          </span>
          <span className="text-[#14161C] dark:text-[#C9CCD8] text-xs sm:text-sm">
            {plan.reservePercentage}% contingency safety buffer protected.
          </span>
        </div>
      </div>
    </section>
  );
};
