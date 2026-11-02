'use client';

import React, { useState, useEffect } from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { X, Check } from 'lucide-react';

export const EditPlanModal: React.FC = () => {
  const { plan, isEditModalOpen, setEditModalOpen, updateEventDetails } = usePlannerStore();
  const [title, setTitle] = useState(plan.title);
  const [date, setDate] = useState(plan.date);
  const [location, setLocation] = useState(plan.location);

  useEffect(() => {
    setTitle(plan.title);
    setDate(plan.date);
    setLocation(plan.location);
  }, [plan, isEditModalOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditModalOpen(false);
    };
    if (isEditModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditModalOpen, setEditModalOpen]);

  if (!isEditModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    updateEventDetails(title.trim(), date, location.trim());
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white dark:bg-[#1C1F2B] border border-[#E6E7EE] dark:border-[#2C3040] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <div className="flex justify-between items-center pb-3 border-b border-[#EEF0F6] dark:border-[#2C3040]">
          <h2 id="edit-modal-title" className="text-base font-bold text-[#14161C] dark:text-white">
            Customize Event Details
          </h2>
          <button
            type="button"
            onClick={() => setEditModalOpen(false)}
            aria-label="Close modal"
            className="text-[#5B6070] hover:text-[#14161C] dark:hover:text-white p-1"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 my-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-[#5B6070] dark:text-[#C9CCD8] mb-1">
              Event Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full min-h-[42px] px-3.5 border border-[#D5D7E2] dark:border-[#3F4457] rounded-xl bg-white dark:bg-[#14161C] text-[#14161C] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2E2A7A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5B6070] dark:text-[#C9CCD8] mb-1">
              Event Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full min-h-[42px] px-3.5 border border-[#D5D7E2] dark:border-[#3F4457] rounded-xl bg-white dark:bg-[#14161C] text-[#14161C] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2E2A7A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5B6070] dark:text-[#C9CCD8] mb-1">
              Location / City
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full min-h-[42px] px-3.5 border border-[#D5D7E2] dark:border-[#3F4457] rounded-xl bg-white dark:bg-[#14161C] text-[#14161C] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2E2A7A]"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EEF0F6] dark:border-[#2C3040]">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="min-h-[40px] px-4 rounded-xl border border-[#D5D7E2] dark:border-[#3F4457] text-xs font-semibold text-[#5B6070] dark:text-[#C9CCD8] hover:bg-[#F7F7FA] dark:hover:bg-[#2C3040]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[40px] px-5 rounded-xl bg-[#2E2A7A] dark:bg-[#5A53DA] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Check size={16} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
