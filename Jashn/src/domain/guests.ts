/**
 * Pure domain logic for Guest list and RSVP tracking.
 * Zero external dependencies.
 */

import { GuestItem, GuestSummary, RsvpStatus } from './types';

/**
 * Aggregates RSVP metrics, taking plus-ones into account for total headcount,
 * and derives real-time catering cost per confirmed attendee.
 *
 * @param guests - Full guest roster.
 * @param totalBudget - Overall event budget.
 * @returns A composite `GuestSummary` with counts and per-head cost.
 */
export function calculateGuestSummary(
  guests: GuestItem[],
  totalBudget: number
): GuestSummary {
  let confirmedCount = 0;
  let pendingCount = 0;
  let declinedCount = 0;

  for (const g of guests) {
    const headcount = 1 + Math.max(0, g.plusOnes || 0);
    if (g.status === 'confirmed') {
      confirmedCount += headcount;
    } else if (g.status === 'pending') {
      pendingCount += headcount;
    } else if (g.status === 'declined') {
      declinedCount += headcount;
    }
  }

  const totalInvited = confirmedCount + pendingCount + declinedCount;
  const costPerConfirmedGuest =
    confirmedCount > 0 ? Math.round(totalBudget / confirmedCount) : 0;

  return {
    totalInvited,
    confirmedCount,
    pendingCount,
    declinedCount,
    costPerConfirmedGuest,
  };
}

/**
 * Updates an attendee's RSVP status.
 *
 * @param guests - Guest roster.
 * @param guestId - Target guest ID.
 * @param newStatus - New RSVP status ('confirmed', 'pending', 'declined').
 * @returns Updated array of guests.
 */
export function updateGuestRsvp(
  guests: GuestItem[],
  guestId: string,
  newStatus: RsvpStatus
): GuestItem[] {
  return guests.map((g) => (g.id === guestId ? { ...g, status: newStatus } : g));
}

/**
 * Creates and appends a new guest entry with a unique ID and non-negative plus-ones.
 *
 * @param guests - Existing guest list.
 * @param newGuest - Guest details without ID.
 * @returns New guest list with appended attendee.
 */
export function addGuest(
  guests: GuestItem[],
  newGuest: Omit<GuestItem, 'id'>
): GuestItem[] {
  const id = `g-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  return [
    ...guests,
    {
      ...newGuest,
      id,
      plusOnes: Math.max(0, newGuest.plusOnes || 0),
    },
  ];
}

export function filterGuestsByStatus(
  guests: GuestItem[],
  status: RsvpStatus | 'all'
): GuestItem[] {
  if (status === 'all') return [...guests];
  return guests.filter((g) => g.status === status);
}
