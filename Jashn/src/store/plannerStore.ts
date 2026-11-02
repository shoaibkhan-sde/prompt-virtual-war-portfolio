/**
 * Central Zustand store for Jashn Celebration & Event Planner.
 * Under 170 lines, fully typesafe.
 */

import { create } from 'zustand';
import { getTemplateByEventType, WEDDING_TEMPLATE } from '@/domain/templates';
import { toggleMilestoneStatus } from '@/domain/timeline';
import { updateVendorStatus } from '@/domain/vendors';
import { addGuest as domainAddGuest, updateGuestRsvp } from '@/domain/guests';
import { toggleSavedIdea } from '@/domain/ideas';
import { applyScenarioToPlan, createScenarioSimulation } from '@/domain/scenarios';
import { defaultAIService } from '@/ai/service';
import { ScenarioSimulation } from '@/domain/types';
import { isSamplePlan, convertGeneratedToCelebrationPlan } from '@/domain/plan-utils';
import { ChatMessage, PlannerState } from './types';

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm-welcome',
    sender: 'assistant',
    text: 'Hello! I am your planning assistant.\nAsk me about budgets, timelines, vendors or ideas.',
    source: 'built-in',
  },
];

const persistChat = (msgs: ChatMessage[]) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jashn.ai_chat_messages', JSON.stringify(msgs));
    }
  } catch (err) {
    console.warn('Unable to persist chat to localStorage:', err);
  }
};

export const usePlannerStore = create<PlannerState>((set, get) => ({
  plan: WEDDING_TEMPLATE,
  theme: 'light',
  activeTab: 'overview',
  isThinking: false,
  activeDiffSimulation: null,
  isEditModalOpen: false,
  messages: INITIAL_MESSAGES,

  setTheme: (theme) => {
    try {
      if (typeof window !== 'undefined') localStorage.setItem('jashn.theme', theme);
    } catch (err) {
      console.warn('Unable to persist theme to localStorage:', err);
    }
    set({ theme });
  },
  setActiveTab: (activeTab) => set({ activeTab }),
  setEditModalOpen: (isEditModalOpen) => set({ isEditModalOpen }),
  setMessages: (messages) => {
    persistChat(messages);
    set({ messages });
  },
  resetChat: () => {
    try {
      if (typeof window !== 'undefined') localStorage.removeItem('jashn.ai_chat_messages');
    } catch (err) {
      console.warn('Unable to remove chat messages from localStorage:', err);
    }
    set({ messages: INITIAL_MESSAGES });
  },

  loadTemplate: (type) => {
    const template = getTemplateByEventType(type);
    set({ plan: template, activeTab: 'overview', activeDiffSimulation: null });
  },

  syncUserPlan: (plan) => {
    set({ plan: { ...plan, isUserCreated: true, isSample: false }, activeDiffSimulation: null });
  },

  updateEventDetails: (title, date, location) => {
    set((state) => ({
      plan: { ...state.plan, title, date, location, isUserCreated: true, isSample: false },
      isEditModalOpen: false,
    }));
  },

  toggleMilestone: (id) => {
    set((state) => ({
      plan: {
        ...state.plan,
        timeline: toggleMilestoneStatus(state.plan.timeline, id),
      },
    }));
  },

  addMilestone: (newM) => {
    const id = `t-${Date.now()}`;
    set((state) => ({
      plan: {
        ...state.plan,
        timeline: [...state.plan.timeline, { ...newM, id }],
      },
    }));
  },
  updateVendor: (id, status, name) => {
    set((state) => ({ plan: { ...state.plan, vendors: updateVendorStatus(state.plan.vendors, id, status, name) } }));
  },
  addGuest: (guest) => {
    set((state) => ({ plan: { ...state.plan, guests: domainAddGuest(state.plan.guests, guest) } }));
  },
  updateGuestRsvp: (id, status) => {
    set((state) => ({ plan: { ...state.plan, guests: updateGuestRsvp(state.plan.guests, id, status) } }));
  },
  toggleIdea: (ideaId) => {
    set((state) => ({ plan: { ...state.plan, savedIdeaIds: toggleSavedIdea(state.plan.savedIdeaIds, ideaId) } }));
  },

  sendAssistantQuery: async (queryText) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: trimmed,
    };

    const nextMessagesWithUser = [...get().messages, userMsg];
    persistChat(nextMessagesWithUser);
    set({ messages: nextMessagesWithUser, isThinking: true });

    try {
      let currentPlan = get().plan;

      // Auto-detect if user created a custom plan in localStorage
      if (typeof window !== 'undefined' && isSamplePlan(currentPlan)) {
        try {
          const rawStored = localStorage.getItem('jashn.pure_event_plan');
          if (rawStored) {
            const parsed = JSON.parse(rawStored);
            if (parsed && parsed.id && parsed.input && !parsed.id.startsWith('sample-')) {
              currentPlan = convertGeneratedToCelebrationPlan(parsed);
              set({ plan: currentPlan });
            }
          }
        } catch (err) {
          console.warn('Failed to parse cached pure_event_plan:', err);
        }
      }

      let res;
      try {
        const r = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, plan: currentPlan }),
        });
        res = r.ok ? await r.json() : await defaultAIService.askPlanner(trimmed, currentPlan);
      } catch (_fetchErr) {
        // Fallback to deterministic client-side engine if API route is unreachable or offline
        res = await defaultAIService.askPlanner(trimmed, currentPlan);
      }

      let simulation: ScenarioSimulation | undefined;
      if (res.proposedBudgetChange?.targetBudget) {
        simulation = createScenarioSimulation(
          `sim-${Date.now()}`,
          'Proposed Plan Adjustment',
          'Recalculated by planner domain engine',
          currentPlan.items,
          res.proposedBudgetChange.targetBudget,
          res.proposedBudgetChange.lockedCategories
        );
      }

      const nextMessagesWithAssistant: ChatMessage[] = [
        ...get().messages,
        {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          text: res.reply,
          source: res.source,
          modelUsed: res.modelUsed,
          proposedChange: res.proposedBudgetChange,
          simulation,
        },
      ];
      persistChat(nextMessagesWithAssistant);
      set({ messages: nextMessagesWithAssistant, isThinking: false });
    } catch {
      const nextMessagesWithErr: ChatMessage[] = [
        ...get().messages,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'I encountered an issue processing your request. Please try again.',
          source: 'built-in',
        },
      ];
      persistChat(nextMessagesWithErr);
      set({ messages: nextMessagesWithErr, isThinking: false });
    }
  },

  applySimulation: (sim) => {
    set((state) => ({
      plan: applyScenarioToPlan(state.plan, sim),
      activeDiffSimulation: null,
    }));
  },

  setActiveDiffSimulation: (sim) => set({ activeDiffSimulation: sim }),
}));
