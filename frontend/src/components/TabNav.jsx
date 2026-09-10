import React from 'react';
import { motion } from 'framer-motion';
import { Home, Users, Route, Bell, Bot, Map } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Home', icon: Home },
  { id: 'crowd', label: 'Crowd', icon: Users },
  { id: 'gates', label: 'Best Gate', icon: Route },
  { id: 'alerts', label: 'Live Updates', icon: Bell },
  { id: 'assistant', label: 'Ask AI', icon: Bot },
  { id: 'map', label: 'Map', icon: Map },
];

export default function TabNav({ activeTab, setActiveTab, alertCount = 0, hasCriticalZone = false }) {
  return (
    <nav className="relative z-40 shrink-0 w-full overflow-x-hidden backdrop-blur-xl bg-theme-card/80 border-b border-theme-main transition-all duration-500" aria-label="Main Navigation">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 overflow-x-auto no-scrollbar overscroll-x-contain">
        <div className="flex items-center h-[64px] sm:h-[72px] gap-1 sm:gap-3 lg:gap-6 xl:gap-8 min-w-max" role="tablist">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;

            // Badge logic (Precision anchored with overflow protection)
            let badge = null;
            if (tab.id === 'alerts' && alertCount > 0) {
              badge = (
                <span className="absolute -top-1 -right-1.5 flex h-2.5 w-2.5 z-30" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600 border-[1.5px] border-theme-page" />
                </span>
              );
            } else if (tab.id === 'crowd') {
              badge = (
                <span className="absolute -top-1 -right-1.5 flex h-2.5 w-2.5 z-30" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border-[1.5px] border-theme-page" />
                </span>
              );
            } else if (tab.id === 'assistant') {
              badge = (
                <span className="absolute -top-1 -right-1.5 flex h-2.5 w-2.5 z-30" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-[1.5px] border-theme-page" />
                </span>
              );
            }

            return (
              <motion.button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-label={tab.label}
                onClick={() => setActiveTab(tab.id)}
                whileTap={{ scale: 0.96 }}
                className={`cursor-pointer relative h-full px-4 py-3 sm:px-6 flex items-center gap-3 transition-all duration-300 group
                  ${isActive ? 'text-accent-blue font-black' : 'text-theme-secondary hover:text-accent-blue'}`}
              >

                <div className="relative z-10 flex items-center gap-2.5">
                  <div className="relative">
                    <div className={`transition-all duration-300 transform 
                      ${isActive ? 'scale-110' : 'opacity-100 group-hover:opacity-100 group-hover:scale-110'}`}>
                      <tab.icon size={18} strokeWidth={2} />
                    </div>
                    {badge}
                  </div>

                  <span className={`relative z-10 text-[12px] sm:text-[13px] font-black uppercase tracking-[0.12em] whitespace-nowrap transition-all duration-300
                    ${isActive ? 'opacity-100' : 'opacity-100 group-hover:opacity-100'}`}>
                    {tab.label}
                  </span>
                </div>

                {isActive && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-accent-blue z-20"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}

              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}