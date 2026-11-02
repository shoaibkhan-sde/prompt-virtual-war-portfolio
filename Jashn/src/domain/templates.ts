/**
 * Pure domain starter templates for various celebration types.
 * Faithful to the Main.dc design specification.
 */

import { CelebrationPlan, EventType } from './types';

export const WEDDING_TEMPLATE: CelebrationPlan = {
  id: 'plan-wedding-priya-arjun',
  eventType: 'wedding',
  title: 'Priya & Arjun’s Wedding',
  date: '2027-02-20',
  location: 'Nanded, Maharashtra',
  totalBudget: 1800000,
  reservePercentage: 5,
  items: [
    { id: 'b-1', category: 'venue', name: 'Grand Heritage Hall & Lawns', allocatedAmount: 450000, spentAmount: 225000 },
    { id: 'b-2', category: 'catering', name: 'Maharashtrian & North Indian Feast', allocatedAmount: 540000, spentAmount: 100000 },
    { id: 'b-3', category: 'decor', name: 'Mandap, Floral Stage & Lighting', allocatedAmount: 216000, spentAmount: 0 },
    { id: 'b-4', category: 'photography', name: 'Candid & Traditional Photo/Video', allocatedAmount: 162000, spentAmount: 50000 },
    { id: 'b-5', category: 'attire', name: 'Bridal Paithani & Groom Sherwani', allocatedAmount: 144000, spentAmount: 20000 },
    { id: 'b-6', category: 'entertainment', name: 'Sangeet DJ, Dhol Tasha & Sound', allocatedAmount: 108000, spentAmount: 0 },
    { id: 'b-7', category: 'miscellaneous', name: 'Contingency & Hospitality', allocatedAmount: 180000, spentAmount: 0 },
  ],
  timeline: [
    { id: 't-1', title: 'Pay venue deposit', dueDate: '2026-10-12', category: 'venue', status: 'completed', estimatedDaysBeforeEvent: 130, description: '₹2,25,000 paid to secure auspicious muhurat' },
    { id: 't-2', title: 'Book photographer', dueDate: '2026-10-31', category: 'photography', status: 'pending', estimatedDaysBeforeEvent: 112, description: 'Popular dates fill 4 months ahead' },
    { id: 't-3', title: 'Send save-the-dates', dueDate: '2026-11-06', category: 'invitations', status: 'pending', estimatedDaysBeforeEvent: 106, description: 'Out-of-town guests need travel notice' },
    { id: 't-4', title: 'Caterer menu tasting', dueDate: '2026-11-07', category: 'catering', status: 'pending', estimatedDaysBeforeEvent: 105, description: 'Confirm vegetarian and Jain options' },
  ],
  vendors: [
    { id: 'v-1', category: 'venue', role: 'Venue', name: 'Grand Heritage Lawns', status: 'booked', deadlineDate: '2026-10-12', allocatedBudget: 450000 },
    { id: 'v-2', category: 'catering', role: 'Caterer', name: 'Swad Caterers', status: 'tasting_set', deadlineDate: '2026-11-15', allocatedBudget: 540000 },
    { id: 'v-3', category: 'photography', role: 'Photographer', status: 'not_started', deadlineDate: '2026-10-31', allocatedBudget: 162000 },
    { id: 'v-4', category: 'decor', role: 'Decorator', status: 'not_started', deadlineDate: '2026-11-30', allocatedBudget: 216000 },
    { id: 'v-5', category: 'entertainment', role: 'DJ & band', status: 'not_started', deadlineDate: '2026-12-15', allocatedBudget: 108000 },
  ],
  guests: [
    ...Array(148).fill(null).map((_, i) => ({ id: `g-c-${i}`, name: `Confirmed Guest ${i + 1}`, status: 'confirmed' as const, plusOnes: 0 })),
    ...Array(61).fill(null).map((_, i) => ({ id: `g-p-${i}`, name: `Pending Guest ${i + 1}`, status: 'pending' as const, plusOnes: 0 })),
    ...Array(11).fill(null).map((_, i) => ({ id: `g-d-${i}`, name: `Declined Guest ${i + 1}`, status: 'declined' as const, plusOnes: 0 })),
  ],
  savedIdeaIds: ['idea-w-1', 'idea-w-2'],
  isSample: true,
};

export const BIRTHDAY_TEMPLATE: CelebrationPlan = {
  id: 'plan-birthday-aarav',
  eventType: 'birthday',
  title: 'Aarav’s 10th Birthday Bash',
  date: '2027-03-15',
  location: 'Pune, Maharashtra',
  totalBudget: 150000,
  reservePercentage: 5,
  items: [
    { id: 'b-b-1', category: 'venue', name: 'Clubhouse & Game Zone', allocatedAmount: 35000, spentAmount: 15000 },
    { id: 'b-b-2', category: 'catering', name: 'Snacks, Pizza & Custom Cake', allocatedAmount: 50000, spentAmount: 10000 },
    { id: 'b-b-3', category: 'decor', name: 'Superhero Balloon Theme', allocatedAmount: 25000, spentAmount: 0 },
    { id: 'b-b-4', category: 'entertainment', name: 'Magician & Activity Host', allocatedAmount: 20000, spentAmount: 0 },
    { id: 'b-b-5', category: 'gifts', name: 'Return Gifts & Favors', allocatedAmount: 20000, spentAmount: 0 },
  ],
  timeline: [
    { id: 't-b-1', title: 'Reserve party hall', dueDate: '2027-02-15', category: 'venue', status: 'completed', estimatedDaysBeforeEvent: 28, description: 'Book clubhouse slot' },
    { id: 't-b-2', title: 'Design cake & order flavors', dueDate: '2027-03-01', category: 'catering', status: 'pending', estimatedDaysBeforeEvent: 14, description: 'Fondant superhero design' },
  ],
  vendors: [
    { id: 'v-b-1', category: 'venue', role: 'Venue', name: 'Skyline Clubhouse', status: 'booked', deadlineDate: '2027-02-15', allocatedBudget: 35000 },
    { id: 'v-b-2', category: 'catering', role: 'Bakery & Catering', status: 'tasting_set', deadlineDate: '2027-03-05', allocatedBudget: 50000 },
  ],
  guests: [
    ...Array(30).fill(null).map((_, i) => ({ id: `gb-c-${i}`, name: `Friend ${i + 1}`, status: 'confirmed' as const, plusOnes: 0 })),
    ...Array(10).fill(null).map((_, i) => ({ id: `gb-p-${i}`, name: `Friend ${i + 31}`, status: 'pending' as const, plusOnes: 0 })),
  ],
  savedIdeaIds: ['idea-b-1'],
  isSample: true,
};

export const COMMUNITY_TEMPLATE: CelebrationPlan = {
  id: 'plan-community-utsav',
  eventType: 'community',
  title: 'Community Festival & Cultural Mela',
  date: '2027-09-04',
  location: 'Dadar, Mumbai',
  totalBudget: 400000,
  reservePercentage: 8,
  items: [
    { id: 'c-1', category: 'venue', name: 'Pandal & Stage Setup', allocatedAmount: 140000, spentAmount: 50000 },
    { id: 'c-2', category: 'catering', name: 'Mahaprasad & Daily Refreshments', allocatedAmount: 120000, spentAmount: 0 },
    { id: 'c-3', category: 'entertainment', name: 'Sound System, Lights & Dhol', allocatedAmount: 80000, spentAmount: 20000 },
    { id: 'c-4', category: 'decor', name: 'Eco-Friendly Stage Decor & Floral Arches', allocatedAmount: 60000, spentAmount: 25000 },
  ],
  timeline: [
    { id: 'tc-1', title: 'Apply for police & municipal permissions', dueDate: '2027-07-15', category: 'logistics', status: 'completed', estimatedDaysBeforeEvent: 50, description: 'Loudspeaker and stage permits' },
    { id: 'tc-2', title: 'Artisan & Decorator booking', dueDate: '2027-07-30', category: 'decor', status: 'completed', estimatedDaysBeforeEvent: 35, description: 'Eco-friendly cultural stage artistry' },
  ],
  vendors: [
    { id: 'vc-1', category: 'decor', role: 'Stage Artist & Decorator', name: 'Kala Kendra', status: 'booked', deadlineDate: '2027-07-30', allocatedBudget: 60000 },
  ],
  guests: Array(250).fill(null).map((_, i) => ({ id: `gc-${i}`, name: `Resident ${i + 1}`, status: 'confirmed' as const, plusOnes: 1 })),
  savedIdeaIds: ['idea-c-1'],
  isSample: true,
};

export const FESTIVAL_TEMPLATE: CelebrationPlan = {
  id: 'plan-festival-diwali',
  eventType: 'festival',
  title: 'Diwali Sneh Milan & Lights Festival',
  date: '2027-11-01',
  location: 'Thane, Maharashtra',
  totalBudget: 300000,
  reservePercentage: 5,
  items: [
    { id: 'f-1', category: 'venue', name: 'Amphitheatre & Garden', allocatedAmount: 90000, spentAmount: 30000 },
    { id: 'f-2', category: 'catering', name: 'Faral, Sweets & Dinner Buffet', allocatedAmount: 110000, spentAmount: 0 },
    { id: 'f-3', category: 'decor', name: 'Diyas, Fairy Lights & Rangoli', allocatedAmount: 50000, spentAmount: 0 },
    { id: 'f-4', category: 'entertainment', name: 'Musical Performance & Fireworks Show', allocatedAmount: 50000, spentAmount: 0 },
  ],
  timeline: [
    { id: 'tf-1', title: 'Book caterer for Faral & sweets', dueDate: '2027-10-01', category: 'catering', status: 'pending', estimatedDaysBeforeEvent: 30, description: 'Traditional besan laddu and chivda' },
  ],
  vendors: [
    { id: 'vf-1', category: 'catering', role: 'Faral Caterer', status: 'not_started', deadlineDate: '2027-10-01', allocatedBudget: 110000 },
  ],
  guests: Array(120).fill(null).map((_, i) => ({ id: `gf-${i}`, name: `Family ${i + 1}`, status: 'confirmed' as const, plusOnes: 0 })),
  savedIdeaIds: ['idea-f-1'],
  isSample: true,
};

export function getTemplateByEventType(eventType: EventType): CelebrationPlan {
  switch (eventType) {
    case 'wedding': return WEDDING_TEMPLATE;
    case 'birthday': return BIRTHDAY_TEMPLATE;
    case 'community': return COMMUNITY_TEMPLATE;
    case 'festival': return FESTIVAL_TEMPLATE;
    default: return WEDDING_TEMPLATE;
  }
}
