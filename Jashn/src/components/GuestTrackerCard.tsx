'use client';

import React from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { calculateGuestSummary } from '@/domain/guests';
import { formatINR } from '@/domain/format';

export const GuestTrackerCard: React.FC = () => {
  const { plan } = usePlannerStore();
  const summary = calculateGuestSummary(plan.guests, plan.totalBudget);

  return (
    <section
      aria-labelledby="guests-heading"
      className="card bg-white dark:bg-[#1C1F2B] border border-[#E6E7EE] dark:border-[#2C3040] rounded-2xl p-6 shadow-sm"
    >
      <h2 id="guests-heading" className="text-base font-bold text-[#14161C] dark:text-white mb-2">
        Guests
      </h2>

      <div className="grid grid-cols-3 gap-3 my-4 text-center">
        <div className="bg-[#F7F7FA] dark:bg-[#242838] p-3 rounded-xl border border-[#EEF0F6] dark:border-[#2C3040]">
          <div className="text-2xl sm:text-[26px] font-extrabold text-[#0F6B3F] dark:text-[#E3F5EA]">
            {summary.confirmedCount}
          </div>
          <div className="text-xs text-[#5B6070] dark:text-[#C9CCD8] mt-0.5">
            Confirmed
          </div>
        </div>

        <div className="bg-[#F7F7FA] dark:bg-[#242838] p-3 rounded-xl border border-[#EEF0F6] dark:border-[#2C3040]">
          <div className="text-2xl sm:text-[26px] font-extrabold text-[#F5A524] dark:text-[#FACF79]">
            {summary.pendingCount}
          </div>
          <div className="text-xs text-[#5B6070] dark:text-[#C9CCD8] mt-0.5">
            Pending
          </div>
        </div>

        <div className="bg-[#F7F7FA] dark:bg-[#242838] p-3 rounded-xl border border-[#EEF0F6] dark:border-[#2C3040]">
          <div className="text-2xl sm:text-[26px] font-extrabold text-[#5B6070] dark:text-[#7A8299]">
            {summary.declinedCount}
          </div>
          <div className="text-xs text-[#5B6070] dark:text-[#C9CCD8] mt-0.5">
            Declined
          </div>
        </div>
      </div>

      <div className="text-xs sm:text-sm text-[#5B6070] dark:text-[#C9CCD8] text-center pt-2 border-t border-[#EEF0F6] dark:border-[#2C3040]">
        Cost per confirmed guest:{' '}
        <strong className="text-[#14161C] dark:text-white font-bold">
          {formatINR(summary.costPerConfirmedGuest)}
        </strong>
      </div>
    </section>
  );
};
