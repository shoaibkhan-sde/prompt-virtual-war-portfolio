// src/components/VenueSearchModal.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Trophy, CheckCircle2, Zap } from 'lucide-react';
import { STADIUMS } from '../data/stadiums';

// ─── Team accent metadata ─────────────────────────────────────────────────────
// Light-theme-friendly: colors stay vivid, bg is soft tint on white
const TEAM_META = {
  wankhede: { abbr: 'MI', color: '#1d6fd8', bg: '#e8f0fb' },
  chidambaram: { abbr: 'CSK', color: '#9a7b00', bg: '#fdf8dc' },
  chinnaswamy: { abbr: 'RCB', color: '#c8292f', bg: '#fde8e9' },
  'eden-gardens': { abbr: 'KKR', color: '#6d3aab', bg: '#f0eaf9' },
  'rajiv-gandhi': { abbr: 'SRH', color: '#c45200', bg: '#fdeee4' },
  'arun-jaitley': { abbr: 'DC', color: '#1a5eb8', bg: '#e5eef9' },
  'punjab-pca': { abbr: 'PBKS', color: '#c0231b', bg: '#fde6e5' },
  hpca: { abbr: 'HPCA', color: '#4f46e5', bg: '#eeecfd' },
  'sawai-mansingh': { abbr: 'RR', color: '#b8286a', bg: '#fce8f2' },
  ekana: { abbr: 'LSG', color: '#8b21a0', bg: '#f5e8fb' },
  'narendra-modi': { abbr: 'GT', color: '#0e74aa', bg: '#e3f2fa' },
};

// ─── Stadium Card ─────────────────────────────────────────────────────────────
const StadiumCard = React.memo(({ stadium, isSelected, onClick, index }) => {
  const meta = TEAM_META[stadium.id] || { abbr: '●', color: '#64748b', bg: '#f1f5f9' };

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ delay: index * 0.02, duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`
        group relative w-full text-left p-4 rounded-xl border transition-all duration-200
        ${isSelected
          ? 'border-slate-300 bg-slate-50 shadow-md'
          : 'border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300'
        }
      `}
      style={isSelected ? { borderColor: `${meta.color}40`, backgroundColor: meta.bg } : {}}
    >
      {/* Selected left accent bar */}
      {isSelected && (
        <motion.div
          layoutId="accent-bar"
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
          style={{ backgroundColor: meta.color }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        />
      )}

      <div className="flex items-center gap-3">
        {/* Team badge */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-black tracking-wider transition-transform duration-200 group-hover:scale-105"
          style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}22` }}
        >
          {meta.abbr}
        </div>

        {/* Name + city */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-[13px] font-bold text-slate-800 leading-tight truncate">
              {stadium.name}
            </p>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em]">
            {stadium.city}
          </p>
        </div>

        {/* Selection indicator */}
        <div className="flex-shrink-0 ml-1">
          {isSelected ? (
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            >
              <CheckCircle2 size={18} style={{ color: meta.color }} />
            </motion.div>
          ) : (
            <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-200 group-hover:border-slate-300 transition-colors" />
          )}
        </div>
      </div>
    </motion.button>
  );
});

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function VenueSearchModal({ onSelect }) {
  const [selectedId, setSelectedId] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const selectedStadium = STADIUMS.find(s => s.id === selectedId);
  const selectedMeta = selectedId ? (TEAM_META[selectedId] || { color: '#1e293b', bg: '#f8fafc' }) : null;

  const handleConfirm = () => {
    if (!selectedStadium || confirming) return;
    setConfirming(true);
    setTimeout(() => onSelect(selectedStadium), 650);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8">

      {/*
        BACKDROP
        Light: soft slate blur — feels airy, not oppressive
      */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-slate-500/25 backdrop-blur-md"
      />

      {/*
        MODAL SHELL
        ─────────────────────────────────────────────────────────
        FIX 1 — CLIPPING ROOT CAUSE:
          Previous version used rounded-[2rem] (32px radius) + overflow-hidden.
          Large border-radius + overflow-hidden creates a large invisible clip zone
          in every corner. Any content near those corners (logo badge top-left,
          live-pill top-right) gets cut by the clip path.

        FIX: Use rounded-2xl (16px) → clip zone is half the size.
          Combined with adequate pt-5 on the header, the logo is now 20px from
          the top edge — safely past the 16px clip boundary.

        FIX 2 — "VENUES LIVE" RIGHT CLIP:
          The pill was flush against the right edge because the header used
          justify-between with no right padding buffer.
          Fix: header row uses pr-1 to give the pill 4px breathing room from
          the clip boundary. The pill itself also drops mr-0.5.

        FIX 3 — CONTAINER SHAPE:
          Per request: less rounded → rounded-2xl (16px) gives a clean
          "almost square" rectangle look vs the soft-bubble of rounded-[2rem].
      */}
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: [0.23, 1, 0.32, 1] }}
        className="relative w-full h-full md:h-auto md:max-h-[88vh] md:max-w-[460px] bg-white md:border md:border-slate-200 md:rounded-2xl md:shadow-[0_20px_60px_rgba(15,23,42,0.18)] flex flex-col overflow-hidden"
      >

        {/* ── HEADER ──────────────────────────────────────────── */}
        {/*
          pt-5 (20px) ensures the logo badge top edge is at y=20px from modal top.
          With rounded-2xl (16px radius), the clip zone only affects the first 16px
          of each corner — so the logo at y=20 is safely below the clip boundary.
          pr-1 gives the right-side pill a 4px buffer from the clip zone.
        */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex-shrink-0 pr-1">

          {/* Top bar: logo + live pill */}
          <div className="flex items-center justify-between mb-4 pr-4">
            {/*
              LOGO: w-8 h-8 with rounded-lg (8px radius).
              Sits at x=20, y=20 from modal corner — safely inside the 16px clip zone.
              No clipping possible.
            */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md flex-shrink-0">
                V
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.22em]">
                VenueFlow AI
              </span>
            </div>

            {/*
              LIVE PILL: pr-4 on the row wrapper pushes this 16px from modal right edge.
              The pill itself has px-2.5 py-1 — all text fully visible, no letter clipping.
            */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest whitespace-nowrap">
                Live Venue
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-4 pl-1">
            <h2 className="text-[22px] font-black text-slate-900 tracking-tight leading-none">
              Select Your Stadium
            </h2>
            <p className="text-[11px] text-slate-400 font-medium mt-1.5">
              Pick a venue to initialize real-time crowd intelligence
            </p>
          </div>
        </div>

        {/* ── LIST ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 custom-scrollbar">
          <div className="flex flex-col gap-3 mt-4 mb-4">
            {STADIUMS.map((stadium, i) => (
              <StadiumCard
                key={stadium.id}
                stadium={stadium}
                isSelected={selectedId === stadium.id}
                onClick={() => setSelectedId(stadium.id)}
                index={i}
              />
            ))}
          </div>
        </div>

        {/* ── FOOTER / CTA ────────────────────────────────────── */}
        <div className="px-5 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50">
          <motion.button
            onClick={handleConfirm}
            disabled={!selectedId || confirming}
            whileHover={selectedId && !confirming ? { scale: 1.015 } : {}}
            whileTap={selectedId && !confirming ? { scale: 0.978 } : {}}
            className={`
              relative w-full h-11 rounded-xl font-black text-[12px] uppercase tracking-widest
              flex items-center justify-center gap-2 overflow-hidden
              transition-all duration-300
              ${selectedId && !confirming
                ? 'text-white shadow-lg'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }
            `}
            style={
              selectedId && !confirming && selectedMeta
                ? { backgroundColor: selectedMeta.color }
                : {}
            }
          >
            {/* Shimmer sweep — only on active */}
            {selectedId && !confirming && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 pointer-events-none"
                initial={{ x: '-120%' }}
                animate={{ x: '220%' }}
                transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.8, ease: 'easeInOut' }}
              />
            )}

            {confirming ? (
              <>
                <Zap size={14} className="animate-pulse" />
                Initializing…
              </>
            ) : selectedId ? (
              <>
                <Zap size={14} />
                Enter {selectedStadium?.city}
              </>
            ) : (
              'Select a venue to continue'
            )}
          </motion.button>

          <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.22em] mt-3">
            VenueFlow™ Crowd Intelligence
          </p>
        </div>
      </motion.div>

      {/* Scrollbar — light theme flavour */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.14); }
      `}</style>
    </div>
  );
}