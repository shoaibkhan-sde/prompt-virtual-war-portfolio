/**
 * Pure domain types for the Plan an Event system.
 * Zero UI, zero framework dependencies.
 */

export type EventTypeId =
  | 'wedding'
  | 'birthday'
  | 'college_fest'
  | 'hackathon'
  | 'tech_meetup'
  | 'community_event';

export type BudgetTier = 'lean' | 'standard' | 'premium';

export type VenueType = 'indoor' | 'outdoor' | 'hybrid' | 'online';

export type DietaryType = 'veg_only' | 'vegan' | 'jain' | 'halal' | 'none';

export type TaskPhase =
  | 'foundations'
  | 'booking'
  | 'details'
  | 'final_week'
  | 'event_day'
  | 'after';

export interface PlanRequestRaw {
  eventType?: unknown;
  eventName?: unknown;
  eventDate?: unknown;
  todayDate?: unknown;
  startTime?: unknown;
  durationHours?: unknown;
  venueType?: unknown;
  city?: unknown;
  theme?: unknown;
  interests?: unknown;
  guestCount?: unknown;
  secondaryGuestCount?: unknown;
  dietaryRequirement?: unknown;
  alcoholServed?: unknown;
  currency?: unknown;
  totalBudget?: unknown;
  budgetTier?: unknown;
  priorities?: unknown;
  sponsorshipTarget?: unknown;
  prizePool?: unknown;
}

export interface ValidatedPlanInput {
  eventType: EventTypeId;
  eventName: string;
  eventDate: string; // YYYY-MM-DD
  guestCount: number;
  currency: string;
  totalBudget: number;
  budgetTier: BudgetTier;
  priorities: string[];
  city?: string;
  theme?: string;
  interests: string[];
  startTime?: string;
  durationHours?: number;
  venueType: VenueType;
  dietaryRequirement: DietaryType;
  alcoholServed: boolean;
  secondaryGuestCount: number;
  sponsorshipTarget?: number;
  prizePool?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface CategoryBudgetLine {
  categoryId: string;
  categoryName: string;
  allocatedAmount: number;
  actualSpent: number;
  sharePercent: number;
  isPriority: boolean;
  varianceStatus: string;
}

export interface BudgetPlan {
  totalBudget: number;
  contingencyPercent: number;
  contingencyAmount: number;
  contingencySpent?: number;
  distributableBudget: number;
  categories: CategoryBudgetLine[];
  tierComparison?: {
    leanDiffSummary?: string;
    premiumDiffSummary?: string;
  };
}

export interface TimelineTask {
  id: string;
  title: string;
  phase: TaskPhase;
  scheduledDate: string; // YYYY-MM-DD
  offsetDays: number;
  dependsOn: string[];
  isCompleted: boolean;
  isCriticalPath: boolean;
  isBlockingOtherTasks: boolean;
  blockedBy?: string[];
  statusText: string;
}

export interface TimelinePlan {
  isCompressed: boolean;
  compressionNotice?: string;
  tasks: TimelineTask[];
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

export interface VendorRequirement {
  id: string;
  categoryId: string;
  role: string;
  allocatedBudget: number;
  bookingDeadline: string; // YYYY-MM-DD
  isEssential: boolean;
  isPriorityLinked: boolean;
  checklistSteps: string[];
  questionsToAsk: string[];
  isBooked: boolean;
  completedSteps: number;
  totalSteps: number;
}

export interface VendorPlan {
  vendors: VendorRequirement[];
  totalVendors: number;
  bookedVendors: number;
}

export interface RankedIdea {
  id: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  matchedKeywords: string[];
  relevanceScore: number;
  source: 'builtin' | 'ai';
}

export interface ReadinessScore {
  score: number; // 0 to 100
  level: 'Initial Planning' | 'Gaining Momentum' | 'Well Prepared' | 'Ready to Celebrate';
  breakdown: {
    taskScore: number;
    vendorScore: number;
    budgetScore: number;
  };
  plainLanguageReason: string;
}

export interface GeneratedEventPlan {
  id: string;
  createdAt: string;
  updatedAt: string;
  input: ValidatedPlanInput;
  budget: BudgetPlan;
  timeline: TimelinePlan;
  vendors: VendorPlan;
  ideas: RankedIdea[];
  readiness: ReadinessScore;
}

export interface EventDefinition {
  id: EventTypeId;
  displayName: string;
  tagline: string;
  recommendedLeadDays: number;
  minGuests: number;
  maxGuests: number;
  minBudget: number;
  maxBudget: number;
  defaultCurrency: string;
  primaryGuestLabel: string;
  secondaryGuestLabel?: string;
  allowAlcohol: boolean;
  requiresSponsorshipTarget?: boolean;
  requiresPrizePool?: boolean;
  categories: Array<{
    id: string;
    name: string;
    baseWeight: number;
    leanModifier?: number;
    premiumModifier?: number;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    phase: TaskPhase;
    offsetDays: number;
    dependsOn: string[];
  }>;
  vendors: Array<{
    id: string;
    categoryId: string;
    role: string;
    leadDays: number;
    isEssential: boolean;
    checklistSteps: string[];
    questionsToAsk: string[];
  }>;
  ideas: Array<{
    id: string;
    categoryId?: string;
    category?: string;
    title: string;
    summary?: string;
    description?: string;
    tags: string[];
    minTier?: BudgetTier;
    minGuests?: number;
    maxGuests?: number;
    venueType?: VenueType;
    venueTypes?: VenueType[];
  }>;
}

export interface WhatIfDiff {
  originalGuestCount: number;
  proposedGuestCount: number;
  originalBudget: number;
  proposedBudget: number;
  budgetDeltas: Array<{
    categoryId: string;
    categoryName: string;
    oldAmount: number;
    newAmount: number;
    delta: number;
  }>;
  newContingency: number;
  explanatoryNotes: string[];
}
