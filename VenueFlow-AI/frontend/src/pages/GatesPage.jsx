import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import GateStatus from '../components/GateStatus';
import { useCrowdData } from '../hooks/useCrowdData';
import { Zap, Activity, TrendingUp, Clock } from 'lucide-react';

export default function GatesPage() {
  const { gates, recommendations } = useCrowdData();

  // ─── Data Aggregation ──────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    if (!gates?.length) return { avgWait: 0, totalQueue: 0, globalPressure: 0, totalCap: 0 };
    
    const totalCap = gates.reduce((acc, g) => acc + (g.maxCapacity || 300), 0);
    const totalQueue = gates.reduce((acc, g) => acc + (g.currentQueue || 0), 0);
    const totalWait = gates.reduce((acc, g) => acc + (g.estimatedWaitSec || 0), 0);
    
    return {
      avgWait: Math.round(totalWait / gates.length),
      totalQueue,
      globalPressure: totalQueue / totalCap,
      totalCap
    };
  }, [gates]);

  const fastestGate = useMemo(() => recommendations?.[0] || null, [recommendations]);

  const statusInfo = useMemo(() => {
    if (metrics.globalPressure > 0.8) return { text: 'CRITICAL LOAD', style: 'text-rose-400' };
    if (metrics.globalPressure > 0.5) return { text: 'STEADY FLOW', style: 'text-amber-400' };
    return { text: 'OPTIMAL FLOW', style: 'text-emerald-400' };
  }, [metrics.globalPressure]);

  return (
    <div className="flex flex-col gap-0 pb-32 w-full">
      {/* 🏟️ High-Fidelity Gates Hero Banner */}
      <section className="relative overflow-hidden bg-[#0A0B10] md:border md:border-white/5 md:shadow-2xl p-6 py-12 sm:p-10 sm:py-20 lg:p-14 lg:py-24 rounded-none">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[50%] h-[100%] bg-gradient-to-l from-accent-blue/5 to-transparent opacity-50" />
          <div className={`absolute -top-24 -right-24 w-80 h-80 blur-[120px] opacity-20 animate-pulse ${metrics.globalPressure > 0.7 ? 'bg-rose-500' : 'bg-accent-blue'}`} />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
          {/* Left Content: Huge Typography */}
          <div className="space-y-6 max-w-xl">
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/25 ${statusInfo.style}`}>
                <Activity size={14} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                  AI OPERATIONAL: {statusInfo.text}
                </span>
              </div>
            </div>

            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[1.1] pb-2">
              Best <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue via-accent-cyan to-white">
                Gate Entry
              </span>
            </h2>
          </div>

          {/* Right Content: AI Tactical Chip */}
          {fastestGate && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-6 bg-white/[0.03] border border-white/10 rounded-full pl-2 pr-8 py-2.5 backdrop-blur-xl shadow-2xl"
            >
              <div className="w-14 h-14 rounded-full bg-accent-blue flex items-center justify-center text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-bounce flex-shrink-0">
                <Zap size={28} fill="currentColor" />
              </div>
              <div>
                <div className="text-[10px] font-black tracking-[0.3em] text-accent-blue uppercase mb-1">Optimal Path</div>
                <div className="text-xl font-black text-white leading-tight">
                   {fastestGate.gate.name}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>
      
      {/* 🚢 Tactical Spacer (80px) */}
      <div style={{ height: '80px', width: '100%' }} aria-hidden="true" />

      {/* Grid of Details */}
      <GateStatus />
    </div>
  );
}
