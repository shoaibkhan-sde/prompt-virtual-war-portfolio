'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { simulateBudgetCut, simulateGuestCountChange } from '@/domain/scenarios';
import { ExpenseCategory } from '@/domain/types';
import { formatINR } from '@/domain/format';
import { Sliders, Lock, Unlock, Play } from 'lucide-react';

export const ScenariosSection: React.FC = () => {
  const { plan, applySimulation, setActiveDiffSimulation } = usePlannerStore();
  const [lockedCats, setLockedCats] = useState<ExpenseCategory[]>(['photography']);
  const [customCutPercent, setCustomCutPercent] = useState<number>(10);

  const toggleLock = (cat: ExpenseCategory) => {
    setLockedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSimulateCut = (percent: number) => {
    const sim = simulateBudgetCut(plan.items, percent, lockedCats);
    setActiveDiffSimulation(sim);
  };

  const handleSimulateGuests = (delta: number) => {
    const currentGuests = plan.guests.length || 100;
    const sim = simulateGuestCountChange(
      plan.items,
      currentGuests,
      Math.max(10, currentGuests + delta),
      lockedCats
    );
    setActiveDiffSimulation(sim);
  };

  return (
    <section aria-labelledby="scenarios-heading" className="space-y-6">
      <div className="pb-3 border-b border-[#E6E7EE] dark:border-[#2C3040]">
        <h2 id="scenarios-heading" className="text-xl font-bold text-[#14161C] dark:text-white flex items-center gap-2">
          <Sliders size={20} className="text-[#2E2A7A] dark:text-[#A9A5EE]" />
          <span>What-If Budget & Headcount Scenarios</span>
        </h2>
        <p className="text-xs sm:text-sm text-[#5B6070] dark:text-[#C9CCD8] mt-0.5">
          Simulate budget changes with mathematical guarantees. Locked categories remain strictly unchanged.
        </p>
      </div>

      {/* Lock Categories Control */}
      <div className="bg-white dark:bg-[#1C1F2B] border border-[#E6E7EE] dark:border-[#2C3040] rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#14161C] dark:text-white mb-2 flex items-center gap-1.5">
          <Lock size={15} className="text-[#F5A524]" />
          <span>Protect Categories from Cuts (Lock/Unlock):</span>
        </h3>
        <div className="flex gap-2 flex-wrap">
          {plan.items.map((item) => {
            const isLocked = lockedCats.includes(item.category);
            return (
              <button
                key={item.category}
                type="button"
                onClick={() => toggleLock(item.category)}
                className={`min-h-[36px] px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  isLocked
                    ? 'bg-[#2E2A7A] text-white border-[#2E2A7A] shadow-sm'
                    : 'bg-[#F7F7FA] dark:bg-[#242838] text-[#5B6070] dark:text-[#C9CCD8] border-[#E6E7EE] dark:border-[#2C3040] hover:border-[#2E2A7A]'
                }`}
              >
                {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                <span>{item.category.charAt(0).toUpperCase() + item.category.slice(1)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scenario Presets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-[#1C1F2B] border border-[#E6E7EE] dark:border-[#2C3040] rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <span className="chip px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF1D6] text-[#7A4300] dark:bg-[#7A4300]/25 dark:text-[#FACF79]">
              Budget Trim
            </span>
            <h4 className="font-bold text-base text-[#14161C] dark:text-white my-2">
              Cut 10% from Total
            </h4>
            <p className="text-xs text-[#5B6070] dark:text-[#C9CCD8] leading-relaxed mb-4">
              Reduces unlocked categories proportionally while preserving protected vendors like Photography.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSimulateCut(10)}
            className="min-h-[40px] px-4 rounded-xl bg-[#2E2A7A] hover:bg-[#1F1B58] dark:bg-[#5A53DA] text-white text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <Play size={14} />
            <span>Simulate 10% Cut</span>
          </button>
        </div>

        <div className="bg-white dark:bg-[#1C1F2B] border border-[#E6E7EE] dark:border-[#2C3040] rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <span className="chip px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E3F5EA] text-[#0F6B3F] dark:bg-[#0F6B3F]/20 dark:text-[#E3F5EA]">
              Guest Surge
            </span>
            <h4 className="font-bold text-base text-[#14161C] dark:text-white my-2">
              Add 50 Guests
            </h4>
            <p className="text-xs text-[#5B6070] dark:text-[#C9CCD8] leading-relaxed mb-4">
              Simulates catering, gifting, and hospitality expenses scaling for 50 additional guests.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSimulateGuests(50)}
            className="min-h-[40px] px-4 rounded-xl bg-[#2E2A7A] hover:bg-[#1F1B58] dark:bg-[#5A53DA] text-white text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <Play size={14} />
            <span>Simulate +50 Guests</span>
          </button>
        </div>

        <div className="bg-white dark:bg-[#1C1F2B] border border-[#E6E7EE] dark:border-[#2C3040] rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <span className="chip px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EEF0F6] text-[#3F4457] dark:bg-[#2C3040] dark:text-[#C9CCD8]">
              Custom Adjust
            </span>
            <h4 className="font-bold text-base text-[#14161C] dark:text-white my-2">
              Trim {customCutPercent}%
            </h4>
            <input
              type="range"
              min="5"
              max="40"
              step="5"
              value={customCutPercent}
              onChange={(e) => setCustomCutPercent(Number(e.target.value))}
              className="w-full my-2 accent-[#2E2A7A] dark:accent-[#F5A524]"
            />
            <div className="text-xs text-[#5B6070] dark:text-[#C9CCD8] flex justify-between">
              <span>Target: {formatINR(plan.totalBudget * (1 - customCutPercent / 100))}</span>
              <span>−{customCutPercent}%</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSimulateCut(customCutPercent)}
            className="min-h-[40px] px-4 rounded-xl bg-[#2E2A7A] hover:bg-[#1F1B58] dark:bg-[#5A53DA] text-white text-xs font-semibold flex items-center justify-center gap-1.5 mt-4"
          >
            <Play size={14} />
            <span>Simulate Cut</span>
          </button>
        </div>
      </div>
    </section>
  );
};
