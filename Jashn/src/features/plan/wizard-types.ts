import { BudgetTier, DietaryType, VenueType } from '@/domain/event-planner/types';

export interface WizardDraftState {
  eventType: string;
  eventName: string;
  eventDate: string;
  startTime: string;
  durationHours: string;
  venueType: VenueType;
  city: string;
  guestCount: string;
  secondaryGuestCount: string;
  dietaryRequirement: DietaryType;
  alcoholServed: boolean;
  currency: string;
  totalBudget: string;
  budgetTier: BudgetTier;
  priorities: string[];
  theme: string;
  interests: string;
  sponsorshipTarget: string;
  prizePool: string;
}

export type WizardStepNumber = 1 | 2 | 3 | 4;

export type PlanViewTab = 'overview' | 'budget' | 'timeline' | 'vendors' | 'ideas' | 'whatif';
