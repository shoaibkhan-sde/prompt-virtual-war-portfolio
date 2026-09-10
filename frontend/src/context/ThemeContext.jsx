import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Default to 'light' per user request
    const saved = localStorage.getItem('venueflow-theme');
    return saved || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Performance optimization: 
    // Only enable across-the-board transitions while switching.
    root.classList.add('theme-transitioning');
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    localStorage.setItem('venueflow-theme', theme);

    const timer = setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 550); // Slightly more than the 500ms CSS transition

    return () => clearTimeout(timer);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
