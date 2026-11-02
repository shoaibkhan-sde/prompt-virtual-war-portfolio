import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navbar } from '@/components/layout/navbar/Navbar';
import { usePlannerStore } from '@/store/plannerStore';

// Mock next/navigation
const mockPathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
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

describe('Navbar Component & Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.lang = 'en';
    mockPathname.mockReturnValue('/');
    usePlannerStore.setState({ theme: 'light' });
  });

  it('renders brand wordmark and logo with aria-label', () => {
    render(<Navbar />);
    const homeLink = screen.getByRole('link', { name: /Jashn, home/i });
    expect(homeLink).toBeInTheDocument();
    expect(screen.getByText('Jashn')).toBeInTheDocument();
    expect(screen.getByText('GenAI Celebration Planner')).toBeInTheDocument();
  });

  it('sets aria-current="page" on active route link', () => {
    mockPathname.mockReturnValue('/');
    render(<Navbar />);

    const homeLink = screen.getByRole('link', { name: 'Home' });
    const planLink = screen.getByRole('link', { name: /Start a new plan/i });

    expect(homeLink).toHaveAttribute('aria-current', 'page');
    expect(planLink).not.toHaveAttribute('aria-current');
  });

  it('updates aria-current="page" on Start a new plan when on /plan', () => {
    mockPathname.mockReturnValue('/plan');
    render(<Navbar />);

    const homeLink = screen.getByRole('link', { name: 'Home' });
    const planLink = screen.getByRole('link', { name: /Start a new plan/i });

    expect(homeLink).not.toHaveAttribute('aria-current');
    expect(planLink).toHaveAttribute('aria-current', 'page');
    expect(planLink).toHaveAttribute('href', '/plan');
  });

  it('toggles dark and light mode', async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    const themeBtn = screen.getByRole('button', { name: /Switch to dark mode/i });
    expect(themeBtn).toHaveAttribute('aria-pressed', 'false');

    await user.click(themeBtn);
    expect(usePlannerStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    const lightBtn = screen.getByRole('button', { name: /Switch to light mode/i });
    expect(lightBtn).toHaveAttribute('aria-pressed', 'true');
  });
});
