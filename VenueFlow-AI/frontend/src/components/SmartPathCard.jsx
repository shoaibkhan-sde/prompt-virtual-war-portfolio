import React from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Map as MapIcon,
  ArrowRight,
  Target,
  Clock,
  Radio,
  Zap,
} from 'lucide-react';

export default function SmartPathCard({ userLocation, destination, venue }) {
  return (
    <motion.div
      initial={{ opacity: 0, Math: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-xl bg-[#0A0B10] border border-white/10 shadow-2xl mb-8"
    >
      {/* Ambient backgrounds */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[50%] h-[100%] bg-gradient-to-l from-emerald-500/10 to-transparent opacity-50" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500 blur-[100px] opacity-20 animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-96 h-24 bg-accent-blue blur-[80px] opacity-10" />
      </div>

      <div className="relative z-10 p-6 sm:p-10">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 lg:gap-12">

          {/* Left Side: Contextual Greeting */}
          <div className="space-y-6 max-w-2xl w-full">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Radio size={14} className="animate-pulse flex-shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap">Live Geofence Active</span>
              </div>
              <div className="h-px w-12 bg-white/10 hidden sm:block" />
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{venue?.name || 'Local Venue'}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter leading-[1.05]">
              You are 200m from <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-accent-cyan">
                Gate 4 (Clear)
              </span>
            </h1>

            <p className="text-base sm:text-lg text-white/60 font-medium leading-relaxed max-w-lg">
              We parsed your digital ticket. Your seat is in the <strong className="text-white">North Stand</strong>.
              Follow the dynamic pathing below to bypass crowds.
            </p>
          </div>

          {/* Right Side: The Algorithm Box */}
          <div className="w-full lg:max-w-md">
            <motion.div
              whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.04)' }}
              className="p-5 sm:p-6 rounded-xl bg-white/[0.02] border border-white/10 backdrop-blur-md transition-all group"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-accent-blue/20 text-accent-cyan group-hover:scale-110 transition-transform">
                    <Target size={18} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Optimal Route Computed</span>
                </div>
                <div className="text-[9px] font-mono bg-white/5 px-2 py-1 rounded text-white/50 border border-white/10">
                  A* / Dijkstra Executed
                </div>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-end border-b border-white/5 pb-3">
                   <div>
                     <div className="text-[10px] uppercase font-bold text-white/30 tracking-wider mb-1">Gate</div>
                     <div className="text-xl font-black text-white">Entry Gate 4</div>
                   </div>
                   <div className="text-right">
                     <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider mb-1 flex items-center gap-1"><Clock size={10}/> Wait Time</div>
                     <div className="text-lg font-black text-emerald-400">1.2 mins</div>
                   </div>
                 </div>

                 <div className="flex justify-between items-end border-b border-white/5 pb-3">
                   <div>
                     <div className="text-[10px] uppercase font-bold text-white/30 tracking-wider mb-1">Concourse</div>
                     <div className="text-xl font-black text-white">North Concourse B</div>
                   </div>
                   <div className="text-right">
                     <div className="text-[10px] uppercase font-bold text-accent-cyan tracking-wider mb-1">Distance</div>
                     <div className="text-lg font-black text-accent-cyan">300m</div>
                   </div>
                 </div>

                 <div className="pt-2 text-xs font-mono text-white/40 flex items-center justify-between">
                    <div>
                      Cost = Dist + <span className="text-emerald-400">(Wait * &omega;)</span>
                    </div>
                    <div className="flex items-center gap-1 text-accent-cyan cursor-pointer hover:text-white transition-colors">
                      Begin Navigation <ArrowRight size={12}/>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
