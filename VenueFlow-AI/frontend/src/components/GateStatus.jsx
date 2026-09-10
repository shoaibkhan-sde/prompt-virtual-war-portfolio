import { useMemo, useState, useCallback, memo } from 'react';
import { useCrowdData } from '../hooks/useCrowdData';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Clock, Users, Navigation, X,
  ChevronDown, ChevronUp, AlertTriangle, Zap,
  ArrowUpDown, SlidersHorizontal, Activity
} from 'lucide-react';

// ─── Constants & Styles ─────────────────────────────────────────────────────
const STATUS = {
  clear: { label: 'Clear', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25' },
  moderate: { label: 'Moderate', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/25' },
  heavy: { label: 'Heavy', dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/25' },
  closed: { label: 'Closed', dot: 'bg-slate-400', badge: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/25' },
};

const STATUS_THEME = {
  clear: {
    glow: 'rgba(16,185,129,0.15)',
    border: 'rgba(16,185,129,0.25)',
    accent: '#10b981',
    accentDim: 'rgba(16,185,129,0.12)',
    waitColor: 'text-emerald-400',
    label: 'text-emerald-400',
    bar: 'bg-emerald-400',
    hint: 'Fast entry',
    hintIcon: '⚡',
  },
  moderate: {
    glow: 'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.25)',
    accent: '#f59e0b',
    accentDim: 'rgba(245,158,11,0.10)',
    waitColor: 'text-amber-400',
    label: 'text-amber-400',
    bar: 'bg-amber-400',
    hint: 'Moderate crowd',
    hintIcon: '⚠',
  },
  heavy: {
    glow: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.22)',
    accent: '#ef4444',
    accentDim: 'rgba(239,68,68,0.10)',
    waitColor: 'text-rose-400',
    label: 'text-rose-400',
    bar: 'bg-rose-400',
    hint: 'Avoid if possible',
    hintIcon: '✕',
  },
  closed: {
    glow: 'rgba(148,163,184,0.10)',
    border: 'rgba(148,163,184,0.20)',
    accent: '#94a3b8',
    accentDim: 'rgba(148,163,184,0.08)',
    waitColor: 'text-slate-400',
    label: 'text-slate-400',
    bar: 'bg-slate-400',
    hint: 'Gate closed',
    hintIcon: '—',
  },
};

// ─── Logic Helpers ──────────────────────────────────────────────────────────
const getStatus = (gate) => {
  if (!gate.isOpen) return 'closed';
  if (gate.estimatedWaitSec > 100) return 'heavy';
  if (gate.estimatedWaitSec > 40) return 'moderate';
  return 'clear';
};

const fmtWait = (sec) => {
  if (!sec || sec <= 0) return { val: '0', unit: 'SEC' };
  if (sec >= 3600) return { val: (sec / 3600).toFixed(1), unit: 'HR' };
  if (sec >= 60) return { val: (sec / 60).toFixed(0), unit: 'MIN' };
  return { val: Math.round(sec).toString(), unit: 'SEC' };
};

// ─── Shared Components ──────────────────────────────────────────────────────
const Ticker = memo(({ value }) => (
  <span className="relative inline-flex flex-col overflow-hidden h-[1em] leading-none">
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={value}
        initial={{ y: "100%" }} animate={{ y: "0%" }} exit={{ y: "-100%" }}
        transition={{ duration: 0.3, ease: "circOut" }}
        className="block"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  </span>
));

const StatusBadge = memo(({ status }) => {
  const s = STATUS[status] ?? STATUS.clear;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-[0.16em] ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${status !== 'closed' ? 'animate-pulse' : ''}`} />
      {s.label}
    </span>
  );
});

// ─── 1. Gate Card ────────────────────────────────────────────────────────────
const GateCard = memo(({ rec, isHero = false }) => {
  const waitVal = rec.predictedWaitSec ?? rec.gate.estimatedWaitSec;
  const status = getStatus({ ...rec.gate, estimatedWaitSec: waitVal });
  const wait = fmtWait(waitVal);
  const theme = STATUS_THEME[status] ?? STATUS_THEME.clear;
  const queue = rec.gate.currentQueue ?? 0;
  const dist = Math.round(rec.distanceMeters);

  const pressure = Math.min(100, ((queue / 300) * 100));

  const waitLabel = wait.val === '0'
    ? 'No wait'
    : `${wait.val} ${wait.unit.toLowerCase()} wait`;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className={`relative overflow-hidden rounded-xl border aspect-[14/10] flex flex-col transition-colors duration-500 ${
        isHero 
          ? 'bg-accent-blue/[0.08] border-accent-blue/30 shadow-xl shadow-accent-blue/5' 
          : 'bg-theme-card border-theme-main shadow-sm'
      }`}
    >
      {(isHero || status === 'clear') && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1 bg-accent-blue/20 border border-accent-blue/30 rounded-full backdrop-blur-md">
          <Zap size={10} className="text-accent-blue fill-accent-blue animate-pulse" />
          <span className="text-[10px] font-black text-accent-blue uppercase tracking-[0.22em]">AI RECOMMENDED</span>
        </div>
      )}

      {/* Ambient glow blob — top-right corner */}
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[60px] pointer-events-none opacity-60 transition-colors duration-500"
        style={{ background: isHero ? 'var(--color-accent-blue)' : theme.glow }}
      />

      <div className="relative z-10 p-7 pl-8 pr-10 flex flex-col flex-1 justify-between">

        {/* ── ROW 1: Gate name + status badge */}
        <div className="flex items-center justify-start gap-4">
          <h3 className="text-2xl font-black text-theme-primary tracking-tight leading-tight transition-colors">
            {rec.gate.name}
          </h3>
          <span
            className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.16em] border"
            style={{
              color: theme.accent,
              borderColor: theme.border,
              background: theme.accentDim,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: theme.accent }}
            />
            {STATUS[status]?.label ?? 'Clear'}
          </span>
        </div>

        {/* ── ROW 2: PRIMARY METRIC — wait time */}
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-theme-primary mb-1.5 transition-colors">
            Estimated Wait
          </p>
          <div className="flex items-end gap-2">
            <span className={`text-5xl font-black leading-none transition-colors ${isHero ? 'text-accent-blue' : theme.waitColor}`}>
              <Ticker value={wait.val} />
            </span>
            <span className="text-base font-bold text-theme-secondary mb-1 transition-colors">
              {wait.unit.toLowerCase()}
            </span>
          </div>
        </div>

        {/* ── ROW 3: SECONDARY METRICS — distance + people */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isHero ? 'bg-accent-blue/20' : ''}`}
              style={!isHero ? { background: theme.accentDim } : {}}
            >
              <Navigation size={12} className={isHero ? 'text-accent-blue' : ''} style={!isHero ? { color: theme.accent } : {}} />
            </div>
            <div>
                <p className="text-[11px] font-black text-theme-primary uppercase tracking-widest transition-colors">Distance</p>
                <p className="text-sm font-black text-theme-primary transition-colors">{dist} m away</p>
            </div>
          </div>

          <div className="w-px h-8 bg-theme-main/50 transition-colors" />

          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isHero ? 'bg-accent-blue/20' : ''}`}
              style={!isHero ? { background: theme.accentDim } : {}}
            >
              <Users size={12} className={isHero ? 'text-accent-blue' : ''} style={!isHero ? { color: theme.accent } : {}} />
            </div>
            <div>
                <p className="text-[11px] font-black text-theme-primary uppercase tracking-widest transition-colors">In Line</p>
                <p className="text-sm font-black text-theme-primary transition-colors">{queue} people</p>
            </div>
          </div>
        </div>

        {/* ── ROW 4: Capacity bar */}
        <div>
          <div className="h-1.5 w-full rounded-full bg-theme-main/20 overflow-hidden transition-colors">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pressure}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className={`h-full rounded-full transition-colors ${isHero ? 'bg-accent-blue shadow-[0_0_10px_rgba(59,130,246,0.3)]' : theme.bar}`}
            />
          </div>
          <div className="flex justify-between mt-1.5 transition-colors">
            <p className="text-[11px] font-black text-theme-primary uppercase tracking-[0.2em] ml-1">
              Gate pressure
            </p>
            <p className="text-[10px] font-black transition-colors" style={{ color: isHero ? 'var(--color-accent-blue)' : theme.accent }}>
              {Math.round(pressure)}%
            </p>
          </div>
        </div>

        {/* ── ROW 5: Decision hint */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors"
          style={{ 
            background: theme.accentDim, 
            borderColor: theme.border 
          }}
        >
          <span className="text-sm">{isHero ? '⚡' : theme.hintIcon}</span>
          <span className="text-[10px] font-black uppercase tracking-[0.18em] transition-colors"
            style={{ color: theme.accent }}>
            {isHero ? 'Fast Entry' : theme.hint}
          </span>
          <span className="ml-auto text-[10px] font-bold text-theme-secondary transition-colors">
            {waitLabel}
          </span>
        </div>

      </div>
    </motion.div>
  );
});

// ─── 2. Directory Table ──────────────────────────────────────────────────────
const DataGrid = memo(({ gates, selectedGate, onSelectGate }) => {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? gates : gates.filter(g => getStatus(g) === filter);

  const filterBtnClass = (f) => [
    'px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all',
    filter === f
      ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/40'
      : 'text-theme-primary bg-theme-main/10 hover:bg-theme-main/20',
  ].join(' ');

  const rowClass = (g) => [
    'cursor-pointer transition-colors border-b border-white/10',
    selectedGate?.gateId === g.gateId
      ? 'bg-accent-blue/20'
      : 'hover:bg-white/10',
  ].join(' ');

  return (
    <div className="bg-theme-card border border-theme-main overflow-hidden shadow-sm transition-colors duration-500">
      <div className="px-8 py-6 border-b border-theme-main flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02] transition-colors">
        <span className="text-xs font-black text-theme-primary uppercase tracking-widest transition-colors">
          Live Gate Directory
        </span>
        <div className="flex gap-2">
          {['all', 'moderate', 'heavy'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={filterBtnClass(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs font-black text-theme-primary uppercase tracking-widest border-b border-theme-main transition-colors">
              <th className="px-8 py-4">Gate Name</th>
              <th className="px-8 py-4">Wait Time</th>
              <th className="px-8 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y border-theme-main">
            {filtered.map(g => (
              <tr key={g.gateId} onClick={() => onSelectGate(g)} className={rowClass(g)}>
                <td className="px-8 py-4 font-bold text-theme-primary transition-colors">
                  {g.name}
                </td>
                <td className="px-8 py-4 font-mono font-bold text-theme-primary transition-colors">
                  {fmtWait(g.estimatedWaitSec).val}{fmtWait(g.estimatedWaitSec).unit}
                </td>
                <td className="px-8 py-4 text-center">
                  <StatusBadge status={getStatus(g)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// ─── 3. Detail Panel ─────────────────────────────────────────────────────────
const DetailPanel = memo(({ gate, onClose, onRedirect, onViewMap }) => {
  const status = getStatus(gate);
  const wait = fmtWait(gate.estimatedWaitSec);
  
  const ZONE_NAME_MAP = {
    'north-stand': 'North Stand',
    'south-stand': 'South Stand',
    'east-wing': 'East Stand',
    'west-wing': 'West Stand',
    'food-court-north': 'North Food Hub',
    'food-court-south': 'South Food Hub',
    'vip-lounge': 'VIP Lounge',
    'parking-a': 'Parking (Zone A)'
  };

  const zoneDisplayName = ZONE_NAME_MAP[gate.zone] || gate.zone;

  return (
    <div className="bg-white dark:bg-theme-card border border-slate-200 dark:border-theme-main p-8 shadow-lg dark:shadow-none h-fit sticky top-8">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-black text-slate-800 dark:text-theme-primary tracking-tight">{gate.name}</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-theme-secondary rounded-xl transition-colors"><X size={18} /></button>
      </div>
      <div className="space-y-6">
        <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-slate-100 dark:border-theme-main text-center">
          <p className="text-[10px] font-black text-slate-400 dark:text-theme-secondary uppercase tracking-widest mb-2">Wait Time</p>
          <div className="text-4xl font-black text-slate-800 dark:text-theme-primary">{wait.val} <span className="text-sm font-bold text-slate-400 dark:text-theme-secondary opacity-40">{wait.unit}</span></div>
        </div>
        <div className="flex justify-between items-center px-2">
          <span className="text-[10px] font-black text-slate-400 dark:text-theme-secondary uppercase tracking-widest italic opacity-60">Zone: {zoneDisplayName}</span>
          <StatusBadge status={status} />
        </div>
        <div className="space-y-3 pt-4">
          <button onClick={() => onRedirect(gate.name)} className="w-full py-4 rounded-2xl bg-slate-800 dark:bg-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-700 dark:hover:bg-white/20 transition-colors">Navigate</button>
          <button onClick={() => onViewMap(gate.gateId)} className="w-full py-4 rounded-2xl bg-transparent border border-slate-200 dark:border-theme-main text-slate-700 dark:text-theme-primary text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">View Map</button>
        </div>
      </div>
    </div>
  );
});

// ─── ROOT COMPONENT ─────────────────────────────────────────────────────────
export default function GateStatus() {
  const { gates, recommendations, loading, error } = useCrowdData();
  const [selectedGate, setSelectedGate] = useState(null);

  const handleRedirect = useCallback((name) => {
    window.dispatchEvent(new CustomEvent('venueflow:action', { detail: { tab: 'assistant', message: `Redirect from ${name}.` } }));
  }, []);

  const handleViewMap = useCallback((id) => {
    window.dispatchEvent(new CustomEvent('venueflow:action', { detail: { tab: 'map', zoneId: id } }));
  }, []);

  if (loading && !gates.length) return <div className="h-64 bg-[#0A0B10]/50 animate-pulse rounded-xl" />;
  if (error) return <div className="p-10 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl">Error: {error}</div>;

  const hero = recommendations?.[0] || null;

  // Logic: Show ALL clear status gates as secondary cards (up to 6)
  const clearGatesNotHero = gates.filter(g =>
    getStatus(g) === 'clear' && g.gateId !== hero?.gate?.gateId
  ).slice(0, 6);

  const shownSecondaryRecs = clearGatesNotHero.map(g => {
    const rec = recommendations?.find(r => r.gate.gateId === g.gateId);
    return rec || {
      gate: g,
      distanceMeters: 0,
      predictedWaitSec: g.estimatedWaitSec,
      compositeScore: 0
    };
  });

  const shownGateIds = [
    ...(hero ? [hero.gate.gateId] : []),
    ...shownSecondaryRecs.map(r => r.gate.gateId)
  ];
  const tableGates = gates.filter(g => !shownGateIds.includes(g.gateId));

  return (
    <div className="flex flex-col gap-10 pb-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {hero && (
          <GateCard
            key={hero.gate.gateId}
            rec={hero}
            isHero={true}
          />
        )}
        {shownSecondaryRecs.map((rec) => (
          <GateCard
            key={rec.gate.gateId}
            rec={rec}
          />
        ))}
      </div>

      <div className={`grid gap-10 ${selectedGate ? 'grid-cols-1 xl:grid-cols-[1fr_360px]' : 'grid-cols-1'}`}>
        <DataGrid
          gates={tableGates}
          selectedGate={selectedGate}
          onSelectGate={setSelectedGate}
        />
        {selectedGate && (
          <DetailPanel
            gate={selectedGate}
            onClose={() => setSelectedGate(null)}
            onRedirect={handleRedirect}
            onViewMap={handleViewMap}
          />
        )}
      </div>
    </div>
  );
}