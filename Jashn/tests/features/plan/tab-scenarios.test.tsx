import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TabScenarios } from '@/features/plan/TabScenarios';
import { GeneratedEventPlan } from '@/domain/event-planner/types';

describe('TabScenarios UI Component', () => {
  const mockPlan: GeneratedEventPlan = {
    id: 'test-plan-scenarios',
    createdAt: '2026-10-26T00:00:00Z',
    input: {
      eventType: 'wedding',
      eventName: 'Grand Test Wedding',
      eventDate: '2027-02-20',
      guestCount: 300,
      currency: 'INR',
      totalBudget: 1500000,
      budgetTier: 'standard',
      priorities: ['venue_hospitality'],
      interests: [],
      venueType: 'indoor',
      dietaryRequirement: 'none',
      alcoholServed: false,
      secondaryGuestCount: 0,
    },
    budget: {
      totalBudget: 1500000,
      contingencyPercent: 10,
      contingencyAmount: 150000,
      distributableBudget: 1350000,
      categories: [
        { categoryId: 'venue', categoryName: 'Venue', allocatedAmount: 600000, actualSpent: 0, sharePercent: 40, isPriority: true, varianceStatus: '₹6,00,000 left' },
        { categoryId: 'catering', categoryName: 'Catering', allocatedAmount: 450000, actualSpent: 0, sharePercent: 30, isPriority: false, varianceStatus: '₹4,50,000 left' },
        { categoryId: 'photography', categoryName: 'Photography', allocatedAmount: 300000, actualSpent: 0, sharePercent: 20, isPriority: false, varianceStatus: '₹3,00,000 left' },
      ],
    },
    timeline: { isCompressed: false, tasks: [], totalTasks: 0, completedTasks: 0, overdueTasks: 0 },
    vendors: { vendors: [], totalVendors: 0, bookedVendors: 0 },
    ideas: [],
    updatedAt: '2026-10-26T00:00:00Z',
    readiness: { score: 80, level: 'Well Prepared', breakdown: { taskScore: 25, vendorScore: 25, budgetScore: 30 }, plainLanguageReason: 'Ready' },
  };

  it('renders What-If heading and presets', () => {
    render(<TabScenarios plan={mockPlan} onUpdatePlan={vi.fn()} />);

    expect(screen.getByText(/What-If Budget & Headcount Scenarios/i)).toBeInTheDocument();
    expect(screen.getByText(/Cut 10% from Budget/i)).toBeInTheDocument();
    expect(screen.getByText(/Guest Count Shift/i)).toBeInTheDocument();
  });

  it('toggles category lock when clicked', () => {
    render(<TabScenarios plan={mockPlan} onUpdatePlan={vi.fn()} />);

    const venueBtn = screen.getByRole('button', { name: /Venue/i });
    expect(venueBtn).toBeInTheDocument();

    fireEvent.click(venueBtn);
    expect(venueBtn).toHaveTextContent(/Locked/i);
  });

  it('runs 10% cut simulation and displays comparison table', () => {
    const handleUpdate = vi.fn();
    render(<TabScenarios plan={mockPlan} onUpdatePlan={handleUpdate} />);

    const cutBtn = screen.getByRole('button', { name: /Simulate 10% Cut/i });
    fireEvent.click(cutBtn);

    expect(screen.getByText(/Active Simulation/i)).toBeInTheDocument();
    expect(screen.getByText(/10% Budget Trim/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apply Simulation to Plan/i })).toBeInTheDocument();

    // Click apply
    fireEvent.click(screen.getByRole('button', { name: /Apply Simulation to Plan/i }));
    expect(handleUpdate).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Applied "10% Budget Trim" to celebration plan/i)).toBeInTheDocument();
  });
});
