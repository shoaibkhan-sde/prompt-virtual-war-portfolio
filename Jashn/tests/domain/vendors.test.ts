import { describe, it, expect } from 'vitest';
import {
  getVendorStatusMeta,
  updateVendorStatus,
  calculateVendorBudgetSummary,
  filterVendorsByCategory,
} from '@/domain/vendors';
import { VendorItem } from '@/domain/types';

describe('domain/vendors', () => {
  const baseDate = new Date('2026-10-25T00:00:00.000Z');

  const sampleVendors: VendorItem[] = [
    { id: 'v-1', category: 'venue', role: 'Venue', name: 'Grand Lawns', status: 'booked', deadlineDate: '2026-10-12', allocatedBudget: 450000 },
    { id: 'v-2', category: 'catering', role: 'Caterer', name: 'Swad', status: 'tasting_set', deadlineDate: '2026-11-15', allocatedBudget: 540000 },
    { id: 'v-3', category: 'photography', role: 'Photographer', status: 'not_started', deadlineDate: '2026-10-31', allocatedBudget: 162000 },
  ];

  it('determines status metadata correctly', () => {
    // Booked is always green
    expect(getVendorStatusMeta('booked', '2026-10-12', baseDate)).toEqual({
      label: 'Booked',
      tone: 'green',
    });

    // In 6 days (due soon)
    expect(getVendorStatusMeta('not_started', '2026-10-31', baseDate)).toEqual({
      label: 'Due in 6 days',
      tone: 'amber',
    });

    // Overdue
    expect(getVendorStatusMeta('not_started', '2026-10-20', baseDate)).toEqual({
      label: 'Overdue by 5d',
      tone: 'amber',
    });

    // Tasting set far away
    expect(getVendorStatusMeta('tasting_set', '2026-12-01', baseDate)).toEqual({
      label: 'Tasting set',
      tone: 'neutral',
    });

    // Quote received
    expect(getVendorStatusMeta('quote_received', '2026-12-01', baseDate)).toEqual({
      label: 'Quote received',
      tone: 'amber',
    });

    // Contacted
    expect(getVendorStatusMeta('contacted', '2026-12-01', baseDate)).toEqual({
      label: 'In discussions',
      tone: 'neutral',
    });

    // Not started far away
    expect(getVendorStatusMeta('not_started', '2027-12-01', baseDate)).toEqual({
      label: 'Not started',
      tone: 'neutral',
    });
  });

  it('updates vendor status and vendor name', () => {
    const updated = updateVendorStatus(sampleVendors, 'v-3', 'booked', 'Capture Moments Studio');
    const photog = updated.find((v) => v.id === 'v-3');
    expect(photog?.status).toBe('booked');
    expect(photog?.name).toBe('Capture Moments Studio');

    // Untouched vendors stay identical
    const venue = updated.find((v) => v.id === 'v-1');
    expect(venue?.status).toBe('booked');
  });

  it('calculates vendor budget summaries', () => {
    const summary = calculateVendorBudgetSummary(sampleVendors);
    expect(summary.totalAllocated).toBe(1152000);
    expect(summary.bookedCount).toBe(1);
    expect(summary.pendingCount).toBe(2);
    expect(summary.totalVendors).toBe(3);
  });

  it('filters vendors by category', () => {
    expect(filterVendorsByCategory(sampleVendors, 'all').length).toBe(3);
    const venueOnly = filterVendorsByCategory(sampleVendors, 'venue');
    expect(venueOnly.length).toBe(1);
    expect(venueOnly[0].category).toBe('venue');
  });
});
