'use client';

import React, { useEffect } from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { formatINR } from '@/domain/format';
import { X, Check, Lock } from 'lucide-react';

export const ScenarioDiffModal: React.FC = () => {
  const { activeDiffSimulation, setActiveDiffSimulation, applySimulation } = usePlannerStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveDiffSimulation(null);
    };
    if (activeDiffSimulation) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDiffSimulation, setActiveDiffSimulation]);

  if (!activeDiffSimulation) return null;

  const sim = activeDiffSimulation;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="diff-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white dark:bg-[#1C1F2B] border border-[#E6E7EE] dark:border-[#2C3040] rounded-2xl w-full max-w-xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start pb-3 border-b border-[#EEF0F6] dark:border-[#2C3040]">
          <div>
            <h2 id="diff-modal-title" className="text-lg font-bold text-[#14161C] dark:text-white">
              {sim.name}
            </h2>
            <p className="text-xs text-[#5B6070] dark:text-[#C9CCD8] mt-0.5">
              {sim.description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveDiffSimulation(null)}
            aria-label="Close comparison modal"
            className="text-[#5B6070] hover:text-[#14161C] dark:hover:text-white p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Top Summary Comparison */}
        <div className="my-4 p-4 rounded-xl bg-[#F7F7FA] dark:bg-[#242838] flex justify-between items-center text-sm border border-[#EEF0F6] dark:border-[#2C3040]">
          <div>
            <span className="text-xs text-[#5B6070] dark:text-[#C9CCD8] block">Total Budget</span>
            <strong className="text-base text-[#14161C] dark:text-white">
              {formatINR(sim.oldTotalBudget)} → {formatINR(sim.newTotalBudget)}
            </strong>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#5B6070] dark:text-[#C9CCD8] block">Difference</span>
            <strong
              className={`text-base font-bold ${
                sim.totalDifference < 0
                  ? 'text-[#0F6B3F] dark:text-[#38A169]'
                  : 'text-[#B83280] dark:text-[#F5A524]'
              }`}
            >
              {sim.totalDifference > 0 ? '+' : ''}
              {formatINR(sim.totalDifference)}
            </strong>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-2.5 my-4 text-xs sm:text-sm">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] text-xs font-semibold text-[#5B6070] dark:text-[#C9CCD8] pb-1 border-b border-[#EEF0F6] dark:border-[#2C3040]">
            <span>Category</span>
            <span>Current</span>
            <span>Proposed</span>
            <span className="text-right">Change</span>
          </div>

          {sim.adjustments.map((adj) => {
            const isLocked = sim.lockedCategories.includes(adj.categoryId);
            return (
              <div
                key={adj.categoryId}
                className="grid grid-cols-[1.5fr_1fr_1fr_1fr] items-center py-1 text-[#14161C] dark:text-white"
              >
                <div className="flex items-center gap-1.5 truncate">
                  {isLocked && <Lock size={12} className="text-[#F5A524] flex-shrink-0" />}
                  <span className="capitalize truncate">{adj.categoryId}</span>
                </div>
                <span className="text-[#5B6070] dark:text-[#C9CCD8]">
                  {formatINR(adj.oldAmount)}
                </span>
                <span className="font-semibold">{formatINR(adj.newAmount)}</span>
                <span
                  className={`text-right font-medium ${
                    adj.difference < 0
                      ? 'text-[#0F6B3F] dark:text-[#38A169]'
                      : adj.difference > 0
                      ? 'text-[#B83280]'
                      : 'text-[#5B6070] dark:text-[#7A8299]'
                  }`}
                >
                  {adj.difference === 0
                    ? '0'
                    : `${adj.difference > 0 ? '+' : ''}${formatINR(adj.difference)}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[#EEF0F6] dark:border-[#2C3040]">
          <button
            type="button"
            onClick={() => setActiveDiffSimulation(null)}
            className="min-h-[42px] px-4 rounded-xl border border-[#D5D7E2] dark:border-[#3F4457] text-xs font-semibold text-[#5B6070] dark:text-[#C9CCD8] hover:bg-[#F7F7FA] dark:hover:bg-[#2C3040]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => applySimulation(sim)}
            className="min-h-[42px] px-5 rounded-xl bg-[#2E2A7A] dark:bg-[#5A53DA] hover:bg-[#1F1B58] dark:hover:bg-[#413AC2] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Check size={16} />
            <span>Apply to Plan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
