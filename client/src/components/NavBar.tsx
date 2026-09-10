import React, { useState } from 'react';
import { Compass, Activity, Shield, Accessibility, MoreVertical } from 'lucide-react';
import fifaLogo from '../../public/fifa-logo.png';

interface NavBarProps {
  venueName: string;
  activePersona: 'fan' | 'ops';
  setActivePersona: (persona: 'fan' | 'ops') => void;
  setMapHighlights: (highlights: string[]) => void;
  accessibilityMode: boolean;
  setAccessibilityMode: (mode: boolean) => void;
}

export const NavBar: React.FC<NavBarProps> = ({
  activePersona,
  setActivePersona,
  setMapHighlights,
  accessibilityMode,
  setAccessibilityMode,
}) => {
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

  return (
    <header className="bg-black sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        
        {/* LEFT SIDE: BRANDING */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <img src={fifaLogo} alt="FIFA 26 Logo" className="h-10 w-auto object-contain" />
            <div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                Fanflow
              </h1>
            </div>
          </div>
        </div>

        {/* CENTER / RIGHT SIDE: PRIMARY NAV ITEMS */}
        <div className="flex flex-1 items-center justify-end md:justify-center gap-2 sm:gap-4 lg:gap-6">
          
          {/* Live Status Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-lime-500/10 border border-lime-500/20 text-lime-400 text-[10px] font-bold uppercase tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
            Live
          </div>

        {/* FAR RIGHT: CONTROLS */}
        <div className="flex items-center gap-3">
          
          {/* View Personas */}
          <div className="flex bg-white/5 p-1 rounded-xl" role="tablist" aria-label="View Personas">
            <button
              onClick={() => {
                setActivePersona('fan');
                setMapHighlights([]);
              }}
              role="tab"
              aria-selected={activePersona === 'fan'}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePersona === 'fan'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Compass size={14} className={activePersona === 'fan' ? 'text-white' : ''} />
              <span className="hidden xl:inline">Matchday Assistant</span>
            </button>
            
            <button
              onClick={() => {
                setActivePersona('ops');
                setMapHighlights([]);
              }}
              role="tab"
              aria-selected={activePersona === 'ops'}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePersona === 'ops'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Shield size={14} className={activePersona === 'ops' ? 'text-white' : ''} />
              <span className="hidden xl:inline">Stadium Command</span>
            </button>
          </div>

          <div className="h-6 w-px bg-white/20 hidden md:block"></div>

          {/* ADA Toggle */}
          <button
            onClick={() => setAccessibilityMode(!accessibilityMode)}
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              accessibilityMode
                ? 'bg-white/20 border-white/30 text-white'
                : 'bg-transparent border-transparent text-white/60 hover:bg-white/5 hover:text-white'
            }`}
            aria-pressed={accessibilityMode}
            aria-label="Toggle High-Contrast Mode"
          >
            <Accessibility size={16} />
            <span className="hidden xl:inline">ADA</span>
          </button>

          {/* Mobile More Menu */}
          <button 
            className="md:hidden p-2 text-white/60 hover:text-white transition-colors"
            onClick={() => setIsMobileMoreOpen(!isMobileMoreOpen)}
            aria-label="More options"
          >
            <MoreVertical size={20} />
          </button>
        </div>
        </div>
      </div>

      {/* Mobile Extanded Menu */}
      {isMobileMoreOpen && (
        <div className="md:hidden border-t border-emerald-900/60 bg-emerald-950 px-4 py-3 flex flex-col gap-3">
          <button 
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setIsMobileMoreOpen(false);
            }}
            className="flex items-center justify-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border border-emerald-800 bg-emerald-900 text-emerald-100 w-full hover:bg-emerald-800"
          >
            <Activity size={16} />
            Scroll to Map
          </button>

          <button
            onClick={() => {
              setAccessibilityMode(!accessibilityMode);
              setIsMobileMoreOpen(false);
            }}
            className={`flex items-center justify-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-all border w-full ${
              accessibilityMode
                ? 'bg-lime-500/20 border-lime-500/50 text-lime-300'
                : 'bg-emerald-950 border-emerald-900/60 text-emerald-400/60'
            }`}
          >
            <Accessibility size={16} />
            {accessibilityMode ? 'ADA Mode Active' : 'Enable ADA Mode'}
          </button>
        </div>
      )}
    </header>
  );
};
