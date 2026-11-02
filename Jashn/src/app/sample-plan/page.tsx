'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/Footer';
import { Wizard } from '@/features/plan/Wizard';
import { PlanResultsView } from '@/features/plan/PlanResultsView';
import { SAMPLE_PLANS } from '@/domain/event-planner/sample-plans';
import { GeneratedEventPlan } from '@/domain/event-planner/types';
import {
  exportPlanAsChecklistText,
  generateIcsCalendar,
  serializePlanToUrlFragment,
} from '@/domain/event-planner/export-utils';
import { Sparkles, ArrowRight, RotateCcw } from 'lucide-react';

export default function SamplePlanPage() {
  const router = useRouter();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('wedding');
  const [currentPlan, setCurrentPlan] = useState<GeneratedEventPlan>(() => {
    return JSON.parse(JSON.stringify(SAMPLE_PLANS[0].plan));
  });
  const [isEditing, setIsEditing] = useState(false);
  const [announcement, setAnnouncement] = useState('Demonstration celebration plan loaded.');
  const [shareCopied, setShareCopied] = useState(false);

  const handleSelectTemplate = (id: string) => {
    const template = SAMPLE_PLANS.find((t) => t.id === id);
    if (!template) return;
    setSelectedTemplateId(id);
    setCurrentPlan(JSON.parse(JSON.stringify(template.plan)));
    setIsEditing(false);
    setAnnouncement(`Loaded sample plan for "${template.label}".`);
  };

  const handleResetSample = () => {
    const template = SAMPLE_PLANS.find((t) => t.id === selectedTemplateId) || SAMPLE_PLANS[0];
    setCurrentPlan(JSON.parse(JSON.stringify(template.plan)));
    setIsEditing(false);
    setAnnouncement(`Sample plan reset to original blueprint.`);
  };

  const handleUpdatePlan = (updatedPlan: GeneratedEventPlan) => {
    setCurrentPlan(updatedPlan);
  };

  const handleStartEditDetails = () => {
    setIsEditing(true);
    setAnnouncement(`Editing details for "${currentPlan.input.eventName}".`);
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // Ignore
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // Ignore
    }
  };

  const handlePlanUpdated = (updatedPlan: GeneratedEventPlan) => {
    setCurrentPlan(updatedPlan);
    setIsEditing(false);
    setAnnouncement(`Sample plan updated for "${updatedPlan.input.eventName}".`);
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // Ignore
    }
  };

  const handleExportIcs = () => {
    const blob = new Blob([generateIcsCalendar(currentPlan)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentPlan.input.eventName.toLowerCase().replace(/\s+/g, '-')}-sample-deadlines.ics`;
    link.click();
    URL.revokeObjectURL(url);
    setAnnouncement('Calendar .ics export downloaded.');
  };

  const handleDownloadText = () => {
    const blob = new Blob([exportPlanAsChecklistText(currentPlan)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentPlan.input.eventName.toLowerCase().replace(/\s+/g, '-')}-sample-checklist.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setAnnouncement('Sample plan text summary downloaded.');
  };

  const handlePrintChecklist = () => {
    setAnnouncement('Preparing print layout.');
    window.print();
  };

  const handleCopyShareLink = async () => {
    const shareUrl = `${window.location.origin}/plan#plan=${serializePlanToUrlFragment(currentPlan)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setAnnouncement('Shareable plan link copied to clipboard.');
      setTimeout(() => setShareCopied(false), 3000);
    } catch {
      setAnnouncement('Could not copy link automatically.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7FA] dark:bg-[#14161C] text-[#14161C] dark:text-white transition-colors duration-200">
      <Navbar />

      {/* Sample Plan Top Notice Banner */}
      <div className="bg-[#2E2A7A] text-white py-3.5 px-4 sm:px-6 border-b border-[#F5A524]/20 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
            <span className="px-2.5 py-0.5 rounded-full bg-[#F5A524] text-[#14161C] font-black uppercase text-[10px] tracking-wider shadow-xs">
              Sample Plan Mode
            </span>
            <span className="text-purple-100 font-medium">
              You are exploring a live celebration blueprint. All features below match the real planner.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 print:hidden">
            <button
              type="button"
              onClick={handleResetSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset sample</span>
            </button>
            <Link
              href="/plan?new=true"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#F5A524] to-[#E09419] text-[#14161C] font-bold text-xs shadow-md hover:brightness-105 transition-all cursor-pointer"
            >
              <span>Start your own plan</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
        {/* Archetype Template Switcher Bar */}
        <div className="max-w-5xl mx-auto p-4 rounded-2xl bg-white dark:bg-[#1C1F2B] border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#F5A524]" />
              <span>Select Demonstration Archetype:</span>
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              4 distinct event models available
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {SAMPLE_PLANS.map((tmpl) => {
              const isSelected = selectedTemplateId === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-[#2E2A7A] dark:border-[#FFD98A] shadow-xs ring-2 ring-[#F5A524]/20'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-base">{tmpl.emoji}</span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {tmpl.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {tmpl.summary}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Aligned Plan View or In-Place Edit Wizard */}
        {isEditing ? (
          <Wizard
            initialPlan={currentPlan}
            onPlanCreated={handlePlanUpdated}
            onClearPlan={handleResetSample}
            onCancelEdit={handleCancelEdit}
          />
        ) : (
          <PlanResultsView
            plan={currentPlan}
            onUpdatePlan={handleUpdatePlan}
            onClearPlan={handleResetSample}
            onStartNewPlan={() => router.push('/plan?new=true')}
            onEditDetails={handleStartEditDetails}
            announcement={announcement}
            onDownloadText={handleDownloadText}
            onPrintChecklist={handlePrintChecklist}
            onExportIcs={handleExportIcs}
            onCopyShareLink={handleCopyShareLink}
            shareCopied={shareCopied}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
