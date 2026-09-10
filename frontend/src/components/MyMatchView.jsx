import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Radio,
  Map as MapIcon,
  ArrowRight,
  Zap,
  Target,
  Clock,
  LayoutGrid,
  Users
} from 'lucide-react';

const SECTION_MAP = {
  'north-stand': { name: 'North Stand', gate: 'gate-n1', court: 'food-court-north' },
  'south-stand': { name: 'South Stand', gate: 'gate-s1', court: 'food-court-south' },
  'east-wing': { name: 'East Stand', gate: 'gate-e1', court: 'food-court-north' },
  'west-wing': { name: 'West Stand', gate: 'gate-w1', court: 'food-court-south' },
  'food-court-north': { name: 'North Food Hub', gate: 'gate-n1', court: 'food-court-north' },
  'food-court-south': { name: 'South Food Hub', gate: 'gate-s1', court: 'food-court-south' },
  'vip-lounge': { name: 'VIP Lounge', gate: 'gate-vip', court: 'food-court-north' },
  'parking-a': { name: 'Parking (Zone A)', gate: 'gate-n1', court: 'food-court-south' },
};

export default function MyMatchView({ userSection, gates, zones }) {
  const isGlobal = !userSection;
  const sectionData = isGlobal ? { name: 'Global Venue' } : (SECTION_MAP[userSection] || { name: 'VenueZone' });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-none bg-[#0A0B10] border border-white/5 shadow-2xl mb-8 md:mb-12"
    >
      {/* Atmospheric background — pointer-events-none so it never intercepts clicks */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[50%] h-[100%] bg-gradient-to-l from-accent-blue/10 to-transparent opacity-50" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent-blue blur-[100px] opacity-20 animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-96 h-24 bg-accent-cyan blur-[80px] opacity-10" />
      </div>

      {/*
        FIX: Was p-10 lg:p-14 (40px / 56px).
        On mobile widths (375–430px) this consumed 80px of horizontal space
        before any content was rendered, forcing text to overflow.
        Now: p-6 sm:p-10 lg:p-14 — 24px on mobile, 40px sm, 56px lg.
      */}
      <div className="relative z-10 p-6 sm:p-10 lg:p-14">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 lg:gap-12">

          {/* Left: Branding & Status */}
          <div className="space-y-5 max-w-xl w-full lg:w-auto">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-none bg-accent-blue/10 border border-accent-blue/20 text-accent-blue">
                <Radio size={14} className="animate-pulse flex-shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap">Operational Mission Control</span>
              </div>
              <div className="h-px w-12 bg-white/10 hidden sm:block" />
            </div>

            {/*
              FIX: text-5xl md:text-7xl — 7xl (72px) on a 375px screen with
              long venue names like "Global Venue" was causing text overflow.
              Now: text-4xl sm:text-5xl md:text-7xl — safe on all widths.
            */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9]">
              {isGlobal ? 'Venue' : 'Welcome to'} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue via-emerald-400 to-accent-cyan">
                {sectionData.name}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-white/50 font-medium leading-relaxed max-w-md">
              Smart crowd control is active. Live routing is guiding visitors to the fastest entry points.
            </p>
          </div>

          {/* Right: Smart Recommendations (Single Large Card) */}
          <div className="w-full lg:max-w-md">
            <InsightCard
              icon={<MapIcon size={20} />}
              label="Fastest Entry Point"
              title="Least Busy Gate"
              sub="Minimal wait · Smooth flow"
              trend="Recommended Gate"
              color="text-emerald-400"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('venueflow:action', {
                  detail: { tab: 'gates' }
                }));
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function InsightCard({ icon, label, title, sub, trend, color, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.03)' }}
      onClick={onClick}
      className={`p-5 sm:p-6 lg:p-8 rounded-none bg-white/[0.02] border border-white/5 backdrop-blur-md transition-all group ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/*
        FIX: Removed px-10 from this row — it was adding 80px of extra
        horizontal padding inside an already-padded card.
      */}
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-none bg-white/5 ${color} group-hover:scale-110 transition-transform flex-shrink-0`}>
          {icon}
        </div>
        {/*
          FIX: Removed px-10 from trend badge — same issue as above.
        */}
        <div className={`text-[10px] font-black uppercase tracking-widest ${color} opacity-40 group-hover:opacity-100 transition-opacity text-right`}>
          {trend}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{label}</div>
        <div className="text-lg sm:text-xl font-black text-white leading-tight">{title}</div>
        <div className="text-[11px] font-medium text-white/40">{sub}</div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[9px] font-black uppercase tracking-widest text-accent-blue">{onClick ? 'Quickest Way In' : 'Execute Redirect'}</span>
        <ArrowRight size={14} className="text-accent-blue flex-shrink-0" />
      </div>
    </motion.div>
  );
}