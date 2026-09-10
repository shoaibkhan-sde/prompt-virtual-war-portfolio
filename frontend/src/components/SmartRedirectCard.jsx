import React from 'react';
import { motion } from 'framer-motion';
import { Map } from 'lucide-react';

export default function SmartRedirectCard() {
  const handleRedirect = () => {
    window.dispatchEvent(new CustomEvent('venueflow:action', { 
      detail: { tab: 'gates' } 
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      whileTap={{ scale: 0.98 }}
      onClick={handleRedirect}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 cursor-pointer transition-all duration-300 shadow-xl"
    >
      {/* Top Header Layer */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
          <Map size={20} />
        </div>
        
        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 opacity-90">
          +400% capacity
        </div>
      </div>

      {/* Info Layer */}
      <div className="space-y-1">
        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30">
          Optimal Entry Node
        </div>
        <div className="text-3xl font-black tracking-tight text-white">
          Gate S2 (South)
        </div>
        <div className="flex items-center gap-2 text-[12px] font-bold text-white/40 mt-2">
          <span>Load factor: 12%</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span>High clear-rate</span>
        </div>
      </div>

      {/* Subtle background glow */}
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
    </motion.div>
  );
}
