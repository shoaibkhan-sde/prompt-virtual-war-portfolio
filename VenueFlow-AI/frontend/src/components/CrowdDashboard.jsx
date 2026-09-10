import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWaitTimes } from '../hooks/useWaitTimes';
import { useAIInsights } from '../hooks/useAIInsights';
import ZoneCard, { RENAME_MAP } from './ZoneCard';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Filter,
  SortAsc,
  AlertTriangle,
  Zap,
  Activity
} from 'lucide-react';

export default function CrowdDashboard() {
  const { zones, totalOccupancy, totalCapacity, loading, error } = useWaitTimes();
  const { insights } = useAIInsights();

  const [filter, setFilter] = useState('all'); // all | critical | high
  const [sortOrder, setSortOrder] = useState('density'); // density | name

  const prevOccupancyRef = useRef(0);
  const [rate, setRate] = useState(0);

  // Calculate rate of change (Current - Previous)
  useEffect(() => {
    if (totalOccupancy !== prevOccupancyRef.current) {
      const delta = totalOccupancy - prevOccupancyRef.current;
      setRate(delta);
      prevOccupancyRef.current = totalOccupancy;
    }
  }, [totalOccupancy]);

  const globalDensity = totalCapacity > 0 ? totalOccupancy / totalCapacity : 0;

  // Sorting and Filtering logic
  const filteredZones = useMemo(() => {
    let result = [...zones];

    if (filter === 'critical') {
      result = result.filter(z => z.status === 'critical');
    } else if (filter === 'high') {
      result = result.filter(z => z.status === 'high');
    }

    if (sortOrder === 'density') {
      result.sort((a, b) => a.density - b.density);
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [zones, filter, sortOrder]);

  const globalInsight = useMemo(() => {
    if (globalDensity > 0.85) {
      return {
        text: `CRITICAL LOAD: Venue is ${Math.round(globalDensity * 100)}% full. ${rate > 0 ? 'Surging' : 'Stable'}.`,
        style: 'text-rose-400',
        trend: rate > 0 ? 'up' : 'stable'
      };
    }
    if (globalDensity > 0.6) {
      return {
        text: `High Attendance: ${Math.round(globalDensity * 100)}% capacity utilized. ${rate > 0 ? 'Crowds increasing' : 'Flow stabilizing'}.`,
        style: 'text-orange-400',
        trend: rate > 0 ? 'up' : 'down'
      };
    }
    return {
      text: `Normal Load: ${Math.round(globalDensity * 100)}% capacity. Operations stable.`,
      style: 'text-emerald-400',
      trend: rate > 0 ? 'up' : 'down'
    };
  }, [globalDensity, rate]);

  const handleRedirect = (zoneData) => {
    const zoneName = RENAME_MAP[zoneData.name] || zoneData.name;
    const zoneType = zoneData.zoneId.includes('food') ? 'Food' :
      zoneData.zoneId.includes('parking') ? 'Parking' : 'Stand';

    // Dispatch a custom event to switch to the assistant tab and send a message
    const event = new CustomEvent('venueflow:action', {
      detail: {
        tab: 'assistant',
        // We use a hidden token '[CONTEXT_REDIRECT]' to trigger high-resolution AI reasoning
        message: `[CONTEXT_REDIRECT] ${zoneName} Insights`,
        zoneId: zoneData.zoneId
      }
    });
    window.dispatchEvent(event);
  };

  if (loading && !zones.length) return <div className="py-20 text-center opacity-40">Loading Crowd Intelligence...</div>;
  if (error) return <div className="p-10 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl">Error: {error}</div>;

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* 🏟️ Global Occupancy Hero */}
      <section className="relative overflow-hidden bg-[#0A0B10] md:border md:border-white/5 md:shadow-2xl p-6 sm:p-10 lg:p-14 rounded-none">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[50%] h-[100%] bg-gradient-to-l from-accent-blue/5 to-transparent opacity-50" />
          <div className={`absolute -top-24 -right-24 w-80 h-80 blur-[120px] opacity-20 animate-pulse ${globalDensity > 0.8 ? 'bg-rose-500' : 'bg-accent-blue'}`} />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
          <div className="space-y-6 max-w-xl">
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 ${globalInsight.style}`}>
                <Activity size={14} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">{globalInsight.text}</span>
              </div>
            </div>

            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[1.1] pb-2">
              Live Venue <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue via-accent-cyan to-white">
                Capacity Monitor
              </span>
            </h2>
          </div>

          <div className="w-full lg:max-w-md space-y-6">
            <div className="flex justify-between items-end mb-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Current Occupancy</span>
                <span className="text-3xl font-black text-white">{totalOccupancy.toLocaleString()} <span className="text-sm font-medium text-white/40">Fans</span></span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1 text-right">Rate of Change</span>
                <div className={`flex items-center gap-2 text-sm font-black ${rate >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {rate >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {Math.abs(rate)}/tick
                </div>
              </div>
            </div>

            <div className="h-4 sm:h-5 w-full rounded-full bg-white/5 border border-white/10 overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${globalDensity * 100}%` }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                className={`h-full rounded-full flex items-center justify-end px-3 ${globalDensity > 0.85 ? 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]' : 'bg-accent-blue shadow-[0_0_20px_rgba(26,115,232,0.4)]'}`}
              >
                <span className="text-[10px] font-black text-white drop-shadow-md">
                  {Math.round(globalDensity * 100)}%
                </span>
              </motion.div>
            </div>

            <div className="flex justify-between text-[11px] font-bold text-white/20 uppercase tracking-widest">
              <span>0%</span>
              <span>Total Capacity: {totalCapacity.toLocaleString()}</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </section>

      {/* 🧠 AI Intelligence Insights */}
      <AnimatePresence>
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-xl bg-accent-blue/5 border border-accent-blue/10 flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="flex items-center gap-6">
              <div className="p-3 rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue">
                <Zap size={24} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-accent-blue opacity-60 mb-1">Operations Intelligence</h4>
                <p className="text-sm font-black text-theme-primary leading-tight">
                  {insights.length} operational recommendations detected based on live flow patterns.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleRedirect('The Entire Venue')}
                className="px-6 py-3 rounded-xl bg-accent-blue text-white text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95"
              >
                Execute Global Redirect
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🛠️ Controls & Filters */}
      <div
        style={{ marginTop: '18px', marginBottom: '24px' }}
        className="flex flex-col md:flex-row items-center justify-between gap-6 px-4 md:px-1"
      >
        {/* Filter Toggle Group */}
        <div className="flex items-center gap-3">
          {/* Filter Icon Badge */}
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-theme-main/20 border border-theme-main text-theme-primary">
            <Filter size={16} strokeWidth={2.5} />
          </div>

          {/* Segmented Toggle */}
          <div className="flex items-center gap-1 p-1 bg-theme-card border border-theme-main rounded-xl shadow-inner transition-colors">
            {[
              {
                key: 'all',
                label: 'All Zones',
                activeClass: 'bg-accent-blue text-white shadow-[0_0_16px_rgba(59,130,246,0.35)] border-accent-blue/30',
                inactiveClass: 'text-theme-secondary hover:text-theme-primary hover:bg-theme-main/10 border-transparent',
                dot: 'bg-accent-blue',
              },
              {
                key: 'high',
                label: 'High',
                activeClass: 'bg-orange-500/20 text-orange-400 shadow-[0_0_14px_rgba(249,115,22,0.25)] border-orange-500/30',
                inactiveClass: 'text-theme-secondary hover:text-orange-400 hover:bg-orange-500/5 border-transparent',
                dot: 'bg-orange-400',
              },
              {
                key: 'critical',
                label: 'Critical',
                activeClass: 'bg-rose-500/20 text-rose-400 shadow-[0_0_14px_rgba(244,63,94,0.25)] border-rose-500/30',
                inactiveClass: 'text-theme-secondary hover:text-rose-400 hover:bg-rose-500/5 border-transparent',
                dot: 'bg-rose-500',
              },
            ].map(({ key, label, activeClass, inactiveClass, dot }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={{ cursor: 'pointer' }}
                className={`
                  relative flex items-center gap-2 px-4 py-2 rounded-xl
                  text-[10px] font-black uppercase tracking-[0.18em]
                  border transition-all duration-200 select-none
                  ${filter === key ? activeClass : inactiveClass}
                `}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot} ${filter === key ? 'opacity-100' : 'opacity-40'}`} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Control */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-theme-main/20 border border-theme-main text-theme-primary">
            <SortAsc size={16} strokeWidth={2.5} />
          </div>
          <div className="relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{ cursor: 'pointer' }}
              className="
                appearance-none bg-theme-card border border-theme-main rounded-xl
                pl-4 pr-10 py-2.5
                text-[10px] font-black uppercase tracking-[0.18em] text-theme-primary
                focus:outline-none focus:border-accent-blue/40
                hover:border-theme-main/50
                transition-all duration-200
              "
            >
              <option value="density" className="bg-theme-card">Sort: Density ↓</option>
              <option value="name" className="bg-theme-card">Sort: Name A–Z</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-theme-secondary">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 💎 Intelligence Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8 px-4 sm:px-0 pb-12">
        <AnimatePresence mode="popLayout">
          {filteredZones.map((zone, idx) => (
            <ZoneCard
              key={zone.zoneId || zone.gateId || `zone-${idx}`}
              zone={zone}
              onRedirect={handleRedirect}
              onViewMap={(id) => {
                const event = new CustomEvent('venueflow:action', {
                  detail: { tab: 'map', zoneId: id }
                });
                window.dispatchEvent(event);
              }}
            />
          ))}
        </AnimatePresence>

        {filteredZones.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-40">
            <AlertTriangle size={48} className="mb-4" />
            <h3 className="text-xl font-black uppercase tracking-widest">No Priority Zones</h3>
            <p className="text-sm mt-2">All filtered zones are currently stable.</p>
          </div>
        )}
      </div>
    </div>
  );
}