'use client';

import React, { useState } from 'react';
import { Sliders, Lock, Unlock, Play, Check, RotateCcw, Users, TrendingDown, ShieldCheck } from 'lucide-react';
import { GeneratedEventPlan } from '@/domain/event-planner/types';
import {
  EventPlanSimulation,
  simulatePlanBudgetCut,
  simulatePlanGuestChange,
  applySimulationToPlan,
} from '@/domain/event-planner/scenarios-math';

interface TabScenariosProps {
  plan: GeneratedEventPlan;
  onUpdatePlan: (updatedPlan: GeneratedEventPlan) => void;
}

export const TabScenarios: React.FC<TabScenariosProps> = ({ plan, onUpdatePlan }) => {
  const [lockedCategories, setLockedCategories] = useState<string[]>(() => {
    // Default lock photography or first category for demonstration safety
    const photo = plan.budget.categories.find((c) => c.categoryId.toLowerCase().includes('photo'));
    return photo ? [photo.categoryId] : [];
  });
  const [customPercent, setCustomPercent] = useState<number>(15);
  const [activeSimulation, setActiveSimulation] = useState<EventPlanSimulation | null>(null);
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  const toggleCategoryLock = (catId: string) => {
    setLockedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleSimulateCut = (percent: number) => {
    const sim = simulatePlanBudgetCut(plan.budget, percent, lockedCategories);
    setActiveSimulation(sim);
    setAppliedNotification(null);
  };

  const handleSimulateGuests = (delta: number) => {
    const sim = simulatePlanGuestChange(plan.budget, plan.input.guestCount, delta, lockedCategories);
    setActiveSimulation(sim);
    setAppliedNotification(null);
  };

  const handleApplyToPlan = () => {
    if (!activeSimulation) return;
    const updated = applySimulationToPlan(plan, activeSimulation);
    onUpdatePlan(updated);
    setAppliedNotification(`Applied "${activeSimulation.name}" to celebration plan.`);
    setActiveSimulation(null);
  };

  const handleResetSimulation = () => {
    setActiveSimulation(null);
    setAppliedNotification(null);
  };

  const formatCurrency = (amount: number) => {
    return `${plan.input.currency === 'INR' ? '₹' : plan.input.currency} ${Math.abs(amount).toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Tab Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-[#2E2A7A] dark:text-[#FFD98A] flex items-center justify-center shadow-xs">
            <Sliders size={20} />
          </div>
          <span>What-If Budget &amp; Headcount Scenarios</span>
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Simulate budget cuts and guest count adjustments with pure integer guarantees.
          Locked categories stay strictly untouched.
        </p>
      </div>

      {/* Applied Notification */}
      {appliedNotification && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-3 shadow-xs"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center shrink-0">
            <Check size={14} className="text-emerald-800 dark:text-emerald-100" />
          </div>
          <span className="font-semibold">{appliedNotification}</span>
        </div>
      )}

      {/* Category Protection Panel */}
      <div className="bg-white dark:bg-[#1C1F2B] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#F5A524]" />
            <span>Protect Categories from Reductions (Click to Lock / Unlock):</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {lockedCategories.length} protected
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {plan.budget.categories.map((c) => {
            const isLocked = lockedCategories.includes(c.categoryId);
            return (
              <button
                key={c.categoryId}
                type="button"
                onClick={() => toggleCategoryLock(c.categoryId)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                  isLocked
                    ? 'bg-[#2E2A7A] text-white border-[#2E2A7A] shadow-sm ring-2 ring-[#F5A524]/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {isLocked ? (
                  <Lock size={13} className="text-[#FFD98A]" />
                ) : (
                  <Unlock size={13} className="text-slate-400" />
                )}
                <span>{c.categoryName}</span>
                {isLocked && (
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-mono">
                    Locked
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Presets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Preset 1: 10% Cut */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1C1F2B] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                Conservative Trim
              </span>
              <TrendingDown size={18} className="text-amber-500" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900 dark:text-white mb-1.5">
              Cut 10% from Budget
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Reduces unlocked expense lines proportionally while preserving protected vendors like Photography.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSimulateCut(10)}
            className="w-full py-2.5 px-4 rounded-xl bg-[#2E2A7A] hover:bg-[#1F1B58] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98"
          >
            <Play size={14} className="text-[#FFD98A]" />
            <span>Simulate 10% Cut</span>
          </button>
        </div>

        {/* Preset 2: Guest Headcount */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1C1F2B] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                Headcount Shift
              </span>
              <Users size={18} className="text-emerald-500" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900 dark:text-white mb-1.5">
              Guest Count Shift
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Simulates catering, hospitality, and gifting costs scaling with guest volume changes.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSimulateGuests(50)}
              className="py-2.5 px-3 rounded-xl bg-[#2E2A7A] hover:bg-[#1F1B58] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-98"
            >
              <Play size={13} className="text-[#FFD98A]" />
              <span>+50 Guests</span>
            </button>
            <button
              type="button"
              onClick={() => handleSimulateGuests(-30)}
              className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-98"
            >
              <Play size={13} />
              <span>−30 Guests</span>
            </button>
          </div>
        </div>

        {/* Preset 3: Custom Slider */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1C1F2B] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300">
                Custom Target
              </span>
              <Sliders size={18} className="text-indigo-500" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900 dark:text-white mb-1">
              Trim {customPercent}%
            </h4>
            <input
              type="range"
              min="5"
              max="40"
              step="5"
              value={customPercent}
              onChange={(e) => setCustomPercent(Number(e.target.value))}
              aria-label="Custom percentage trim"
              className="w-full my-2 accent-[#2E2A7A] dark:accent-[#F5A524] cursor-pointer"
            />
            <div className="text-xs text-slate-500 dark:text-slate-400 flex justify-between mb-3 font-mono">
              <span>Target: {formatCurrency(Math.round(plan.budget.totalBudget * (1 - customPercent / 100)))}</span>
              <span>−{customPercent}%</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSimulateCut(customPercent)}
            className="w-full py-2.5 px-4 rounded-xl bg-[#2E2A7A] hover:bg-[#1F1B58] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98"
          >
            <Play size={14} className="text-[#FFD98A]" />
            <span>Simulate Custom Cut</span>
          </button>
        </div>
      </div>

      {/* Active Simulation Comparison Table */}
      {activeSimulation && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1F2B] border-2 border-[#F5A524]/60 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-[#F5A524]/20 text-[#B87004] dark:text-[#FFD98A] mb-1">
                Active Simulation
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {activeSimulation.name}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {activeSimulation.description}
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleApplyToPlan}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <Check size={16} />
                <span>Apply Simulation to Plan</span>
              </button>
              <button
                type="button"
                onClick={handleResetSimulation}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition-all cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Quick Stat Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                Total Budget Comparison
              </span>
              <div className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{formatCurrency(activeSimulation.simulatedTotalBudget)}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    activeSimulation.totalDifference <= 0
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {activeSimulation.totalDifference <= 0 ? '−' : '+'}
                  {formatCurrency(Math.abs(activeSimulation.totalDifference))}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                Revised Contingency Fund
              </span>
              <div className="text-base font-extrabold text-slate-900 dark:text-white">
                {formatCurrency(activeSimulation.simulatedContingency)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                Protected Categories
              </span>
              <div className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Lock size={15} className="text-[#F5A524]" />
                <span>{lockedCategories.length} Categories Locked</span>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Current Allocation</th>
                  <th className="py-3 px-4">Simulated Allocation</th>
                  <th className="py-3 px-4">Net Difference</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-800 dark:text-slate-200">
                {activeSimulation.categoryAdjustments.map((adj) => (
                  <tr key={adj.categoryId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {adj.categoryName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {formatCurrency(adj.originalAllocated)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(adj.simulatedAllocated)}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {adj.difference === 0 ? (
                        <span className="text-slate-500 dark:text-slate-400 font-medium">₹0</span>
                      ) : adj.difference < 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          −{formatCurrency(Math.abs(adj.difference))}
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 font-bold">
                          +{formatCurrency(adj.difference)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {adj.isLocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#2E2A7A]/15 text-[#2E2A7A] dark:bg-purple-950/60 dark:text-[#FFD98A] border border-[#2E2A7A]/30">
                          <Lock size={10} />
                          Protected
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Adjusted
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
