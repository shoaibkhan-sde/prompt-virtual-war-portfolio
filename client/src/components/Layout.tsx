import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Map as MapIcon, Accessibility, User, Compass, Shield, MoreVertical, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMatch, TEAM_CONFIG } from '../context/MatchContext';
import fifaLogo from '../../public/fifa-logo.png';

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { homeScore, awayScore, matchStatus } = useMatch();
  
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error', err);
    }
    setUser(null);
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-navy relative overflow-hidden">
      {/* Main Navigation Bar */}
      <header className="bg-[#0A0714]/75 backdrop-blur-md sticky top-0 z-40 border-b border-white/10 shadow-lg">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          
          {/* LEFT SIDE: BRANDING */}
          <NavLink to="/" className="flex items-center gap-4 group">
            <div className="flex items-center gap-3">
              <img src={fifaLogo} alt="FIFA 26 Logo" className="h-10 w-auto object-contain transition-transform group-hover:scale-105 mix-blend-screen" />
              <div>
                <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  Fanflow
                </h1>
              </div>
            </div>
          </NavLink>

          {/* CENTER / RIGHT SIDE: PRIMARY NAV ITEMS */}
          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4 lg:gap-8">
            
            {/* Routing NavLinks mapped to the new layout */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/" className={({ isActive }) => `text-[13px] font-semibold tracking-[0.3px] px-[14px] py-[8px] rounded-[7px] transition-all duration-150 ${isActive ? 'text-[#F6F3FA] bg-[#1E1836]' : 'text-[#A79BC0] hover:text-[#F6F3FA]'}`}>Home</NavLink>
              <NavLink to="/fan" className={({ isActive }) => `text-[13px] font-semibold tracking-[0.3px] px-[14px] py-[8px] rounded-[7px] transition-all duration-150 ${isActive ? 'text-[#F6F3FA] bg-[#1E1836]' : 'text-[#A79BC0] hover:text-[#F6F3FA]'}`}>Matchday Assistant</NavLink>
              <NavLink to="/ops" className={({ isActive }) => `text-[13px] font-semibold tracking-[0.3px] px-[14px] py-[8px] rounded-[7px] transition-all duration-150 ${isActive ? 'text-[#F6F3FA] bg-[#1E1836]' : 'text-[#A79BC0] hover:text-[#F6F3FA]'}`}>Stadium Command</NavLink>
              <NavLink to="/visualizer" className={({ isActive }) => `text-[13px] font-semibold tracking-[0.3px] px-[14px] py-[8px] rounded-[7px] transition-all duration-150 ${isActive ? 'text-[#F6F3FA] bg-[#1E1836]' : 'text-[#A79BC0] hover:text-[#F6F3FA]'}`}>Match Hub</NavLink>
            </nav>

            {/* FAR RIGHT: CONTROLS */}
            <div className="flex items-center gap-2.5">
              
              <div className="hidden lg:flex items-center gap-1.5 bg-[#2E230F] text-[#F5B942] text-[11px] font-bold tracking-[0.6px] px-2.5 py-1 rounded-full border border-[#F5B942]/30">
                <div className="w-1.5 h-1.5 rounded-full bg-[#F5B942] shadow-[0_0_0_0_rgba(245,185,66,0.55)] animate-pulse" style={{ boxShadow: '0 0 0 0 rgba(245,185,66,0.55)' }} />
                LIVE
              </div>

              <button
                onClick={() => setAccessibilityMode(!accessibilityMode)}
                className={`hidden md:flex w-[34px] h-[34px] rounded-lg border flex items-center justify-center transition-all ${
                  accessibilityMode
                    ? 'border-[#F6F3FA]/30 text-[#F6F3FA] bg-white/5'
                    : 'border-white/10 text-[#A79BC0] hover:text-[#F6F3FA] hover:border-white/20 hover:-translate-y-[1px]'
                }`}
                title="Accessibility"
              >
                <Accessibility size={16} />
              </button>

              <button className="hidden md:flex w-[34px] h-[34px] rounded-lg border border-white/10 items-center justify-center text-[#A79BC0] hover:text-[#F6F3FA] hover:border-white/20 hover:-translate-y-[1px] transition-all text-[11px] font-bold" title="Language">
                EN
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="w-[34px] h-[34px] rounded-lg border border-white/10 flex items-center justify-center text-[#A79BC0] hover:text-[#F6F3FA] hover:border-white/20 hover:-translate-y-[1px] transition-all"
                  title="Profile"
                >
                  <User size={16} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#1E1836] border border-[#2b2547] rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-[#2b2547]">
                      <div className="text-[13px] font-bold text-white truncate">
                        {user?.fullName || 'User'}
                      </div>
                      <div className="text-[11px] text-[#A79BC0] truncate mt-0.5">
                        {user?.isGuest ? 'Guest Account' : (user?.email || '')}
                      </div>
                    </div>
                    <div className="p-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-[#e5533d] hover:bg-[#e5533d]/10 rounded transition-colors"
                      >
                        <LogOut size={14} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

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

        {/* Mobile Extended Menu */}
        {isMobileMoreOpen && (
          <div className="md:hidden border-t border-slate-800 bg-brand-charcoal/95 px-4 py-3 flex flex-col gap-3">
            <NavLink 
              to="/visualizer"
              onClick={() => setIsMobileMoreOpen(false)}
              className={({ isActive }) => `flex items-center justify-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border w-full transition-all ${isActive ? 'bg-white/10 border-white/30 text-white' : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
            >
              <MapIcon size={16} />
              Map View
            </NavLink>
            <NavLink 
              to="/fan"
              onClick={() => setIsMobileMoreOpen(false)}
              className={({ isActive }) => `flex items-center justify-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border w-full transition-all ${isActive ? 'bg-white/10 border-white/30 text-white' : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
            >
              <Compass size={16} />
              Matchday Assistant
            </NavLink>
            <NavLink 
              to="/ops"
              onClick={() => setIsMobileMoreOpen(false)}
              className={({ isActive }) => `flex items-center justify-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border w-full transition-all ${isActive ? 'bg-white/10 border-white/30 text-white' : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
            >
              <Shield size={16} />
              Stadium Command
            </NavLink>

            <button
              onClick={() => {
                setAccessibilityMode(!accessibilityMode);
                setIsMobileMoreOpen(false);
              }}
              className={`flex items-center justify-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-all border w-full mt-2 ${
                accessibilityMode
                  ? 'bg-lime-500/20 border-lime-500/50 text-lime-300'
                  : 'bg-transparent border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Accessibility size={16} />
              {accessibilityMode ? 'ADA Mode Active' : 'Enable ADA Mode'}
            </button>
          </div>
        )}
      </header>

      {/* World Cup Match Context Strip */}
      <div className="w-full bg-[#0F151C] border-b border-white/10 z-30 relative">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-[46px] flex justify-between items-center text-[12px] text-slate-400">
          <div className="flex items-center gap-3 text-slate-100 font-bold">
            {matchStatus === "final" ? (
              <span className="text-[10px] uppercase font-black tracking-widest text-brand-amber bg-brand-amber/10 border border-brand-amber/20 px-2 py-0.5 rounded mr-1">FINAL</span>
            ) : (
              <span className="text-[10px] uppercase font-black tracking-widest text-brand-teal bg-brand-teal/10 border border-brand-teal/20 px-2 py-0.5 rounded mr-1 animate-pulse">LIVE</span>
            )}
            <img src={TEAM_CONFIG.home.flagUrl} className="w-[18px] h-[18px] rounded flex-shrink-0 object-cover" alt={`${TEAM_CONFIG.home.code} Flag`} />
            <span>{TEAM_CONFIG.home.code}</span>
            <span className="text-slate-500 font-normal px-1">{homeScore} — {awayScore}</span>
            <span>{TEAM_CONFIG.away.code}</span>
            <img src={TEAM_CONFIG.away.flagUrl} className="w-[18px] h-[18px] rounded flex-shrink-0 object-cover" alt={`${TEAM_CONFIG.away.code} Flag`} />
          </div>
          <div className="flex items-center gap-4 sm:gap-[18px]">
            <span className="text-brand-amber font-bold">78:24</span>
            <span className="hidden sm:inline">MetLife Stadium</span>
            <span className="hidden sm:inline">Attendance 81,240</span>
            <span className="hidden lg:inline">28&deg;C, clear</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-3 sm:p-4 md:p-6 overflow-x-hidden relative">
        <Outlet />
      </main>
    </div>
  );
};
