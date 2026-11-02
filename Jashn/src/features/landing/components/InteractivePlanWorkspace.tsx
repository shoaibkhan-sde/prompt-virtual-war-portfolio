'use client';

import React from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { PlanHeader } from '@/components/PlanHeader';
import { NavTabs } from '@/components/NavTabs';
import { BudgetCard } from '@/components/BudgetCard';
import { TimelineCard } from '@/components/TimelineCard';
import { VendorsCard } from '@/components/VendorsCard';
import { AssistantChatCard } from '@/components/AssistantChatCard';
import { NeedsAttentionCard } from '@/components/NeedsAttentionCard';
import { GuestTrackerCard } from '@/components/GuestTrackerCard';
import { IdeasSection } from '@/components/IdeasSection';
import { ScenariosSection } from '@/components/ScenariosSection';
import { TemplateStarters } from '@/components/TemplateStarters';

export const InteractivePlanWorkspace: React.FC = () => {
  const { activeTab } = usePlannerStore();

  return (
    <section aria-labelledby="workspace-heading" className="py-12 border-b border-slate-200/80 dark:border-slate-800">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#F5A524] mb-1 block">
            LIVE PLAN EXPLORER
          </span>
          <h2 id="workspace-heading" className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Inspect & interact with live celebration plans
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse category budget envelopes, vendor negotiation milestones, and guest breakdowns in real time.
          </p>
        </div>
      </div>

      <PlanHeader />
      <NavTabs />

      {/* Tab-driven Accessible Content Switcher */}
      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
            <div className="flex flex-col gap-6 min-w-0">
              <BudgetCard />
              <TimelineCard />
              <VendorsCard />
            </div>

            <aside className="flex flex-col gap-6 min-w-0">
              <AssistantChatCard />
              <NeedsAttentionCard />
              <GuestTrackerCard />
            </aside>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
            <div className="min-w-0">
              <BudgetCard />
            </div>
            <aside className="flex flex-col gap-6 min-w-0">
              <AssistantChatCard />
              <NeedsAttentionCard />
            </aside>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
            <div className="min-w-0">
              <TimelineCard />
            </div>
            <aside className="flex flex-col gap-6 min-w-0">
              <AssistantChatCard />
              <NeedsAttentionCard />
            </aside>
          </div>
        )}

        {activeTab === 'vendors' && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
            <div className="min-w-0">
              <VendorsCard />
            </div>
            <aside className="flex flex-col gap-6 min-w-0">
              <AssistantChatCard />
              <NeedsAttentionCard />
            </aside>
          </div>
        )}

        {activeTab === 'guests' && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
            <div className="min-w-0">
              <GuestTrackerCard />
            </div>
            <aside className="flex flex-col gap-6 min-w-0">
              <AssistantChatCard />
              <NeedsAttentionCard />
            </aside>
          </div>
        )}

        {activeTab === 'ideas' && <IdeasSection />}

        {activeTab === 'scenarios' && <ScenariosSection />}
      </div>

      <TemplateStarters />
    </section>
  );
};
