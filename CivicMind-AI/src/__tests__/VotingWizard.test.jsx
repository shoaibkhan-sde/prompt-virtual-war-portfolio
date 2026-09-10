/**
 * @fileoverview Tests for VotingWizard component.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import VotingWizard from '@/features/simulation/components/VotingWizard.jsx';
import { WIZARD_STEPS } from '@/shared/utils/constants.js';

beforeEach(() => {
  window.gtag = jest.fn();
});

describe('VotingWizard', () => {
  it('renders Step 1 title on mount', () => {
    render(<VotingWizard />);
    expect(screen.getByText(WIZARD_STEPS[0].title)).toBeInTheDocument();
  });

  it('Next button advances to step 2', () => {
    render(<VotingWizard />);
    const nextBtn = document.getElementById('wizard-next-btn');
    fireEvent.click(nextBtn);
    expect(screen.getByText(WIZARD_STEPS[1].title)).toBeInTheDocument();
  });

  it('Previous button is disabled on step 1', () => {
    render(<VotingWizard />);
    const prevBtn = document.getElementById('wizard-prev-btn');
    expect(prevBtn).toBeDisabled();
  });

  it('Progress bar has correct aria-valuenow on each step', () => {
    render(<VotingWizard />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '1');

    const nextBtn = document.getElementById('wizard-next-btn');
    fireEvent.click(nextBtn);
    expect(progressBar).toHaveAttribute('aria-valuenow', '2');
  });

  it('clicking through all steps shows the completion screen', () => {
    render(<VotingWizard />);
    for (let i = 0; i < WIZARD_STEPS.length; i++) {
      const nextBtn = document.getElementById('wizard-next-btn');
      fireEvent.click(nextBtn);
    }
    expect(screen.getByText(/Ready to Vote/i)).toBeInTheDocument();
  });

  it('step indicator dots are rendered for each step', () => {
    render(<VotingWizard />);
    // Each dot has id="wizard-dot-N"
    const dots = WIZARD_STEPS.map((_, i) => document.getElementById(`wizard-dot-${i + 1}`));
    dots.forEach((dot) => expect(dot).toBeInTheDocument());
    expect(dots.length).toBe(WIZARD_STEPS.length);
  });
});
