'use client';

import React from 'react';
import { VendorPlan, VendorRequirement } from '@/domain/event-planner/types';

interface TabVendorsProps {
  vendorPlan: VendorPlan;
  onToggleVendorBooked: (vendorId: string, isBooked: boolean) => void;
  onToggleStep: (vendorId: string, stepIndex: number) => void;
  vendorStepsState: Record<string, number[]>;
}

export const TabVendors: React.FC<TabVendorsProps> = ({
  vendorPlan,
  onToggleVendorBooked,
  onToggleStep,
  vendorStepsState,
}) => {
  return (
    <div className="space-y-6">
      {/* Summary Stat */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1F2B] border border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm">
        <div>
          Contractors Locked:{' '}
          <strong className="text-emerald-600">
            {vendorPlan.bookedVendors} of {vendorPlan.totalVendors}
          </strong>
        </div>
        <div className="text-xs text-slate-500">Ordered by earliest booking deadline</div>
      </div>

      {/* Vendor Cards */}
      <div className="space-y-4">
        {vendorPlan.vendors.map((vendor) => {
          const completedIndices = vendorStepsState[vendor.id] || [];
          return (
            <div
              key={vendor.id}
              className={`rounded-3xl border transition-all ${
                vendor.isBooked
                  ? 'border-emerald-200 dark:border-emerald-950 bg-emerald-50/20 dark:bg-emerald-950/10'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1C1F2B]'
              }`}
            >
              {/* Native details/summary element per section 5 */}
              <details className="group p-5" open={!vendor.isBooked}>
                <summary className="list-none flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={vendor.isBooked}
                      onChange={(e) => {
                        e.stopPropagation();
                        onToggleVendorBooked(vendor.id, e.target.checked);
                      }}
                      className="w-5 h-5 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-base text-slate-900 dark:text-white">
                          {vendor.role}
                        </span>
                        {vendor.isEssential && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200">
                            Essential
                          </span>
                        )}
                        {vendor.isPriorityLinked && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                            ⭐ Priority Linked
                          </span>
                        )}
                        {vendor.isBooked && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                            ✓ Confirmed
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Target Budget: <strong>₹{vendor.allocatedBudget.toLocaleString('en-IN')}</strong> | Book By:{' '}
                        <strong>{vendor.bookingDeadline}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 group-open:text-[#F5A524]">
                    <span>{completedIndices.length}/{vendor.checklistSteps.length} steps</span>
                    <span className="text-base transition-transform group-open:rotate-180">▾</span>
                  </div>
                </summary>

                {/* Expanded details */}
                <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  {/* Step Checklist */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      Contractor Preparation Steps
                    </h4>
                    <div className="space-y-2">
                      {vendor.checklistSteps.map((step, idx) => {
                        const isDone = completedIndices.includes(idx);
                        return (
                          <label
                            key={idx}
                            className={`flex items-start gap-2.5 p-2 rounded-lg text-xs cursor-pointer ${
                              isDone
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => onToggleStep(vendor.id, idx)}
                              className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>{step}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interview Questions */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      Questions to Ask During Interview
                    </h4>
                    <ul className="space-y-2 list-disc list-inside text-xs text-slate-700 dark:text-slate-300">
                      {vendor.questionsToAsk.map((q, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
};
