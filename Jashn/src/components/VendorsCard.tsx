'use client';

import React from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { getVendorStatusMeta } from '@/domain/vendors';
import { formatINR } from '@/domain/format';
import { VendorStatus } from '@/domain/types';

export const VendorsCard: React.FC = () => {
  const { plan, updateVendor } = usePlannerStore();

  const getToneStyle = (tone: 'green' | 'amber' | 'neutral') => {
    switch (tone) {
      case 'green':
        return 'bg-[#E3F5EA] text-[#0F6B3F] dark:bg-[#0F6B3F]/20 dark:text-[#E3F5EA]';
      case 'amber':
        return 'bg-[#FFF1D6] text-[#7A4300] dark:bg-[#7A4300]/25 dark:text-[#FACF79]';
      case 'neutral':
      default:
        return 'bg-[#EEF0F6] text-[#3F4457] dark:bg-[#2C3040] dark:text-[#C9CCD8]';
    }
  };

  const handleStatusChange = (vendorId: string, currentStatus: VendorStatus) => {
    const cycle: VendorStatus[] = ['not_started', 'contacted', 'tasting_set', 'booked'];
    const nextIdx = (cycle.indexOf(currentStatus) + 1) % cycle.length;
    updateVendor(vendorId, cycle[nextIdx]);
  };

  return (
    <section
      aria-labelledby="vendor-heading"
      className="card bg-white dark:bg-[#1C1F2B] border border-[#E6E7EE] dark:border-[#2C3040] rounded-2xl p-6 shadow-sm overflow-x-auto"
    >
      <h2 id="vendor-heading" className="text-base font-bold text-[#14161C] dark:text-white mb-3">
        Vendor checklist
      </h2>

      {/* Table Header */}
      <div className="grid grid-cols-[1.3fr_1.2fr_1fr_1fr] gap-3 items-center pb-2 text-xs font-semibold text-[#5B6070] dark:text-[#C9CCD8] border-b border-[#EEF0F6] dark:border-[#2C3040]">
        <span>Vendor</span>
        <span>Status</span>
        <span>Book by</span>
        <span className="text-right">Budget</span>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-[#EEF0F6] dark:divide-[#2C3040] text-sm">
        {plan.vendors.map((vendor) => {
          const meta = getVendorStatusMeta(vendor.status, vendor.deadlineDate);
          const toneClass = getToneStyle(meta.tone);

          return (
            <div
              key={vendor.id}
              className="grid grid-cols-[1.3fr_1.2fr_1fr_1fr] gap-3 items-center py-3.5"
            >
              <div className="truncate">
                <strong className="font-semibold text-[#14161C] dark:text-white block truncate">
                  {vendor.role}
                </strong>
                {vendor.name && (
                  <span className="text-xs text-[#5B6070] dark:text-[#C9CCD8] truncate block">
                    {vendor.name}
                  </span>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => handleStatusChange(vendor.id, vendor.status)}
                  title="Click to change status"
                  className={`chip px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap text-left transition-transform active:scale-95 ${toneClass}`}
                >
                  {meta.label}
                </button>
              </div>

              <span className="text-xs font-medium text-[#5B6070] dark:text-[#C9CCD8]">
                {vendor.status === 'booked' ? 'Done' : vendor.deadlineDate}
              </span>

              <span className="text-xs sm:text-sm font-semibold text-[#14161C] dark:text-white text-right">
                {formatINR(vendor.allocatedBudget)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
