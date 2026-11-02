import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/plan/route';
import { NextRequest } from 'next/server';

describe('API Route: POST /api/plan', () => {
  const baseUrl = 'http://localhost:3000/api/plan';

  it('rejects requests with missing or invalid Content-Type', async () => {
    const req = new NextRequest(baseUrl, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'plain text payload',
    });

    const res = await POST(req);
    expect(res.status).toBe(415);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('rejects oversized payloads (> 50KB)', async () => {
    const largeString = 'a'.repeat(60 * 1024);
    const req = new NextRequest(baseUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ padding: largeString }),
    });

    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it('returns 400 with all validation errors when required fields are missing', async () => {
    const req = new NextRequest(baseUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        eventType: 'wedding',
        eventName: 'X', // too short
        eventDate: '2025-01-01', // in past
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(Array.isArray(data.errors)).toBe(true);
    expect(data.errors.length).toBeGreaterThan(0);
  });

  it('returns 200 with full plan on valid request', async () => {
    const serverToday = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90);
    const eventDateStr = futureDate.toISOString().split('T')[0];

    const req = new NextRequest(baseUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        todayDate: serverToday,
        eventType: 'wedding',
        eventName: 'Aarav & Diya Wedding',
        eventDate: eventDateStr,
        guestCount: 200,
        currency: 'INR',
        totalBudget: 1500000,
        budgetTier: 'standard',
        venueType: 'indoor',
        dietaryRequirement: 'veg_only',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.plan).toBeDefined();
    expect(data.plan.budget.totalBudget).toBe(1500000);
    expect(data.plan.timeline.tasks.length).toBeGreaterThan(0);
    expect(data.plan.vendors.vendors.length).toBeGreaterThan(0);
    expect(data.plan.readiness.score).toBeGreaterThanOrEqual(0);
  });
});
