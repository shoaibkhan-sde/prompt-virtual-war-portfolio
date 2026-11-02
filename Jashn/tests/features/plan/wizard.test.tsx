import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Wizard } from '@/features/plan/Wizard';
import { PlanResultsView } from '@/features/plan/PlanResultsView';
import { buildPlan } from '@/domain/event-planner/plan-builder';

describe('Wizard & PlanResultsView UI Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates Step 1 required fields and blocks transition if invalid', () => {
    render(<Wizard onPlanCreated={vi.fn()} />);

    // Click Create my plan without filling title or date
    const nextBtn = screen.getByRole('button', { name: /Create my plan|Next Step/i });
    fireEvent.click(nextBtn);

    // Error summary should appear
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/issues that need your attention/i)).toBeInTheDocument();
  });

  it('renders WAI-ARIA tabs with roving tabindex and keyboard navigation', () => {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 100);

    const plan = buildPlan(
      {
        eventType: 'wedding',
        eventName: 'Test Wedding Gala',
        eventDate: futureDate.toISOString().split('T')[0],
        guestCount: 200,
        currency: 'INR',
        totalBudget: 1800000,
        budgetTier: 'standard',
        priorities: ['venue_hospitality'],
        interests: [],
        venueType: 'indoor',
        dietaryRequirement: 'none',
        alcoholServed: false,
        secondaryGuestCount: 0,
      },
      today
    );

    render(
      <PlanResultsView
        plan={plan}
        onUpdatePlan={vi.fn()}
        onClearPlan={vi.fn()}
        onStartNewPlan={vi.fn()}
        announcement=""
        onExportIcs={vi.fn()}
        onDownloadText={vi.fn()}
        onPrintChecklist={vi.fn()}
        onCopyShareLink={vi.fn()}
        shareCopied={false}
      />
    );

    const tablist = screen.getByRole('tablist', { name: /Event Plan Views/i });
    expect(tablist).toBeInTheDocument();

    const budgetTab = screen.getByRole('tab', { name: /Budget/i });
    const timelineTab = screen.getByRole('tab', { name: /Timeline/i });
    const askTab = screen.getByRole('tab', { name: /Ask the planner/i });

    expect(budgetTab).toHaveAttribute('aria-selected', 'true');
    expect(budgetTab).toHaveAttribute('tabIndex', '0');
    expect(timelineTab).toHaveAttribute('aria-selected', 'false');
    expect(timelineTab).toHaveAttribute('tabIndex', '-1');

    // ArrowRight navigates to Timeline tab
    budgetTab.focus();
    fireEvent.keyDown(budgetTab, { key: 'ArrowRight' });

    expect(timelineTab).toHaveAttribute('aria-selected', 'true');
    expect(timelineTab).toHaveAttribute('tabIndex', '0');

    // End key jumps to last tab (Ask the planner)
    fireEvent.keyDown(timelineTab, { key: 'End' });
    expect(askTab).toHaveAttribute('aria-selected', 'true');

    // Home key jumps back to first tab (Budget)
    fireEvent.keyDown(askTab, { key: 'Home' });
    expect(budgetTab).toHaveAttribute('aria-selected', 'true');
  });

  it('renders readiness score and plain language explanation without relying on colour alone', () => {
    const today = new Date().toISOString().split('T')[0];
    const plan = buildPlan(
      {
        eventType: 'birthday',
        eventName: 'Karan 30th Milestone',
        eventDate: '2027-08-15',
        guestCount: 60,
        currency: 'INR',
        totalBudget: 200000,
        budgetTier: 'standard',
        priorities: [],
        interests: [],
        venueType: 'indoor',
        dietaryRequirement: 'none',
        alcoholServed: false,
        secondaryGuestCount: 0,
      },
      today
    );

    render(
      <PlanResultsView
        plan={plan}
        onUpdatePlan={vi.fn()}
        onClearPlan={vi.fn()}
        onStartNewPlan={vi.fn()}
        announcement=""
        onExportIcs={vi.fn()}
        onDownloadText={vi.fn()}
        onPrintChecklist={vi.fn()}
        onCopyShareLink={vi.fn()}
        shareCopied={false}
      />
    );

    // Heading exists
    expect(screen.getByText('Karan 30th Milestone')).toBeInTheDocument();
    // Readiness score exists
    expect(screen.getByText(/Celebration Readiness Score/i)).toBeInTheDocument();
    // Plain language diagnosis exists
    expect(screen.getByText(/Status Diagnosis:/i)).toBeInTheDocument();
  });

  it('triggers onStartNewPlan when Create new event button is clicked in PlanResultsView', () => {
    const handleStartNewPlan = vi.fn();
    const today = new Date().toISOString().split('T')[0];
    const plan = buildPlan(
      {
        eventType: 'birthday',
        eventName: 'Karan 30th Milestone',
        eventDate: '2027-08-15',
        guestCount: 60,
        currency: 'INR',
        totalBudget: 200000,
        budgetTier: 'standard',
        priorities: [],
        interests: [],
        venueType: 'indoor',
        dietaryRequirement: 'none',
        alcoholServed: false,
        secondaryGuestCount: 0,
      },
      today
    );

    render(
      <PlanResultsView
        plan={plan}
        onUpdatePlan={vi.fn()}
        onClearPlan={vi.fn()}
        onStartNewPlan={handleStartNewPlan}
        announcement=""
        onExportIcs={vi.fn()}
        onDownloadText={vi.fn()}
        onPrintChecklist={vi.fn()}
      />
    );

    const createNewBtn = screen.getByRole('button', { name: /Create new event/i });
    expect(createNewBtn).toBeInTheDocument();
    fireEvent.click(createNewBtn);
    expect(handleStartNewPlan).toHaveBeenCalledTimes(1);
  });

  it('resets Wizard input fields to initial/empty state when initialPlan transitions to null', () => {
    const today = new Date().toISOString().split('T')[0];
    const plan = buildPlan(
      {
        eventType: 'birthday',
        eventName: 'Existing Party',
        eventDate: '2027-08-15',
        guestCount: 60,
        currency: 'INR',
        totalBudget: 200000,
        budgetTier: 'standard',
        priorities: [],
        interests: [],
        venueType: 'indoor',
        dietaryRequirement: 'none',
        alcoholServed: false,
        secondaryGuestCount: 0,
      },
      today
    );

    const { rerender } = render(<Wizard initialPlan={plan} onPlanCreated={vi.fn()} />);

    const input = screen.getByLabelText(/Event name/i) as HTMLInputElement;
    expect(input.value).toBe('Existing Party');

    // When starting a new plan, initialPlan becomes null
    rerender(<Wizard initialPlan={null} onPlanCreated={vi.fn()} />);
    expect(input.value).toBe('');
  });
});

