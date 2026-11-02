import React, { useEffect, useRef, useState } from 'react';
import { Wallet, Calendar, CheckSquare, Sparkles, Sliders, MessageCircle, Trash2 } from 'lucide-react';
import { GeneratedEventPlan, RankedIdea } from '@/domain/event-planner/types';
import { updateTaskCompletion } from '@/domain/event-planner/timeline-math';
import { updateVendorProgress } from '@/domain/event-planner/vendors-math';
import { computeReadinessScore } from '@/domain/event-planner/readiness';
import { PlanSummaryHeader } from './PlanSummaryHeader';
import { TabBudgetTable } from './TabBudgetTable';
import { TabTimeline } from './TabTimeline';
import { TabVendors } from './TabVendors';
import { TabIdeas } from './TabIdeas';
import { TabScenarios } from './TabScenarios';
import { TabAskPlanner } from './TabAskPlanner';
import { ClearPlanDialog } from './ClearPlanDialog';

export type ReviewTabId = 'budget' | 'timeline' | 'vendors' | 'ideas' | 'scenarios' | 'ask';

interface PlanResultsViewProps {
  plan: GeneratedEventPlan;
  onUpdatePlan: (plan: GeneratedEventPlan) => void;
  onClearPlan: () => void;
  onStartNewPlan: () => void;
  onEditDetails?: () => void;
  announcement: string;
  onDownloadText: () => void;
  onPrintChecklist: () => void;
  onExportIcs?: () => void;
  onCopyShareLink?: () => void;
  shareCopied?: boolean;
}

const REVIEW_TABS = [
  { id: 'budget' as const, label: 'Budget', icon: Wallet },
  { id: 'timeline' as const, label: 'Timeline', icon: Calendar },
  { id: 'vendors' as const, label: 'Vendors', icon: CheckSquare },
  { id: 'ideas' as const, label: 'Ideas', icon: Sparkles },
  { id: 'scenarios' as const, label: 'Scenarios', icon: Sliders },
  { id: 'ask' as const, label: 'Ask the planner', icon: MessageCircle },
];

export const PlanResultsView: React.FC<PlanResultsViewProps> = ({
  plan,
  onUpdatePlan,
  onClearPlan,
  onStartNewPlan,
  onEditDetails,
  announcement,
  onDownloadText,
  onPrintChecklist,
}) => {
  const [activeTab, setActiveTab] = useState<ReviewTabId>('budget');
  const [vendorStepsState, setVendorStepsState] = useState<Record<string, number[]>>({});
  const headingRef = useRef<HTMLHeadingElement>(null);
  const clearDialogRef = useRef<HTMLDialogElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => { headingRef.current?.focus(); }, []);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const total = REVIEW_TABS.length;
    let nextIndex = index;
    if (e.key === 'ArrowRight') nextIndex = (index + 1) % total;
    else if (e.key === 'ArrowLeft') nextIndex = (index - 1 + total) % total;
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = total - 1;
    else return;
    e.preventDefault();
    setActiveTab(REVIEW_TABS[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  const handleUpdateSpending = (categoryId: string, spentAmount: number) => {
    if (categoryId === 'contingency') {
      onUpdatePlan({ ...plan, budget: { ...plan.budget, contingencySpent: spentAmount }, updatedAt: new Date().toISOString() });
      return;
    }
    const updatedCategories = plan.budget.categories.map((c) => {
      if (c.categoryId !== categoryId) return c;
      const diff = c.allocatedAmount - spentAmount;
      const status = diff >= 0 ? `₹${diff.toLocaleString('en-IN')} left` : `₹${Math.abs(diff).toLocaleString('en-IN')} over`;
      return { ...c, actualSpent: spentAmount, varianceStatus: status };
    });
    onUpdatePlan({ ...plan, budget: { ...plan.budget, categories: updatedCategories }, updatedAt: new Date().toISOString() });
  };

  const handleToggleTask = (taskId: string, isCompleted: boolean) => {
    const today = new Date().toISOString().split('T')[0];
    const updatedTimeline = updateTaskCompletion(plan.timeline, taskId, isCompleted, today);
    onUpdatePlan({ ...plan, timeline: updatedTimeline, readiness: computeReadinessScore(updatedTimeline, plan.vendors, plan.budget), updatedAt: new Date().toISOString() });
  };

  const handleToggleVendorBooked = (vendorId: string, isBooked: boolean) => {
    const steps = vendorStepsState[vendorId] || [];
    const updatedVendors = updateVendorProgress(plan.vendors, vendorId, isBooked, steps);
    onUpdatePlan({ ...plan, vendors: updatedVendors, readiness: computeReadinessScore(plan.timeline, updatedVendors, plan.budget), updatedAt: new Date().toISOString() });
  };

  const handleToggleStep = (vendorId: string, stepIndex: number) => {
    const currentSteps = vendorStepsState[vendorId] || [];
    const updatedSteps = currentSteps.includes(stepIndex) ? currentSteps.filter((i) => i !== stepIndex) : [...currentSteps, stepIndex];
    setVendorStepsState((prev) => ({ ...prev, [vendorId]: updatedSteps }));
    const vendor = plan.vendors.vendors.find((v) => v.id === vendorId);
    const updatedVendors = updateVendorProgress(plan.vendors, vendorId, Boolean(vendor?.isBooked), updatedSteps);
    onUpdatePlan({ ...plan, vendors: updatedVendors, readiness: computeReadinessScore(plan.timeline, updatedVendors, plan.budget), updatedAt: new Date().toISOString() });
  };

  const handleAddExtraIdeas = (newIdeas: RankedIdea[]) => {
    onUpdatePlan({ ...plan, ideas: [...plan.ideas, ...newIdeas], updatedAt: new Date().toISOString() });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div aria-live="polite" className="sr-only">{announcement}</div>
      <PlanSummaryHeader
        plan={plan}
        onExportText={onDownloadText}
        onPrint={onPrintChecklist}
        onEditDetails={onEditDetails || onStartNewPlan}
        onStartNewPlan={onStartNewPlan}
      />
      <div
        role="tablist"
        aria-label="Event Plan Views"
        className="flex gap-2 sm:gap-2.5 overflow-x-auto pt-3.5 pb-3 px-1.5 -mx-1.5 border-b border-slate-200 dark:border-slate-800 mt-3 sm:mt-4 items-center scrollbar-none print:hidden"
      >
        {REVIEW_TABS.map((tab, idx) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[idx] = el; }}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isSelected}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isSelected ? 0 : -1}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[44px] px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A524] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#14161C] ${
                isSelected
                  ? 'bg-[#2E2A7A] text-white shadow-md border-2 border-[#F5A524] ring-2 ring-[#F5A524]/20'
                  : 'bg-white dark:bg-[#1C1F2B] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Icon size={16} className={isSelected ? 'text-[#FFD98A]' : 'text-slate-500 dark:text-slate-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} tabIndex={0} className="outline-none">
        {activeTab === 'budget' && <TabBudgetTable budget={plan.budget} currency={plan.input.currency} onUpdateSpending={handleUpdateSpending} />}
        {activeTab === 'timeline' && <TabTimeline timeline={plan.timeline} onToggleTask={handleToggleTask} />}
        {activeTab === 'vendors' && <TabVendors vendorPlan={plan.vendors} onToggleVendorBooked={handleToggleVendorBooked} onToggleStep={handleToggleStep} vendorStepsState={vendorStepsState} />}
        {activeTab === 'ideas' && <TabIdeas plan={plan} onAddExtraIdeas={handleAddExtraIdeas} />}
        {activeTab === 'scenarios' && <TabScenarios plan={plan} onUpdatePlan={onUpdatePlan} />}
        {activeTab === 'ask' && <TabAskPlanner plan={plan} />}
      </div>
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end print:hidden">
        <button
          type="button"
          onClick={() => clearDialogRef.current?.showModal()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:underline cursor-pointer"
        >
          <Trash2 size={14} />
          <span>Clear saved plan</span>
        </button>
      </div>
      <ClearPlanDialog dialogRef={clearDialogRef} onConfirmClear={onClearPlan} />
    </div>
  );
};

export default PlanResultsView;
