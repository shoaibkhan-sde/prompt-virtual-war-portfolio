import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center">
      <div className="relative w-14 h-7 bg-slate-200 dark:bg-slate-800 rounded-full p-1 flex items-center cursor-pointer shadow-inner border border-slate-300 dark:border-slate-700 overflow-hidden transition-colors duration-300">
        
        {/* Sliding Indicator */}
        <motion.div
          className={`absolute h-5 w-6 rounded-full shadow-lg z-0 ${
            theme === 'light' ? 'bg-white' : 'bg-accent-blue shadow-accent-blue/40'
          }`}
          initial={false}
          animate={{
            x: theme === 'light' ? 0 : 24,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        />

        {/* Buttons Grid */}
        <div className="grid grid-cols-2 w-full h-full relative z-10">
          {/* Light Toggle */}
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center justify-center transition-colors duration-300 ${
              theme === 'light' ? 'text-amber-500' : 'text-slate-400'
            }`}
            aria-label="Light Mode"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Dark Toggle */}
          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center justify-center transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-slate-400'
            }`}
            aria-label="Dark Mode"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
