import { BudgetPlan, EventDefinition, VendorPlan, VendorRequirement, VenueType } from './types';

function addDaysToDate(utcDateStr: string, days: number): string {
  const d = new Date(utcDateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

function getDaysDiff(fromUtcDateStr: string, toUtcDateStr: string): number {
  const d1 = new Date(fromUtcDateStr + 'T00:00:00Z');
  const d2 = new Date(toUtcDateStr + 'T00:00:00Z');
  return Math.round((d2.getTime() - d1.getTime()) / 86400000);
}

/**
 * Computes a prioritized vendor procurement plan tailored to the event parameters and budget.
 *
 * Capabilities:
 * - Lead time scaling: Compresses vendor booking deadlines when event date is near.
 * - Dynamic venue filtering: Eliminates physical catering and venue requirements for online events.
 * - Budget allocation mapping: Ties vendor line items to the calculated category budget.
 * - Essential vendor identification and contract negotiation question generation.
 *
 * @param eventDate - Celebration date string (YYYY-MM-DD).
 * @param todayDate - Current date reference (YYYY-MM-DD).
 * @param eventDef - Event archetype definition with vendor requirements.
 * @param budgetPlan - Calculated budget plan with category allocations.
 * @param priorities - User-selected priority category IDs.
 * @param venueType - Venue classification ('indoor', 'outdoor', 'online').
 * @returns A structured `VendorPlan` with deadlines, checklist steps, and negotiation questions.
 */
export function computeVendorPlan(
  eventDate: string,
  todayDate: string,
  eventDef: EventDefinition,
  budgetPlan: BudgetPlan,
  priorities: string[],
  venueType: VenueType = 'indoor'
): VendorPlan {
  const actualLeadDays = Math.max(0, getDaysDiff(todayDate, eventDate));
  const recommendedSpan = eventDef.recommendedLeadDays;
  const isCompressed = actualLeadDays < recommendedSpan;
  const scaleFactor = isCompressed && recommendedSpan > 0 ? actualLeadDays / recommendedSpan : 1.0;

  const prioritySet = new Set(priorities);
  const budgetByCategory = new Map<string, number>();
  for (const b of budgetPlan.categories) {
    budgetByCategory.set(b.categoryId, b.allocatedAmount);
  }

  // Clone vendor templates
  let rawVendors = [...eventDef.vendors];

  // If online, filter out physical venue & food catering
  if (venueType === 'online') {
    rawVendors = rawVendors.filter((v) => {
      const lowerCat = v.categoryId.toLowerCase();
      const lowerRole = v.role.toLowerCase();
      const isPhysicalVenue =
        lowerRole.includes('banquet') ||
        lowerRole.includes('estate') ||
        lowerRole.includes('auditorium') ||
        lowerRole.includes('grounds') ||
        lowerCat.includes('hospitality') ||
        lowerCat.includes('grounds');
      const isFoodOrCatering =
        lowerRole.includes('cater') ||
        lowerRole.includes('chef') ||
        lowerRole.includes('food') ||
        lowerRole.includes('coffee') ||
        lowerCat.includes('culinary') ||
        lowerCat.includes('feasts') ||
        lowerCat.includes('refreshment') ||
        lowerCat.includes('meals');
      return !isPhysicalVenue && !isFoodOrCatering;
    });
  }

  // If outdoor, append weather canopy vendor if not already present
  if (venueType === 'outdoor' && !rawVendors.some((v) => v.id.includes('tent'))) {
    rawVendors.push({
      id: `${eventDef.id}-v-tent-shelter`,
      categoryId: eventDef.categories[0]?.id || 'logistics',
      role: 'Monsoon Waterproof Tent & Shade Canopy Specialist',
      leadDays: 30,
      isEssential: true,
      checklistSteps: [
        'Survey open turf drainage slopes and water runoff channels',
        'Inspect wind-anchoring guy wires and sandbag ballasts',
        'Verify flame-retardant certification for dining pagoda covers',
      ],
      questionsToAsk: [
        'Can sidewalls be quickly dropped if sudden cross-winds or rain starts?',
        'Is anti-skid wooden sub-flooring included for marshy ground areas?',
      ],
    });
  }

  const vendors: VendorRequirement[] = rawVendors.map((v) => {
    // Scale vendor leadDays using the EXACT SAME formula as timeline
    let scaledLead = v.leadDays;
    if (isCompressed) {
      scaledLead = Math.round(v.leadDays * scaleFactor);
      if (scaledLead > actualLeadDays) {
        scaledLead = actualLeadDays;
      }
    }
    const bookingDeadline = addDaysToDate(eventDate, -scaledLead);
    const allocatedBudget = budgetByCategory.get(v.categoryId) || 0;
    const isPriorityLinked = prioritySet.has(v.categoryId);

    return {
      id: v.id,
      categoryId: v.categoryId,
      role: v.role,
      allocatedBudget,
      bookingDeadline,
      isEssential: v.isEssential,
      isPriorityLinked,
      checklistSteps: v.checklistSteps,
      questionsToAsk: v.questionsToAsk,
      isBooked: false,
      completedSteps: 0,
      totalSteps: v.checklistSteps.length,
    };
  });

  // Sort by booking deadline ascending (earliest deadline first)
  vendors.sort((a, b) => a.bookingDeadline.localeCompare(b.bookingDeadline));

  return {
    vendors,
    totalVendors: vendors.length,
    bookedVendors: 0,
  };
}

export function updateVendorProgress(
  plan: VendorPlan,
  vendorId: string,
  isBooked: boolean,
  completedStepIndices: number[]
): VendorPlan {
  const updated = plan.vendors.map((v) => {
    if (v.id !== vendorId) return v;
    return {
      ...v,
      isBooked,
      completedSteps: completedStepIndices.length,
    };
  });

  const bookedCount = updated.filter((v) => v.isBooked).length;

  return {
    vendors: updated,
    totalVendors: updated.length,
    bookedVendors: bookedCount,
  };
}
