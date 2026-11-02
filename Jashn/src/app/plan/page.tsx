'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/layout/navbar/Navbar';
import { Footer } from '@/components/Footer';
import { Wizard } from '@/features/plan/Wizard';
import { PlanHeroBanner } from '@/features/plan/PlanHeroBanner';
import { PlanResultsView } from '@/features/plan/PlanResultsView';
import { GeneratedEventPlan } from '@/domain/event-planner/types';
import { PartyPopperCelebration } from '@/features/plan/PartyPopperCelebration';
import {
  deserializePlanFromUrlFragment,
  exportPlanAsChecklistText,
  generateIcsCalendar,
  serializePlanToUrlFragment,
} from '@/domain/event-planner/export-utils';
import { saveStoredEvent, clearActiveEvent, STORAGE_KEY_ACTIVE } from '@/domain/event-planner/events-storage';
import { usePlannerStore } from '@/store/plannerStore';
import { convertGeneratedToCelebrationPlan } from '@/domain/plan-utils';

const STORAGE_KEY = STORAGE_KEY_ACTIVE;

export default function PlanEventPage() {
  const [plan, setPlan] = useState<GeneratedEventPlan | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [shareCopied, setShareCopied] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Initial Mount: Check URL Fragment (#plan=), Query (?new=true / ?edit=true), or LocalStorage
  useEffect(() => {
    try {
      const search = typeof window !== 'undefined' ? window.location.search : '';
      const isNew = search.includes('new=true');
      const isEdit = search.includes('edit=true');

      if (isNew) {
        localStorage.removeItem(STORAGE_KEY);
        setPlan(null);
        setIsEditing(false);
        setAnnouncement('Ready to design a new celebration plan.');
        setIsInitialized(true);
        return;
      }

      if (isEdit) {
        setIsEditing(true);
      }

      const hash = window.location.hash;
      if (hash && hash.includes('plan=')) {
        const decoded = deserializePlanFromUrlFragment(hash);
        if (decoded) {
          setPlan(decoded);
          setAnnouncement('Shared plan successfully loaded from URL link.');
          setIsInitialized(true);
          return;
        }
      }
      const rawStored = localStorage.getItem(STORAGE_KEY);
      if (rawStored) {
        const parsed = JSON.parse(rawStored);
        if (parsed && parsed.id && parsed.input && parsed.budget && parsed.timeline) {
          setPlan(parsed);
          usePlannerStore.getState().syncUserPlan(convertGeneratedToCelebrationPlan(parsed));
          setAnnouncement('Previous celebration plan restored from browser storage.');
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // 2. Persist to Local Storage & Multi-Events Store
  const handleUpdatePlan = (updatedPlan: GeneratedEventPlan) => {
    setPlan(updatedPlan);
    saveStoredEvent(updatedPlan);
    usePlannerStore.getState().syncUserPlan(convertGeneratedToCelebrationPlan(updatedPlan));
  };

  const handlePlanCreated = (newPlan: GeneratedEventPlan) => {
    handleUpdatePlan(newPlan);
    setIsEditing(false);
    if (typeof window !== 'undefined' && window.location.search.includes('edit=true')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    setShowCelebration(true);
    setAnnouncement(`Celebration plan updated for "${newPlan.input.eventName}".`);
  };

  const handleStartEditDetails = () => {
    setIsEditing(true);
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // Ignore
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (typeof window !== 'undefined' && window.location.search.includes('edit=true')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // Ignore
    }
  };

  const handleClearPlan = () => {
    clearActiveEvent();
    setShowCelebration(false);
    setIsEditing(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
      if (typeof window !== 'undefined' && (window.location.hash || window.location.search)) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // Ignore
    }
    setPlan(null);
    setAnnouncement('Celebration plan cleared from this workspace. You can still access it from Events.');
  };

  const handleStartNewPlan = () => {
    clearActiveEvent();
    setShowCelebration(false);
    setIsEditing(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
      if (typeof window !== 'undefined' && (window.location.hash || window.location.search)) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // Ignore
    }
    setPlan(null);
    setAnnouncement('Ready to design a new celebration plan.');
  };

  const handleExportIcs = () => {
    if (!plan) return;
    const blob = new Blob([generateIcsCalendar(plan)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${plan.input.eventName.toLowerCase().replace(/\s+/g, '-')}-deadlines.ics`;
    link.click();
    URL.revokeObjectURL(url);
    setAnnouncement('Calendar .ics export downloaded.');
  };

  const handleDownloadText = () => {
    if (!plan) return;
    const blob = new Blob([exportPlanAsChecklistText(plan)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${plan.input.eventName.toLowerCase().replace(/\s+/g, '-')}-checklist.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setAnnouncement('Plan text summary downloaded.');
  };

  const handlePrintChecklist = () => {
    setAnnouncement('Preparing print layout.');
    window.print();
  };

  const handleCopyShareLink = async () => {
    if (!plan) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}#plan=${serializePlanToUrlFragment(plan)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setAnnouncement('Shareable plan link copied to clipboard.');
      setTimeout(() => setShareCopied(false), 3000);
    } catch {
      setAnnouncement('Could not copy link automatically.');
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7FA] dark:bg-[#14161C]">
        <div className="w-8 h-8 border-4 border-[#F5A524] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Determine active stepper stage based on plan presence and user progress
  let currentStep = 1;
  if (plan && !isEditing) {
    const totalTasks = plan.timeline.tasks.length;
    const completedTasks = plan.timeline.tasks.filter((t) => t.isCompleted).length;
    const taskPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const readinessScore = plan.readiness?.score ?? 0;

    // Combined Completion Condition (Option 1 + Option 2):
    // 1) 100% of tasks completed (all ticks full), OR
    // 2) High milestone completion (>= 80% tasks done OR readiness score >= 80 "Ready to Celebrate")
    const isStep3Completed =
      (totalTasks > 0 && completedTasks === totalTasks) ||
      taskPercent >= 80 ||
      readinessScore >= 80;

    if (isStep3Completed) {
      currentStep = 4; // All 3 steps complete with green checkmarks
    } else {
      const hasProgress =
        plan.budget.categories.some((c) => (c.actualSpent || 0) > 0) ||
        completedTasks > 0 ||
        plan.vendors.vendors.some((v) => v.isBooked || (v.completedSteps || 0) > 0);
      currentStep = hasProgress ? 3 : 2;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7FA] dark:bg-[#14161C] text-[#14161C] dark:text-white transition-colors duration-200">
      <Navbar />
      <PlanHeroBanner currentStep={currentStep} />
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {plan && !isEditing ? (
          <PlanResultsView
            plan={plan}
            onUpdatePlan={handleUpdatePlan}
            onClearPlan={handleClearPlan}
            onStartNewPlan={handleStartNewPlan}
            onEditDetails={handleStartEditDetails}
            announcement={announcement}
            onExportIcs={handleExportIcs}
            onDownloadText={handleDownloadText}
            onPrintChecklist={handlePrintChecklist}
            onCopyShareLink={handleCopyShareLink}
            shareCopied={shareCopied}
          />
        ) : (
          <Wizard
            initialPlan={isEditing ? plan : null}
            onPlanCreated={handlePlanCreated}
            onClearPlan={handleClearPlan}
            onCancelEdit={plan ? handleCancelEdit : undefined}
          />
        )}
      </main>
      <PartyPopperCelebration
        show={showCelebration}
        eventName={plan?.input.eventName || ''}
        onClose={() => setShowCelebration(false)}
      />
      <Footer />
    </div>
  );
}
