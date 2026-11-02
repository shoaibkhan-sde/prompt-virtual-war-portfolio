import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SamplePlanPage from '@/app/sample-plan/page';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/sample-plan',
}));

// Mock next/link
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('SamplePlanPage Integration', () => {
  it('renders Sample Plan Mode notice banner and archetype switch pills', () => {
    render(<SamplePlanPage />);

    expect(screen.getByText('Sample Plan Mode')).toBeInTheDocument();
    expect(screen.getByText(/You are exploring a live celebration blueprint/i)).toBeInTheDocument();
    expect(screen.getByText('Start your own plan')).toBeInTheDocument();

    // Archetype pills
    expect(screen.getByText('Grand Wedding Gala')).toBeInTheDocument();
    expect(screen.getByText('30th Milestone Birthday')).toBeInTheDocument();
    expect(screen.getByText('24h AI Hackathon')).toBeInTheDocument();
    expect(screen.getByText('Eid with Family & Friends')).toBeInTheDocument();
  });

  it('switches sample celebration archetype on click', () => {
    render(<SamplePlanPage />);

    const birthdayPill = screen.getByText('30th Milestone Birthday');
    fireEvent.click(birthdayPill);

    // Event title in header updates to Aarav's 30th Milestone Celebration
    expect(screen.getByText(/Aarav's 30th Milestone Celebration/i)).toBeInTheDocument();
  });

  it('renders all 6 review tabs matching real plan', () => {
    render(<SamplePlanPage />);

    expect(screen.getByRole('tab', { name: /Budget/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Timeline/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Vendors/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Ideas/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Scenarios/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Ask the planner/i })).toBeInTheDocument();
  });

  it('allows user to edit sample plan details in-place without redirecting to /plan', () => {
    render(<SamplePlanPage />);

    // Click Edit details button
    const editBtn = screen.getByRole('button', { name: /Edit details/i });
    fireEvent.click(editBtn);

    // Wizard should open in-place with sample plan details pre-filled
    expect(screen.getByText('Edit event details')).toBeInTheDocument();
    expect(screen.getByLabelText(/Event name/i)).toHaveValue("Priya & Arjun's Grand Wedding Gala");

    // Cancel editing returns cleanly to plan results view
    const cancelBtn = screen.getByRole('button', { name: /Cancel editing/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByText('Edit event details')).not.toBeInTheDocument();
    expect(screen.getByText("Priya & Arjun's Grand Wedding Gala")).toBeInTheDocument();
  });

  it('correctly maps and displays selected priorities when editing 30th Milestone Birthday sample', () => {
    render(<SamplePlanPage />);

    // Switch to Birthday archetype
    const birthdayPill = screen.getByText('30th Milestone Birthday');
    fireEvent.click(birthdayPill);

    // Click Edit details
    const editBtn = screen.getByRole('button', { name: /Edit details/i });
    fireEvent.click(editBtn);

    // Form opens with Aarav's celebration
    expect(screen.getByText('Edit event details')).toBeInTheDocument();
    expect(screen.getByLabelText(/Event name/i)).toHaveValue("Aarav's 30th Milestone Celebration");

    // Both Food and beverage AND Music and entertainment pills must be visually selected (aria-pressed=true)
    const foodBtn = screen.getByRole('button', { name: /Food and beverage/i });
    const musicBtn = screen.getByRole('button', { name: /Music and entertainment/i });
    const photoBtn = screen.getByRole('button', { name: /Photography and video/i });

    expect(foodBtn).toHaveAttribute('aria-pressed', 'true');
    expect(musicBtn).toHaveAttribute('aria-pressed', 'true');
    expect(photoBtn).toHaveAttribute('aria-pressed', 'false');

    // Selection counter reflects 2 / 3 selected
    expect(screen.getByText('2 / 3 selected')).toBeInTheDocument();

    // Selecting a 3rd priority updates to 3 / 3 selected
    fireEvent.click(photoBtn);
    expect(photoBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('3 / 3 selected')).toBeInTheDocument();
  });
});
