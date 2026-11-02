'use client';

import { useEffect } from 'react';
import { usePlannerStore } from '@/store/plannerStore';

/**
 * Initializes and restores user's theme preference from localStorage on mount.
 * Prevents hard refresh from resetting dark mode to light mode.
 */
export const ThemeInitializer: React.FC = () => {
  const { setTheme } = usePlannerStore();

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('jashn.theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setTheme(savedTheme);
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
        document.documentElement.classList.add('dark');
      }
    } catch {}
  }, [setTheme]);

  return null;
};

export default ThemeInitializer;
