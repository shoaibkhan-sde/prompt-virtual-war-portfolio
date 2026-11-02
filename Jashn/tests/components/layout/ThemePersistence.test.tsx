import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeInitializer } from '@/components/layout/ThemeInitializer';
import { ThemeToggle } from '@/components/layout/navbar/ThemeToggle';
import { usePlannerStore } from '@/store/plannerStore';

describe('Theme Persistence and Initializer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    usePlannerStore.setState({ theme: 'light' });
  });

  it('saves dark theme to localStorage when toggled', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const toggleBtn = screen.getByRole('button', { name: /Switch to dark mode/i });
    await user.click(toggleBtn);

    expect(localStorage.getItem('jashn.theme')).toBe('dark');
    expect(usePlannerStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('ThemeInitializer restores dark mode from localStorage on mount (surviving refresh)', () => {
    localStorage.setItem('jashn.theme', 'dark');

    render(<ThemeInitializer />);

    expect(usePlannerStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
