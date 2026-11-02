'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarHeart, Plus, Sparkles } from 'lucide-react';
import Navbar from '@/components/layout/navbar/Navbar';
import { Footer } from '@/components/Footer';
import { GeneratedEventPlan } from '@/domain/event-planner/types';
import { getStoredEvents, deleteStoredEvent, selectActiveEvent, clearActiveEvent } from '@/domain/event-planner/events-storage';
import { EventCard } from '@/features/events/EventCard';
import { DeleteEventDialog } from '@/features/events/DeleteEventDialog';

export default function EventsListPage() {
  const router = useRouter();
  const [events, setEvents] = useState<GeneratedEventPlan[]>([]);
  const [eventToDelete, setEventToDelete] = useState<GeneratedEventPlan | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const loaded = getStoredEvents();
    setEvents(loaded);
    setIsInitialized(true);
  }, []);

  const handleOpenPlan = (plan: GeneratedEventPlan) => {
    selectActiveEvent(plan.id);
    router.push('/plan');
  };

  const handleEditPlan = (plan: GeneratedEventPlan) => {
    selectActiveEvent(plan.id);
    router.push('/plan?edit=true');
  };

  const handleCreateNewEvent = () => {
    clearActiveEvent();
    router.push('/plan?new=true');
  };

  const handleDeleteRequest = (plan: GeneratedEventPlan) => {
    setEventToDelete(plan);
    deleteDialogRef.current?.showModal();
  };

  const handleConfirmDelete = () => {
    if (!eventToDelete) return;
    const updated = deleteStoredEvent(eventToDelete.id);
    setEvents(updated);
    setAnnouncement(`Event "${eventToDelete.input.eventName}" was successfully deleted.`);
    setEventToDelete(null);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7FA] dark:bg-[#14161C]">
        <div className="w-8 h-8 border-4 border-[#F5A524] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7FA] dark:bg-[#14161C] text-[#14161C] dark:text-white transition-colors duration-200">
      <Navbar />

      <header
        style={{ backgroundColor: '#2E2A7A', minHeight: '360px' }}
        className="relative w-full bg-[#2E2A7A] text-white min-h-[360px] flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 border-b border-[#F5A524]/30 shadow-2xl overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-purple-400/10 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none"
        />

        <div className="relative max-w-[1360px] mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#FFD98A] bg-[#F5A524]/15 border border-[#F5A524]/40 px-3.5 py-1.5 rounded-full mb-3.5 shadow-xs">
              <Sparkles size={14} className="text-[#FFD98A]" />
              <span>Events Hub</span>
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-3 font-serif sm:font-sans">
              My Celebration Events
            </h1>
            <p className="text-purple-100/90 text-sm sm:text-base max-w-xl font-normal leading-relaxed">
              Track, refine, and manage all your saved celebration blueprints and milestones in one place.
            </p>
          </div>

          {events.length > 0 && (
            <button
              type="button"
              onClick={handleCreateNewEvent}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#F5A524] hover:bg-[#D78B13] text-[#14161C] font-extrabold text-sm sm:text-base transition-all shadow-lg hover:shadow-xl active:scale-95 self-start sm:self-auto shrink-0 cursor-pointer"
            >
              <Plus size={18} className="text-[#14161C]" />
              <span>Create new event</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        <div aria-live="polite" className="sr-only">{announcement}</div>

        {/* Events Cards View or Empty State */}
        {events.length === 0 ? (
          <div className="text-center py-16 sm:py-24 px-4 rounded-3xl bg-white dark:bg-[#1C1F2B] border border-dashed border-slate-300 dark:border-slate-800 max-w-xl mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-[#2E2A7A] dark:text-[#FFD98A] flex items-center justify-center mx-auto mb-4 shadow-xs">
              <CalendarHeart size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 font-serif sm:font-sans">
              No celebration events yet
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
              Plan your weddings, birthday milestones, cultural festivals, or hackathons in three simple steps.
            </p>
            <button
              type="button"
              onClick={handleCreateNewEvent}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#2E2A7A] to-[#1E1B4B] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={16} className="text-[#FFD98A]" />
              <span>Start a new plan</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => (
              <EventCard
                key={evt.id}
                plan={evt}
                onOpen={handleOpenPlan}
                onEdit={handleEditPlan}
                onDeleteRequest={handleDeleteRequest}
              />
            ))}
          </div>
        )}
      </main>

      <DeleteEventDialog
        dialogRef={deleteDialogRef}
        eventName={eventToDelete?.input.eventName || ''}
        onConfirmDelete={handleConfirmDelete}
      />

      <Footer />
    </div>
  );
}
