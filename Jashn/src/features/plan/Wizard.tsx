'use client';

import React, { useState } from 'react';
import { WizardDraftState } from './wizard-types';
import { Step1DescribeEvent } from './Step1DescribeEvent';
import { PlanSidebarPreview } from './PlanSidebarPreview';
import { ErrorSummary } from './ErrorSummary';
import { GeneratedEventPlan, ValidationError } from '@/domain/event-planner/types';
import { validatePlanRequest } from '@/domain/event-planner/validation';

interface WizardProps {
  initialPlan?: GeneratedEventPlan | null;
  onPlanCreated: (plan: GeneratedEventPlan) => void;
  onClearPlan?: () => void;
  onCancelEdit?: () => void;
}

const INITIAL_DRAFT: WizardDraftState = {
  eventType: 'wedding',
  eventName: '',
  eventDate: '',
  startTime: '18:00',
  durationHours: '6',
  venueType: 'indoor',
  city: '',
  guestCount: '350',
  secondaryGuestCount: '0',
  dietaryRequirement: 'none',
  alcoholServed: false,
  currency: 'INR',
  totalBudget: '1800000',
  budgetTier: 'standard',
  priorities: [],
  theme: '',
  interests: '',
  sponsorshipTarget: '',
  prizePool: '',
};

const CANONICAL_PRIORITIES = new Set([
  'venue',
  'food',
  'photo',
  'decor',
  'music',
  'attire',
  'invitations',
  'transport',
]);

export function normalizePriorityToCanonical(p: string): string {
  const s = p.toLowerCase().trim();
  if (
    s.includes('venue') ||
    s.includes('hospitality') ||
    s.includes('banquet') ||
    s.includes('grounds') ||
    s.includes('hall') ||
    s.includes('cabana') ||
    s.includes('facility')
  ) {
    return 'venue';
  }
  if (
    s.includes('food') ||
    s.includes('culinary') ||
    s.includes('gourmet') ||
    s.includes('catering') ||
    s.includes('bites') ||
    s.includes('meals') ||
    s.includes('confection') ||
    s.includes('bazaar') ||
    s.includes('spread') ||
    s.includes('beverage')
  ) {
    return 'food';
  }
  if (
    s.includes('photo') ||
    s.includes('video') ||
    s.includes('captures') ||
    s.includes('visual') ||
    s.includes('portraits') ||
    s.includes('cinematography')
  ) {
    return 'photo';
  }
  if (
    s.includes('decor') ||
    s.includes('floral') ||
    s.includes('ambience') ||
    s.includes('balloon') ||
    s.includes('props')
  ) {
    return 'decor';
  }
  if (
    s.includes('music') ||
    s.includes('sound') ||
    s.includes('revelry') ||
    s.includes('acoustic') ||
    s.includes('dj') ||
    s.includes('experience') ||
    s.includes('entertain') ||
    s.includes('performers') ||
    s.includes('emcee') ||
    s.includes('artists')
  ) {
    return 'music';
  }
  if (
    s.includes('attire') ||
    s.includes('wardrobe') ||
    s.includes('jewels') ||
    s.includes('styling') ||
    s.includes('beauty')
  ) {
    return 'attire';
  }
  if (
    s.includes('invitation') ||
    s.includes('stationery') ||
    s.includes('flyers') ||
    s.includes('badges')
  ) {
    return 'invitations';
  }
  if (
    s.includes('transport') ||
    s.includes('stay') ||
    s.includes('permits') ||
    s.includes('safety') ||
    s.includes('logistics')
  ) {
    return 'transport';
  }
  return s;
}

function planToDraft(plan: GeneratedEventPlan): WizardDraftState {
  const inp = plan.input;
  const rawPriorities = inp.priorities || [];
  const normalizedPriorities = Array.from(
    new Set(
      rawPriorities
        .map(normalizePriorityToCanonical)
        .filter((p) => CANONICAL_PRIORITIES.has(p))
    )
  ).slice(0, 3);

  return {
    eventType: inp.eventType || 'wedding',
    eventName: inp.eventName || '',
    eventDate: inp.eventDate || '',
    startTime: inp.startTime || '18:00',
    durationHours: String(inp.durationHours ?? '6'),
    venueType: inp.venueType || 'indoor',
    city: inp.city || '',
    guestCount: String(inp.guestCount ?? '350'),
    secondaryGuestCount: String(inp.secondaryGuestCount ?? '0'),
    dietaryRequirement: inp.dietaryRequirement || 'none',
    alcoholServed: Boolean(inp.alcoholServed),
    currency: inp.currency || 'INR',
    totalBudget: String(inp.totalBudget ?? '1800000'),
    budgetTier: inp.budgetTier || 'standard',
    priorities: normalizedPriorities,
    theme: inp.theme || '',
    interests: Array.isArray(inp.interests) ? inp.interests.join(', ') : String(inp.interests || ''),
    sponsorshipTarget: inp.sponsorshipTarget !== undefined && inp.sponsorshipTarget !== null ? String(inp.sponsorshipTarget) : '',
    prizePool: inp.prizePool !== undefined && inp.prizePool !== null ? String(inp.prizePool) : '',
  };
}

export const Wizard: React.FC<WizardProps> = ({
  initialPlan,
  onPlanCreated,
  onClearPlan,
  onCancelEdit,
}) => {
  const [draft, setDraft] = useState<WizardDraftState>(() =>
    initialPlan ? planToDraft(initialPlan) : INITIAL_DRAFT
  );
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (initialPlan) {
      setDraft(planToDraft(initialPlan));
    } else {
      setDraft(INITIAL_DRAFT);
    }
  }, [initialPlan]);

  const updateDraft = (updates: Partial<WizardDraftState>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
    if (errors.length > 0) {
      setErrors((prev) => prev.filter((e) => !updates[e.field as keyof WizardDraftState]));
    }
  };

  const handleClearDraft = () => {
    setDraft(INITIAL_DRAFT);
    setErrors([]);
    try {
      localStorage.removeItem('jashn.pure_event_plan');
    } catch {
      // ignore
    }
    if (onClearPlan) {
      onClearPlan();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrors([]);

    const today = new Date().toISOString().split('T')[0];
    const validation = validatePlanRequest(
      {
        ...draft,
        todayDate: today,
        guestCount: Number(draft.guestCount),
        totalBudget: Number(draft.totalBudget),
        secondaryGuestCount: Number(draft.secondaryGuestCount),
      },
      today
    );

    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        // Fallback for headless test environments
      }
      return;
    }

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draft,
          todayDate: today,
          guestCount: Number(draft.guestCount),
          totalBudget: Number(draft.totalBudget),
          secondaryGuestCount: Number(draft.secondaryGuestCount),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrors(data.errors || [{ field: 'general', message: 'Failed to generate plan.' }]);
        return;
      }

      const updatedPlan: GeneratedEventPlan = initialPlan
        ? { ...data.plan, id: initialPlan.id, createdAt: initialPlan.createdAt }
        : data.plan;

      onPlanCreated(updatedPlan);
    } catch {
      setErrors([{ field: 'network', message: 'Unable to reach the server. Please check your internet connection.' }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ErrorSummary errors={errors} />

      {/* Side-by-side layout with responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_310px] lg:grid-cols-[minmax(0,1fr)_350px] gap-8 items-start">
        <Step1DescribeEvent
          draft={draft}
          onChange={updateDraft}
          errors={errors}
          onSubmit={handleSubmit}
          onClearDraft={handleClearDraft}
          isSubmitting={isSubmitting}
          isEditing={Boolean(initialPlan)}
          onCancelEdit={onCancelEdit}
        />

        <PlanSidebarPreview />
      </div>
    </div>
  );
};

export default Wizard;
