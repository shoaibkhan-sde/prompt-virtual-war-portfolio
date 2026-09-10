import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SECTIONS = [
  { id: 'north-stand', name: 'North Stand', icon: '🏟️' },
  { id: 'south-stand', name: 'South Stand', icon: '🏟️' },
  { id: 'east-wing', name: 'East Stand', icon: '🏟️' },
  { id: 'west-wing', name: 'West Stand', icon: '🏟️' },
  { id: 'vip-lounge', name: 'VIP Lounge', icon: '💎' },
];

export default function PersonalizationSelect({ onSelect }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedSection = localStorage.getItem('venueflow_user_section');
    if (!savedSection) {
      setIsOpen(true);
    }
  }, []);

  const handleSelect = (sectionId) => {
    localStorage.setItem('venueflow_user_section', sectionId);
    setIsOpen(false);
    if (onSelect) onSelect(sectionId);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-lg bg-theme-card border border-theme-main rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent-blue/20 rounded-full blur-[80px]" />

          <div className="relative z-10 text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-theme-primary tracking-tight">Welcome to VenueFlow</h2>
              <p className="text-theme-secondary text-sm font-medium opacity-80">
                To personalize your experience, please let us know:
              </p>
            </div>

            <h3 className="text-xl font-bold text-theme-primary">What section are you in?</h3>

            <div className="grid grid-cols-1 gap-3">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSelect(section.id)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-theme-page border border-theme-main hover:border-accent-blue/50 hover:bg-theme-main/10 transition-all duration-300 text-left group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{section.icon}</span>
                  <span className="font-bold text-theme-primary">{section.name}</span>
                  <svg className="ml-auto w-5 h-5 text-accent-blue opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>

            <p className="text-[10px] uppercase tracking-widest font-black text-theme-primary opacity-30 pt-4">
              Session-based preferences • No login required
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
