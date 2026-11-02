/**
 * Sample celebration plans constructed with buildPlan to demonstrate
 * real final states with exact math, progress checkmarks, and what-if simulations.
 */

import { GeneratedEventPlan, ValidatedPlanInput } from './types';
import { buildPlan } from './plan-builder';
import { computeReadinessScore } from './readiness';

export interface SamplePlanOption {
  id: string;
  label: string;
  emoji: string;
  summary: string;
  plan: GeneratedEventPlan;
}

const TODAY_REF = '2026-10-26';

function createWeddingSample(): GeneratedEventPlan {
  const input: ValidatedPlanInput = {
    eventType: 'wedding',
    eventName: "Priya & Arjun's Grand Wedding Gala",
    eventDate: '2027-02-20',
    guestCount: 350,
    currency: 'INR',
    totalBudget: 1800000,
    budgetTier: 'standard',
    priorities: ['venue', 'decor'],
    city: 'Nanded, Maharashtra',
    venueType: 'indoor',
    dietaryRequirement: 'veg_only',
    alcoholServed: false,
    secondaryGuestCount: 50,
    theme: 'Royal Maratha & Floral Elegance',
    interests: ['live classical flute', 'dhol tasha', 'instant photo booths'],
  };

  const plan = buildPlan(input, TODAY_REF);

  // Add realistic demonstration progress:
  // 1. Log actual expenditures
  const updatedCategories = plan.budget.categories.map((c) => {
    if (c.categoryId.includes('venue') || c.categoryName.toLowerCase().includes('venue')) {
      const spent = Math.round(c.allocatedAmount * 0.5);
      return { ...c, actualSpent: spent, varianceStatus: `₹${(c.allocatedAmount - spent).toLocaleString('en-IN')} left` };
    }
    if (c.categoryId.includes('photo') || c.categoryName.toLowerCase().includes('photo')) {
      const spent = 50000;
      return { ...c, actualSpent: spent, varianceStatus: `₹${(c.allocatedAmount - spent).toLocaleString('en-IN')} left` };
    }
    if (c.categoryId.includes('catering') || c.categoryName.toLowerCase().includes('food') || c.categoryName.toLowerCase().includes('catering')) {
      const spent = 100000;
      return { ...c, actualSpent: spent, varianceStatus: `₹${(c.allocatedAmount - spent).toLocaleString('en-IN')} left` };
    }
    return c;
  });

  // 2. Mark earliest tasks completed
  const updatedTasks = plan.timeline.tasks.map((t, idx) => {
    if (idx < 2) {
      return { ...t, isCompleted: true, completedAt: '2026-10-20' };
    }
    return t;
  });

  // 3. Mark first vendor as booked
  const updatedVendors = plan.vendors.vendors.map((v, idx) => {
    if (idx === 0) {
      return { ...v, isBooked: true, completedSteps: 4 };
    }
    return v;
  });

  const updatedBudget = { ...plan.budget, categories: updatedCategories };
  const updatedTimeline = { ...plan.timeline, tasks: updatedTasks };
  const updatedVendorPlan = { ...plan.vendors, vendors: updatedVendors };

  return {
    ...plan,
    budget: updatedBudget,
    timeline: updatedTimeline,
    vendors: updatedVendorPlan,
    readiness: computeReadinessScore(updatedTimeline, updatedVendorPlan, updatedBudget),
  };
}

function createBirthdaySample(): GeneratedEventPlan {
  const input: ValidatedPlanInput = {
    eventType: 'birthday',
    eventName: "Aarav's 30th Milestone Celebration",
    eventDate: '2027-03-15',
    guestCount: 60,
    currency: 'INR',
    totalBudget: 250000,
    budgetTier: 'standard',
    priorities: ['food', 'music'],
    city: 'Pune, Maharashtra',
    venueType: 'indoor',
    dietaryRequirement: 'none',
    alcoholServed: true,
    secondaryGuestCount: 10,
    theme: 'Retro Speakeasy & Acoustic Vibes',
    interests: ['live acoustic band', 'custom mixology', 'polaroid guestbook'],
  };

  const plan = buildPlan(input, TODAY_REF);

  const updatedCategories = plan.budget.categories.map((c, idx) => {
    if (idx === 0) {
      const spent = Math.round(c.allocatedAmount * 0.4);
      return { ...c, actualSpent: spent, varianceStatus: `₹${(c.allocatedAmount - spent).toLocaleString('en-IN')} left` };
    }
    return c;
  });

  const updatedTasks = plan.timeline.tasks.map((t, idx) => {
    if (idx === 0) {
      return { ...t, isCompleted: true, completedAt: '2026-10-24' };
    }
    return t;
  });

  const updatedBudget = { ...plan.budget, categories: updatedCategories };
  const updatedTimeline = { ...plan.timeline, tasks: updatedTasks };

  return {
    ...plan,
    budget: updatedBudget,
    timeline: updatedTimeline,
    readiness: computeReadinessScore(updatedTimeline, plan.vendors, updatedBudget),
  };
}

function createHackathonSample(): GeneratedEventPlan {
  const input: ValidatedPlanInput = {
    eventType: 'hackathon',
    eventName: 'InnovateX 24-Hour AI Hackathon',
    eventDate: '2027-04-10',
    guestCount: 200,
    currency: 'INR',
    totalBudget: 600000,
    budgetTier: 'standard',
    priorities: ['venue', 'food'],
    city: 'Bengaluru, Karnataka',
    venueType: 'indoor',
    dietaryRequirement: 'none',
    alcoholServed: false,
    secondaryGuestCount: 30,
    theme: 'Autonomous Agents & Open Source',
    interests: ['energy bars & red bull', 'mentorship rooms', 'hardware lab'],
  };

  const plan = buildPlan(input, TODAY_REF);

  const updatedTasks = plan.timeline.tasks.map((t, idx) => {
    if (idx === 0) {
      return { ...t, isCompleted: true, completedAt: '2026-10-22' };
    }
    return t;
  });

  const updatedTimeline = { ...plan.timeline, tasks: updatedTasks };

  return {
    ...plan,
    timeline: updatedTimeline,
    readiness: computeReadinessScore(updatedTimeline, plan.vendors, plan.budget),
  };
}

function createEidSample(): GeneratedEventPlan {
  const input: ValidatedPlanInput = {
    eventType: 'community_event',
    eventName: 'Eid with Family & Friends',
    eventDate: '2027-03-31',
    guestCount: 250,
    currency: 'INR',
    totalBudget: 450000,
    budgetTier: 'standard',
    priorities: ['food', 'music'],
    city: 'Hyderabad, Telangana',
    venueType: 'indoor',
    dietaryRequirement: 'halal',
    alcoholServed: false,
    secondaryGuestCount: 40,
    theme: 'Warm Crescent Glow & Dastarkhwan Feast',
    interests: ['biryani & sheer khurma feast', 'eidi gift corner', 'calligraphy photobooth', 'fairy lights'],
  };

  const plan = buildPlan(input, TODAY_REF);

  const updatedCategories = plan.budget.categories.map((c, idx) => {
    if (idx === 0) {
      const spent = Math.round(c.allocatedAmount * 0.35);
      return { ...c, actualSpent: spent, varianceStatus: `₹${(c.allocatedAmount - spent).toLocaleString('en-IN')} left` };
    }
    return c;
  });

  const updatedTasks = plan.timeline.tasks.map((t, idx) => {
    if (idx < 2) {
      return { ...t, isCompleted: true, completedAt: '2026-10-25' };
    }
    return t;
  });

  const updatedBudget = { ...plan.budget, categories: updatedCategories };
  const updatedTimeline = { ...plan.timeline, tasks: updatedTasks };

  return {
    ...plan,
    budget: updatedBudget,
    timeline: updatedTimeline,
    readiness: computeReadinessScore(updatedTimeline, plan.vendors, updatedBudget),
  };
}

export const SAMPLE_PLANS: SamplePlanOption[] = [
  {
    id: 'wedding',
    label: 'Grand Wedding Gala',
    emoji: '💍',
    summary: '₹18L Budget • 350 Guests • Nanded',
    plan: createWeddingSample(),
  },
  {
    id: 'birthday',
    label: '30th Milestone Birthday',
    emoji: '🎂',
    summary: '₹2.5L Budget • 60 Guests • Pune',
    plan: createBirthdaySample(),
  },
  {
    id: 'hackathon',
    label: '24h AI Hackathon',
    emoji: '💻',
    summary: '₹6L Budget • 200 Builders • Bengaluru',
    plan: createHackathonSample(),
  },
  {
    id: 'eid',
    label: 'Eid with Family & Friends',
    emoji: '🌙',
    summary: '₹4.5L Budget • 250 Guests • Hyderabad',
    plan: createEidSample(),
  },
];
