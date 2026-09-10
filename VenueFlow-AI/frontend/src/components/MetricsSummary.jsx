// frontend/src/components/MetricsSummary.jsx
import React, { useEffect, useRef } from 'react';
import { motion, animate } from 'framer-motion';
import { useMetrics } from '../hooks/useMetrics';
import {
  Users, Clock, AlertTriangle,
  ArrowUpRight, ArrowDownRight,
  Activity, UserCheck
} from 'lucide-react';

function formatWait(sec) {
  if (sec >= 3600) return `${(sec / 3600).toFixed(1)}h`;
  if (sec >= 60) return `${(sec / 60).toFixed(1)}m`;
  return `${Math.round(sec)}s`;
}

function Counter({ value, decimal = 0 }) {
  const nodeRef = useRef();
  useEffect(() => {
    const node = nodeRef.current;
    const controls = animate(0, value, {
      duration: 1.5,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(v) { node.textContent = v.toFixed(decimal); },
    });
    return () => controls.stop();
  }, [value, decimal]);
  return <span ref={nodeRef} />;
}

function KpiCard({ title, value, sub, icon: Icon, color, trend = null, delay = 0, warn = false, tint = null }) {
  const tintStyles = {
    green: { bg: 'bg-emerald-500/[0.06] border-emerald-500/20 hover:border-emerald-500/40', glow: 'bg-emerald-500' },
    blue: { bg: 'bg-blue-500/[0.06] border-blue-500/20 hover:border-blue-500/40', glow: 'bg-accent-blue' },
    rose: { bg: 'bg-rose-500/[0.06] border-rose-500/20 hover:border-rose-500/40', glow: 'bg-rose-500' },
    yellow: { bg: 'bg-yellow-300/[0.12] border-yellow-300/30 hover:border-yellow-400/50', glow: 'bg-yellow-300' },
  };

  const activeTint = tint ? tintStyles[tint] : (warn ? tintStyles.rose : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -8, scale: 1.01 }}
      className={`group relative flex-1 min-w-0 rounded-xl border backdrop-blur-3xl shadow-premium transition-all duration-500
        p-5 sm:p-8
        ${activeTint ? activeTint.bg : 'bg-white/[0.02] border-white/5 hover:border-accent-blue/30'}`}
      style={{ minHeight: '160px' }}
    >
      <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-30 transition-opacity duration-1000 pointer-events-none ${activeTint ? activeTint.glow : 'bg-accent-blue'}`} />

      <div className="relative z-10 flex flex-col h-full justify-between gap-4 sm:gap-6">

        {/* Title row */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-lg bg-white/5 text-theme-secondary opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <Icon size={18} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-theme-secondary opacity-40 group-hover:opacity-100 transition-opacity leading-tight">
              {title}
            </span>
          </div>

          {trend && (
            <div className={`self-start flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black tracking-widest ${trend === 'up' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {trend === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {trend === 'up' ? '+2.4%' : '-1.2%'}
            </div>
          )}
        </div>

        {/* Value + sub */}
        <div className="pb-1">
          <div className={`text-4xl sm:text-5xl font-black tracking-tighter ${color} flex items-baseline overflow-visible mb-2`}>
            <span className="group-hover:scale-105 transition-transform origin-left inline-block">
              {typeof value === 'number'
                ? <Counter value={value} decimal={value < 10 ? 1 : 0} />
                : value}
            </span>
          </div>
          <div className="text-[12px] font-semibold text-theme-secondary font-mono lowercase tracking-tight opacity-70 leading-relaxed">
            {sub}
          </div>
        </div>

      </div>
    </motion.div>
  );
}

export default function MetricsSummary() {
  const { metrics, connected } = useMetrics();

  const occupancyPct = metrics.totalCapacity > 0
    ? (metrics.totalOccupancy / metrics.totalCapacity) * 100
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* Status Banner */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{ marginBottom: '40px' }}
        className="flex items-center justify-between px-4 sm:px-8 md:px-10 py-4 sm:py-5 rounded-none md:rounded-xl bg-[#0A0B10] border-y md:border border-white/5 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-accent-blue/[0.03] to-transparent pointer-events-none" />

        <div className="flex items-center gap-4 sm:gap-8 relative z-10 flex-wrap">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative flex flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-20" />
              <div className="p-2.5 sm:p-3 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Activity size={16} />
              </div>
            </div>
            <div>
              <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-0.5">
                Venue Global Status
              </div>
              <div className="text-xs sm:text-sm font-black text-emerald-400 uppercase tracking-widest">
                Normal Operations
              </div>
            </div>
          </div>

          <div className="h-10 w-px bg-white/5 hidden md:block" />

          <div className="hidden md:flex flex-col">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-0.5">
              Critical Zones
            </span>
            <span className={`text-sm font-black ${metrics.criticalZones > 0 ? 'text-rose-400' : 'text-white/40'}`}>
              {metrics.criticalZones} Identified
            </span>
          </div>

          <div className="h-10 w-px bg-white/5 hidden md:block" />

          <div className="hidden md:flex flex-col">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-0.5">
              Active Gates
            </span>
            <span className="text-sm font-black text-accent-blue">
              {metrics.openGates} of {metrics.totalGates} Open
            </span>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-lg bg-white/5 border border-white/5 backdrop-blur-md">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 whitespace-nowrap">
            {connected ? 'Sync Live' : 'Offline'}
          </span>
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <div
        style={{ marginTop: '8px' }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8 lg:gap-12"
      >
        <KpiCard
          title="Stadium Fullness"
          value={occupancyPct}
          color={occupancyPct > 85 ? 'text-rose-400' : occupancyPct > 70 ? 'text-yellow-400' : 'text-yellow-300'}
          sub={`${metrics.totalOccupancy?.toLocaleString()} / ${metrics.totalCapacity?.toLocaleString()} max`}
          icon={Users}
          trend={occupancyPct > 80 ? 'up' : 'down'}
          delay={0}
          warn={occupancyPct > 85}
          tint="blue"
        />
        <KpiCard
          title="Avg. Walking Speed"
          value={formatWait(metrics.avgWaitSec)}
          color={metrics.avgWaitSec > 120 ? 'text-rose-400' : 'text-accent-blue'}
          sub={metrics.avgWaitSec < 60 ? "All areas are clear" : "Traffic is moving steadily"}
          icon={Clock}
          delay={0.1}
          warn={metrics.avgWaitSec > 120}
          tint="yellow"
        />
        <KpiCard
          title="Live Updates"
          value={metrics.heavyGates + metrics.criticalZones}
          color={(metrics.heavyGates + metrics.criticalZones) > 0 ? 'text-yellow-400' : 'text-yellow-300'}
          sub="Live entry tips"
          icon={AlertTriangle}
          delay={0.2}
          warn={(metrics.heavyGates + metrics.criticalZones) > 2}
          tint="rose"
        />
        <KpiCard
          title="People at Gates"
          value={metrics.totalQueuing}
          color="text-emerald-500"
          sub="Current gate wait"
          icon={UserCheck}
          trend="up"
          delay={0.3}
          tint="green"
        />
      </div>

    </div>
  );
}