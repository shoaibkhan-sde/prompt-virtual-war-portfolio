'use client';

import React, { useRef } from 'react';
import { usePlannerStore } from '@/store/plannerStore';
export const NavTabs: React.FC = () => {
  const { activeTab, setActiveTab } = usePlannerStore();
  const tabListRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'budget', label: 'Budget' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'vendors', label: 'Vendors' },
    { id: 'guests', label: 'Guests' },
    { id: 'ideas', label: 'Ideas' },
    { id: 'scenarios', label: 'Scenarios' },
  ];

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    setActiveTab(tabs[nextIndex].id);
    const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[nextIndex]?.focus();
  };

  return (
    <div
      ref={tabListRef}
      role="tablist"
      aria-label="Celebration Planning Sections"
      className="flex gap-1 border-b border-[#E6E7EE] dark:border-[#2C3040] my-6 overflow-x-auto scrollbar-none"
    >
      {tabs.map((tab, idx) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`min-h-[44px] px-4 py-2 font-bold text-sm whitespace-nowrap transition-colors border-b-2 -mb-[2px] ${
              isActive
                ? 'text-[#2E2A7A] dark:text-[#A9A5EE] border-[#2E2A7A] dark:border-[#A9A5EE]'
                : 'text-[#5B6070] dark:text-[#C9CCD8] border-transparent hover:text-[#2E2A7A] dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
