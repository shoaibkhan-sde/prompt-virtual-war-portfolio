/**
 * Pure domain types for Jashn Celebration & Event Planner.
 * Zero external dependencies, pure TypeScript interfaces & types.
 */

export type EventType = 'wedding' | 'birthday' | 'community' | 'festival';

export type ExpenseCategory =
  | 'venue'
  | 'catering'
  | 'decor'
  | 'photography'
  | 'attire'
  | 'entertainment'
  | 'invitations'
  | 'gifts'
  | 'miscellaneous';

export interface BudgetItem {
  id: string;
  category: ExpenseCategory;
  name: string;
  allocatedAmount: number; // in integer currency units (e.g. INR rupees)
  spentAmount: number;
  notes?: string;
}

export interface CategorySummary {
  category: ExpenseCategory;
  name: string;
  allocated: number;
  spent: number;
  percentageOfTotal: number;
  percentageSpent: number;
}

export interface BudgetTotals {
  totalBudget: number;
  totalAllocated: number;
  totalSpent: number;
  unallocated: number;
  reservePercentage: number;
  reserveAmount: number;
  effectiveAvailable: number;
  costPerGuest: number;
  categories: CategorySummary[];
}

export type TimelineStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export interface TimelineMilestone {
  id: string;
  title: string;
  dueDate: string; // ISO YYYY-MM-DD
  category: ExpenseCategory | 'general' | 'ceremony' | 'logistics';
  status: TimelineStatus;
  urgencyLabel?: string; // e.g. "In 6 days", "Done", "Today"
  description?: string;
  estimatedDaysBeforeEvent: number;
}

export type VendorStatus = 'not_started' | 'contacted' | 'tasting_set' | 'quote_received' | 'booked';

export interface VendorItem {
  id: string;
  category: ExpenseCategory;
  role: string; // e.g. "Venue", "Caterer", "Photographer"
  name?: string;
  status: VendorStatus;
  deadlineDate: string; // ISO YYYY-MM-DD
  allocatedBudget: number;
  contactInfo?: string;
  notes?: string;
}

export type RsvpStatus = 'confirmed' | 'pending' | 'declined';

export interface GuestItem {
  id: string;
  name: string;
  status: RsvpStatus;
  group?: string; // e.g. "Family", "Friends", "Colleagues"
  plusOnes: number;
  dietaryRestrictions?: string;
}

export interface GuestSummary {
  totalInvited: number;
  confirmedCount: number;
  pendingCount: number;
  declinedCount: number;
  costPerConfirmedGuest: number;
}

export interface IdeaItem {
  id: string;
  eventType: EventType;
  category: 'decor' | 'food' | 'entertainment' | 'ritual' | 'sustainable';
  title: string;
  description: string;
  estimatedCostRange: 'budget' | 'moderate' | 'luxury';
  culturalContext?: string; // e.g. "Traditional Maharashtrian", "Modern Fusion"
  tags: string[];
}

export interface ScenarioAdjustment {
  categoryId: ExpenseCategory;
  oldAmount: number;
  newAmount: number;
  difference: number;
}

export interface ScenarioSimulation {
  id: string;
  name: string;
  description: string;
  oldTotalBudget: number;
  newTotalBudget: number;
  totalDifference: number;
  adjustments: ScenarioAdjustment[];
  lockedCategories: ExpenseCategory[];
}

export interface CelebrationPlan {
  id: string;
  eventType: EventType;
  title: string;
  date: string; // ISO YYYY-MM-DD
  location: string;
  totalBudget: number;
  reservePercentage: number;
  items: BudgetItem[];
  timeline: TimelineMilestone[];
  vendors: VendorItem[];
  guests: GuestItem[];
  savedIdeaIds: string[];
  isSample?: boolean;
  isUserCreated?: boolean;
}
