import {
  CelebrationPlan,
  EventType,
  GuestItem,
  RsvpStatus,
  ScenarioSimulation,
  TimelineMilestone,
  VendorStatus,
} from '@/domain/types';
import { AssistantResponse } from '@/ai/schemas';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  source?: 'gemini' | 'built-in';
  modelUsed?: string;
  proposedChange?: AssistantResponse['proposedBudgetChange'];
  simulation?: ScenarioSimulation;
}

export interface PlannerState {
  plan: CelebrationPlan;
  theme: 'light' | 'dark';
  activeTab: string;
  messages: ChatMessage[];
  isThinking: boolean;
  activeDiffSimulation: ScenarioSimulation | null;
  isEditModalOpen: boolean;

  setTheme: (theme: 'light' | 'dark') => void;
  setActiveTab: (tab: string) => void;
  loadTemplate: (type: EventType) => void;
  setEditModalOpen: (open: boolean) => void;
  updateEventDetails: (title: string, date: string, location: string) => void;
  toggleMilestone: (id: string) => void;
  addMilestone: (milestone: Omit<TimelineMilestone, 'id'>) => void;
  updateVendor: (id: string, status: VendorStatus, name?: string) => void;
  addGuest: (guest: Omit<GuestItem, 'id'>) => void;
  updateGuestRsvp: (id: string, status: RsvpStatus) => void;
  toggleIdea: (ideaId: string) => void;
  sendAssistantQuery: (query: string) => Promise<void>;
  setMessages: (messages: ChatMessage[]) => void;
  resetChat: () => void;
  applySimulation: (sim: ScenarioSimulation) => void;
  setActiveDiffSimulation: (sim: ScenarioSimulation | null) => void;
  syncUserPlan: (plan: CelebrationPlan) => void;
}
