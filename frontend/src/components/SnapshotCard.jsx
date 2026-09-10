import React, { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

// ─── Design Tokens (actual CSS values, not Tailwind strings) ────────────────
const STATUS = {
  good: {
    hex: '#10b981',           // emerald-500
    bg: 'rgba(16,185,129,0.10)',
    glow: '0 0 40px -8px rgba(16,185,129,0.35)',
    bar: 'rgba(16,185,129,0.50)',
    badgeDot: '#10b981',
    trendBg: 'rgba(16,185,129,0.12)',
    trendText: '#059669',
  },
  caution: {
    hex: '#f59e0b',           // amber-500
    bg: 'rgba(245,158,11,0.10)',
    glow: '0 0 40px -8px rgba(245,158,11,0.35)',
    bar: 'rgba(245,158,11,0.50)',
    badgeDot: '#f59e0b',
    trendBg: 'rgba(245,158,11,0.12)',
    trendText: '#d97706',
  },
  crowded: {
    hex: '#f43f5e',           // rose-500
    bg: 'rgba(244,63,94,0.10)',
    glow: '0 0 40px -8px rgba(244,63,94,0.35)',
    bar: 'rgba(244,63,94,0.50)',
    badgeDot: '#f43f5e',
    trendBg: 'rgba(244,63,94,0.12)',
    trendText: '#e11d48',
  },
};

// ─── Animated Counter ────────────────────────────────────────────────────────
function AnimatedCounter({ value, duration = 1.6 }) {
  const [count, setCount] = useState(0);
  const [suffix, setSuffix] = useState('');

  useEffect(() => {
    if (value === undefined || value === null) return;

    // Extract number and suffix (e.g., "63%" -> 63, "%")
    let num = value;
    let sfx = '';

    if (typeof value === 'string') {
      const match = value.match(/([\d,.]+)(.*)/);
      if (match) {
        num = parseFloat(match[1].replace(/,/g, ''));
        sfx = match[2];
      } else {
        num = NaN;
      }
    }

    setSuffix(sfx);

    if (isNaN(num)) {
      setCount(value);
      return;
    }

    const controls = animate(0, num, {
      duration,
      ease: [0.25, 0.46, 0.45, 0.94],
      onUpdate: (v) => setCount(Math.floor(v)),
    });
    return () => controls.stop();
  }, [value, duration]);

  if (value === undefined || value === null) return null;
  const isNumeric = !isNaN(typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value);

  return (
    <>
      {isNumeric && typeof count === 'number' ? count.toLocaleString() : count}
      {suffix && <span className="text-3xl ml-0.5 opacity-60 font-bold">{suffix}</span>}
    </>
  );
}

// ─── Mini Sparkline ──────────────────────────────────────────────────────────
function MiniSparkline({ color, data = [30, 40, 35, 50, 45, 60, 55] }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 28, w = 64;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ');

  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        opacity="0.7"
      />
    </svg>
  );
}

// ─── Progress Ring ───────────────────────────────────────────────────────────
function ProgressRing({ percent, color }) {
  const r = 11;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(percent, 100) / 100) * circ;

  return (
    <svg width="30" height="30" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="15" cy="15" r={r} stroke="rgba(0,0,0,0.06)" strokeWidth="2.5" fill="transparent" />
      <motion.circle
        cx="15" cy="15" r={r}
        stroke={color}
        strokeWidth="2.5"
        fill="transparent"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── SnapshotCard ────────────────────────────────────────────────────────────
export default function SnapshotCard({
  label,
  title,
  sub,
  secondary,
  icon,
  trend,
  status = 'good',
  locationTag,
  progress = null,
  sparkline = false,
  loading = false,
}) {
  const tok = STATUS[status] || STATUS.good;

  if (loading) {
    return (
      <div 
        style={{ aspectRatio: '1/1', minWidth: 260, maxWidth: 360, width: '100%', border: '2px solid rgba(0,0,0,0.05)' }}
        className="relative overflow-hidden flex flex-col rounded-lg bg-white dark:bg-slate-900 mx-auto p-5 animate-pulse"
      >
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 mb-3" />
        <div className="w-24 h-3 bg-slate-100 dark:bg-white/5 mb-4 rounded-full" />
        <div className="w-32 h-16 bg-slate-100 dark:bg-white/5 mb-4 rounded-xl" />
        <div className="mt-auto space-y-2">
          <div className="w-full h-3 bg-slate-100 dark:bg-white/5 rounded-full" />
          <div className="w-2/3 h-2 bg-slate-100 dark:bg-white/5 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: `${tok.glow}, 0 24px 48px -12px rgba(0,0,0,0.12)` }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      style={{
        /* ── Square-ish card ─────────────────────────────────────── */
        aspectRatio: '1 / 1',
        minWidth: 260,
        maxWidth: 360,
        width: '100%',
        /* ── Base shadow ─────────────────────────────────────────── */
        boxShadow: `0 2px 16px -4px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)`,
        /* ── Full 4-side colored border ──────────────────────────── */
        border: `2px solid ${tok.hex}`,
      }}
      className="group relative overflow-hidden flex flex-col rounded-lg
                 bg-white dark:bg-slate-900
                 mx-auto p-5"
    >
      {/* ── Subtle colored top-right glow wash ─────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 100% 0%, ${tok.bg}, transparent)`,
          opacity: 0.7,
        }}
      />

      {/* ══════════════════════════════════════════════════════════════
          ROW 1 — Icon chip  +  Location badge  (always same row)
      ══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex items-center justify-between mb-3">
        {/* Icon chip */}
        <div
          className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0"
          style={{ background: tok.bg, color: tok.hex }}
        >
          {icon && React.cloneElement(icon, { size: 24, strokeWidth: 2.2 })}
        </div>

        {/* Location badge */}
        {locationTag && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
                       border border-slate-200 dark:border-white/10
                       bg-slate-50 dark:bg-white/5 shrink-0"
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
              style={{ background: tok.badgeDot }}
            />
            <span
              className="text-[10px] font-black uppercase tracking-widest
                         text-slate-500 dark:text-white/40 max-w-[110px] truncate"
              title={locationTag}
            >
              {locationTag}
            </span>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ROW 2 — Label
      ══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 mb-2">
        <p
          className="text-[12px] font-black uppercase tracking-[0.2em]
                     text-slate-400 dark:text-white/35 truncate"
          title={label}
        >
          {label}
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ROW 3 — Big number  +  Trend badge
      ══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex items-end justify-between gap-2 mb-1">
        <h4
          className="text-6xl font-black tracking-tighter leading-none
                     text-slate-900 dark:text-white"
          style={{ fontVariantNumeric: 'tabular-nums' }}
          title={title?.toString()}
        >
          <AnimatedCounter value={title} />
        </h4>

        <div className="flex items-center gap-2 pb-1">
          {/* Progress ring (if provided) */}
          {progress !== null && (
            <ProgressRing percent={progress} color={tok.hex} />
          )}

          {/* Trend chip */}
          {trend !== undefined && trend !== null && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-lg
                         text-[10px] font-black shrink-0"
              style={{
                background: trend > 0
                  ? 'rgba(16,185,129,0.10)'
                  : 'rgba(244,63,94,0.10)',
                color: trend > 0 ? '#059669' : '#e11d48',
              }}
            >
              {trend > 0
                ? <TrendingUp size={11} strokeWidth={2.5} />
                : <TrendingDown size={11} strokeWidth={2.5} />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ROW 4 — Sub text + Secondary (fills remaining space)
      ══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 mt-auto pt-2 space-y-0.5">
        {sub && (
          <p className="text-sm font-semibold text-slate-600 dark:text-white/60 leading-snug line-clamp-2">
            {sub}
          </p>
        )}
        {secondary && (
          <p className="text-[12px] font-medium text-slate-400 dark:text-white/30 italic truncate">
            {secondary}
          </p>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          Sparkline — bottom-right absolute, only when enabled
      ══════════════════════════════════════════════════════════════ */}
      {sparkline && (
        <div className="absolute bottom-4 right-4 opacity-50 pointer-events-none">
          <MiniSparkline color={tok.hex} />
        </div>
      )}

      {/* Bottom accent bar */}
      <motion.div
        className="absolute bottom-0 left-5 right-5 h-[3px] rounded-t-full pointer-events-none"
        style={{ background: tok.hex }}
        initial={{ scaleX: 0, opacity: 0 }}
        whileHover={{ scaleX: 1, opacity: 0.6 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}