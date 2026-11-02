import { describe, it, expect } from 'vitest';
import {
  calculateGuestSummary,
  updateGuestRsvp,
  addGuest,
  filterGuestsByStatus,
} from '@/domain/guests';
import { GuestItem } from '@/domain/types';

describe('domain/guests', () => {
  const sampleGuests: GuestItem[] = [
    { id: '1', name: 'Aarav Patil', status: 'confirmed', plusOnes: 1 }, // 2 heads
    { id: '2', name: 'Ananya Deshmukh', status: 'confirmed', plusOnes: 0 }, // 1 head
    { id: '3', name: 'Rahul Sharma', status: 'pending', plusOnes: 2 }, // 3 heads
    { id: '4', name: 'Sneha Kulkarni', status: 'declined', plusOnes: 0 }, // 1 head
  ];

  it('calculates guest summary including plusOnes headcount and cost per confirmed guest', () => {
    const totalBudget = 60000;
    const summary = calculateGuestSummary(sampleGuests, totalBudget);

    expect(summary.confirmedCount).toBe(3); // 2 + 1
    expect(summary.pendingCount).toBe(3); // 3
    expect(summary.declinedCount).toBe(1); // 1
    expect(summary.totalInvited).toBe(7);
    expect(summary.costPerConfirmedGuest).toBe(20000); // 60000 / 3
  });

  it('handles 0 confirmed guests gracefully', () => {
    const summary = calculateGuestSummary([], 50000);
    expect(summary.confirmedCount).toBe(0);
    expect(summary.costPerConfirmedGuest).toBe(0);
  });

  it('updates guest RSVP status', () => {
    const updated = updateGuestRsvp(sampleGuests, '3', 'confirmed');
    const guest3 = updated.find((g) => g.id === '3');
    expect(guest3?.status).toBe('confirmed');
  });

  it('adds a new guest with valid defaults', () => {
    const updated = addGuest(sampleGuests, {
      name: 'Pooja Joshi',
      status: 'pending',
      plusOnes: 1,
      group: 'Family',
    });

    expect(updated.length).toBe(5);
    const added = updated[updated.length - 1];
    expect(added.name).toBe('Pooja Joshi');
    expect(added.id).toMatch(/^g-/);
  });

  it('filters guests by status', () => {
    expect(filterGuestsByStatus(sampleGuests, 'all').length).toBe(4);
    expect(filterGuestsByStatus(sampleGuests, 'confirmed').length).toBe(2);
    expect(filterGuestsByStatus(sampleGuests, 'pending').length).toBe(1);
    expect(filterGuestsByStatus(sampleGuests, 'declined').length).toBe(1);
  });
});
