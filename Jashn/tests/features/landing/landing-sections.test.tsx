import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AboutMetricsSection } from '@/features/landing/components/AboutMetricsSection';
import { HowItWorksSection } from '@/features/landing/components/HowItWorksSection';
import { ArchetypesShowcase } from '@/features/landing/components/ArchetypesShowcase';
import { FeaturesGridSection } from '@/features/landing/components/FeaturesGridSection';
import { FaqSection } from '@/features/landing/components/FaqSection';
import { CallToActionBanner } from '@/features/landing/components/CallToActionBanner';

describe('Landing Page Custom Sections', () => {
  it('renders AboutMetricsSection with 4 key metrics', () => {
    render(<AboutMetricsSection />);
    expect(screen.getByRole('heading', { level: 2, name: /Celebration planning engineered/i })).toBeInTheDocument();
    expect(screen.getByText('6 Archetypes')).toBeInTheDocument();
    expect(screen.getByText('100% Exact Math')).toBeInTheDocument();
    expect(screen.getByText('DAG Milestones')).toBeInTheDocument();
    expect(screen.getByText('100% Local Privacy')).toBeInTheDocument();
  });

  it('renders HowItWorksSection with 3 numbered steps aligned with event planner', () => {
    render(<HowItWorksSection />);
    expect(screen.getByRole('heading', { level: 2, name: /From initial spark to celebration in three steps/i })).toBeInTheDocument();
    expect(screen.getByText('Describe Your Event')).toBeInTheDocument();
    expect(screen.getByText('Review Your Plan')).toBeInTheDocument();
    expect(screen.getByText('Track and Refine')).toBeInTheDocument();
  });

  it('renders ArchetypesShowcase and supports tab switching', () => {
    render(<ArchetypesShowcase />);
    expect(screen.getByRole('heading', { level: 2, name: /Specialized blueprints for every occasion/i })).toBeInTheDocument();

    // Default Wedding
    expect(screen.getByRole('heading', { level: 3, name: /Wedding/i })).toBeInTheDocument();

    // Click on Hackathon tab
    const hackathonTab = screen.getByRole('button', { name: /Hackathon/i });
    fireEvent.click(hackathonTab);

    expect(screen.getByRole('heading', { level: 3, name: /Hackathon/i })).toBeInTheDocument();
  });

  it('renders FeaturesGridSection with 4 essential features', () => {
    render(<FeaturesGridSection />);
    expect(screen.getByRole('heading', { level: 2, name: /Everything required to orchestrate/i })).toBeInTheDocument();
    expect(screen.getByText('Integer Split Engine')).toBeInTheDocument();
    expect(screen.getByText('Dynamic Lead-Time Scaler')).toBeInTheDocument();
    expect(screen.getByText('Contractor Blueprints')).toBeInTheDocument();
    expect(screen.getByText('Local Privacy & .ICS Sync')).toBeInTheDocument();
  });

  it('renders FaqSection with all items closed until manually clicked', () => {
    render(<FaqSection />);
    expect(screen.getByRole('heading', { level: 2, name: /Frequently asked questions/i })).toBeInTheDocument();

    // All questions are closed by default until user clicks
    const firstBtn = screen.getByRole('button', { name: /Where is my celebration plan stored/i });
    expect(firstBtn).toHaveAttribute('aria-expanded', 'false');

    const secondBtn = screen.getByRole('button', { name: /How is the budget divided between categories/i });
    expect(secondBtn).toHaveAttribute('aria-expanded', 'false');

    // Click first question to open
    fireEvent.click(firstBtn);
    expect(firstBtn).toHaveAttribute('aria-expanded', 'true');
    expect(secondBtn).toHaveAttribute('aria-expanded', 'false');

    // Click second question opens second and closes first
    fireEvent.click(secondBtn);
    expect(secondBtn).toHaveAttribute('aria-expanded', 'true');
    expect(firstBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders CallToActionBanner with bold centered statement', () => {
    render(<CallToActionBanner />);
    expect(
      screen.getByRole('heading', { level: 2, name: /Design your Jashn blueprint in three simple steps/i })
    ).toBeInTheDocument();
  });
});
