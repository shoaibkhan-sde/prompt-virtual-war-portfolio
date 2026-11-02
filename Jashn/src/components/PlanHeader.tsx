'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { calculateDaysRemaining } from '@/domain/timeline';
import { Calendar, Download, Share2, Check, Edit2 } from 'lucide-react';
export const PlanHeader: React.FC = () => {
  const { plan, setEditModalOpen } = usePlannerStore();
  const [copied, setCopied] = useState(false);
  const daysToGo = Math.max(0, calculateDaysRemaining(plan.date));

  // Format date readable (e.g. Sat, 20 Feb 2027)
  const formattedDate = (() => {
    try {
      const d = new Date(plan.date);
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return plan.date;
    }
  })();

  const handleExportIcs = async () => {
    try {
      const res = await fetch('/api/export/ics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: plan.title,
          milestones: plan.timeline,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate calendar');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${plan.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-calendar.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleShare = async () => {
    const summary = `${plan.title} (${formattedDate})\nBudget: ₹${plan.totalBudget.toLocaleString('en-IN')}\nGuests: ${plan.guests.length}\nPlanned on Jashn.`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="flex justify-between items-end gap-6 flex-wrap pb-2 border-b border-[#E6E7EE] dark:border-[#2C3040]">
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#EEF0F6] dark:bg-[#2C3040] text-[#3F4457] dark:text-[#C9CCD8]">
            {plan.eventType}
          </span>
          <button
            type="button"
            onClick={() => setEditModalOpen(true)}
            aria-label="Edit event details"
            className="text-[#5B6070] hover:text-[#2E2A7A] dark:hover:text-[#A9A5EE] transition-colors p-1"
          >
            <Edit2 size={14} />
          </button>
        </div>

        <h1 className="my-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#14161C] dark:text-white">
          {plan.title}
        </h1>

        <div className="text-[#5B6070] dark:text-[#C9CCD8] text-sm sm:text-base flex items-center gap-2 flex-wrap">
          <span>{formattedDate}</span>
          <span>·</span>
          <span>{plan.guests.length} guests</span>
          <span>·</span>
          <span>{plan.location}</span>
          <span>·</span>
          <strong className="text-[#14161C] dark:text-[#F5A524] font-bold">
            {daysToGo} days to go
          </strong>
        </div>
      </div>

      <div className="flex gap-2.5 flex-wrap print:hidden">
        <button
          type="button"
          onClick={handleExportIcs}
          className="min-h-[42px] px-4 rounded-xl border border-[#D5D7E2] dark:border-[#3F4457] bg-white dark:bg-[#1C1F2B] text-[#14161C] dark:text-white hover:bg-[#F7F7FA] dark:hover:bg-[#2C3040] font-semibold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-sm"
        >
          <Calendar size={16} className="text-[#2E2A7A] dark:text-[#A9A5EE]" />
          <span>Add to calendar</span>
        </button>

        <button
          type="button"
          onClick={handlePrintPdf}
          className="min-h-[42px] px-4 rounded-xl border border-[#D5D7E2] dark:border-[#3F4457] bg-white dark:bg-[#1C1F2B] text-[#14161C] dark:text-white hover:bg-[#F7F7FA] dark:hover:bg-[#2C3040] font-semibold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-sm"
        >
          <Download size={16} />
          <span>Export PDF</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="min-h-[42px] px-4 rounded-xl bg-[#2E2A7A] dark:bg-[#5A53DA] hover:bg-[#1F1B58] dark:hover:bg-[#413AC2] text-white font-semibold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-sm"
        >
          {copied ? <Check size={16} className="text-[#F5A524]" /> : <Share2 size={16} />}
          <span>{copied ? 'Copied summary!' : 'Share plan'}</span>
        </button>
      </div>
    </div>
  );
};
