/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import TabNav from './components/TabNav';
import { ThemeProvider } from './context/ThemeContext';

describe('VenueFlow Navigation System', () => {
  it('should render all primary navigation tabs', () => {
    render(
      <ThemeProvider>
        <TabNav activeTab="overview" setActiveTab={() => {}} />
      </ThemeProvider>
    );
    
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
    expect(screen.getByText(/Crowd/i)).toBeInTheDocument();
    expect(screen.getByText(/Ask AI/i)).toBeInTheDocument();
    expect(screen.getByText(/Map/i)).toBeInTheDocument();
  });

  it('should apply active styles to the current tab', () => {
    render(
      <ThemeProvider>
        <TabNav activeTab="crowd" setActiveTab={() => {}} />
      </ThemeProvider>
    );
    
    const crowdTab = screen.getByRole('tab', { name: /Crowd/i });
    expect(crowdTab).toHaveAttribute('aria-selected', 'true');
  });
});
