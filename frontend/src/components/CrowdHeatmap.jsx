/**
 * CrowdHeatmap — Real-time zone density visualization.
 * - Per-zone occupancy progress bars with status color coding
 * - CRITICAL flashing overlay on zones at ≥95% capacity
 * - Delta change indicator (▲/▼) since last tick
 * - Total venue occupancy bar
 */
import { useWaitTimes } from '../hooks/useWaitTimes';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef } from 'react';

const STATUS_STYLES = {
  low: { card: 'border-emerald-500/10 hover:border-emerald-400/30', bar: 'bg-emerald-500', badge: 'bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', glow: '' },
  moderate: { card: 'border-amber-500/10 hover:border-amber-400/30', bar: 'bg-amber-500', badge: 'bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20', glow: '' },
  high: { card: 'border-orange-500/20 hover:border-orange-400/40', bar: 'bg-orange-500', badge: 'bg-orange-500/5 text-orange-600 dark:text-orange-400 border-orange-500/20', glow: 'shadow-orange-500/5' },
  critical: { card: 'border-red-500/40 hover:border-red-400/60', bar: 'bg-red-600', badge: 'bg-red-500/5 text-red-600 dark:text-red-400 border-red-500/30', glow: 'shadow-red-500/10' },
};

const ZONE_ICONS = {
  'north-stand': '🏟️',
  'south-stand': '🏟️',
  'east-wing': '🔵',
  'west-wing': '🟣',
  'food-court-north': '🍔',
  'food-court-south': '🍕',
  'vip-lounge': '⭐',
  'parking-a': '🅿️',
};

export default function CrowdHeatmap() {
  const { zones, totalOccupancy, totalCapacity, loading, error } = useWaitTimes();
  const prevOccupancy = useRef({});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
        ⚠️ Could not load crowd data: {error}
      </div>
    );
  }

  const overallPct = totalCapacity > 0 ? ((totalOccupancy / totalCapacity) * 100).toFixed(1) : 0;
  const overallStatus = overallPct >= 95 ? 'critical' : overallPct >= 80 ? 'high' : overallPct >= 50 ? 'moderate' : 'low';

  return (
    <section>
      {/* ── Overall occupancy bar ──────────────────────────── */}
      <div className={`mb-5 p-5 rounded-xl bg-theme-card border backdrop-blur-sm transition-all duration-700 ${STATUS_STYLES[overallStatus].card}`}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-black uppercase tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300">
              Total Venue Occupancy
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-[11px] font-bold uppercase px-3 py-1 rounded-full border tracking-wide ${STATUS_STYLES[overallStatus].badge}`}>
              {overallStatus}
            </span>
            <div className="text-base font-mono text-accent-cyan flex h-6 items-center">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={totalOccupancy}
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -15, opacity: 0 }}
                  className="inline-block"
                >
                  {totalOccupancy.toLocaleString()}
                </motion.span>
              </AnimatePresence>
              <span className="ml-2 text-theme-secondary opacity-70">/ {totalCapacity.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="h-3 rounded-full bg-theme-page border border-theme-main overflow-hidden relative transition-colors">
          <motion.div
            className={`h-full rounded-full ${STATUS_STYLES[overallStatus].bar}`}
            initial={{ width: 0 }}
            animate={{ width: `${overallPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
          {/* Shimmer on high load */}
          {overallPct > 80 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse rounded-full" />
          )}
        </div>
        <p className="text-right text-xs font-mono text-theme-secondary mt-1 transition-colors">{overallPct}%</p>
      </div>

      {/* ── Zone grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {zones.map((zone, i) => {
          const pct = (zone.density * 100).toFixed(1);
          const isCritical = zone.status === 'critical';
          const prev = prevOccupancy.current[zone.zoneId] ?? zone.currentOccupancy;
          const delta = zone.currentOccupancy - prev;
          prevOccupancy.current[zone.zoneId] = zone.currentOccupancy;
          const icon = ZONE_ICONS[zone.zoneId] || '📍';
          const styles = STATUS_STYLES[zone.status] || STATUS_STYLES.low;

          return (
            <motion.div
              key={zone.zoneId}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: 'easeOut' }}
              className={`group relative rounded-xl bg-theme-card border p-7 transition-all duration-300 ease-out
                hover:-translate-y-1 hover:shadow-elevated ${styles.card} ${styles.glow ? `shadow-lg ${styles.glow}` : ''}`}
            >
              {/* Critical flashing overlay */}
              {isCritical && (
                <div className="absolute inset-0 rounded-xl border-2 border-red-500/60 animate-pulse pointer-events-none" />
              )}

              {/* Header */}
              <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{icon}</span>
                  <h3 className="text-base font-bold text-theme-primary leading-relaxed">{zone.name}</h3>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border tracking-wider ${styles.badge} ${isCritical ? 'animate-pulse' : ''}`}>
                  {zone.status}
                </span>
              </div>

              {/* Density bar */}
              <div className="h-1.5 rounded-full bg-theme-page border border-theme-main overflow-hidden mb-3 transition-colors">
                <motion.div
                  className={`h-full rounded-full ${styles.bar}`}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
              </div>

              {/* Numbers row */}
              <div className="flex justify-between items-center text-xs font-mono relative z-10">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 items-center text-lg text-theme-primary font-bold">
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={zone.currentOccupancy}
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -15, opacity: 0 }}
                        className="inline-block"
                      >
                        {zone.currentOccupancy.toLocaleString()}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  {/* Delta change indicator */}
                  {delta !== 0 && (
                    <motion.span
                      key={delta}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className={`text-[9px] font-black ${delta > 0 ? 'text-red-400' : 'text-emerald-400'}`}
                    >
                      {delta > 0 ? `▲${delta}` : `▼${Math.abs(delta)}`}
                    </motion.span>
                  )}
                </div>
                <span className="text-theme-secondary transition-colors">{pct}%</span>
              </div>

              {/* Capacity footer */}
              <div className="mt-4 pt-4 border-t border-theme-main text-xs font-mono text-theme-secondary flex justify-between opacity-70">
                <span>cap {zone.capacity.toLocaleString()}</span>
                <span className={isCritical ? 'text-red-500 font-bold animate-pulse' : ''}>
                  {isCritical ? '⚠️ AT LIMIT' : `${(zone.capacity - zone.currentOccupancy).toLocaleString()} free`}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
