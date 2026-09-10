// frontend/src/pages/MapPage.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Maximize2, Navigation2, Layers, Zap,
  ChevronRight, Activity, Map as MapIcon,
  CircleDot, Clock, Users
} from 'lucide-react';

import StaticMap from '../components/StaticMap';
import VenueSearchModal from '../components/VenueSearchModal';
import { useWaitTimes } from '../hooks/useWaitTimes';
import { useOnboarding } from '../context/OnboardingContext';

export default function MapPage() {
  const { selectedVenue, resetOnboarding } = useOnboarding();
  const [mounted, setMounted] = useState(false);
  const [activeLayer, setActiveLayer] = useState('heatmap');
  const [selectedZone, setSelectedZone] = useState(null);
  const [showAIInsights, setShowAIInsights] = useState(true);

  // track whether AI computation should run
  const [aiEnabled, setAiEnabled] = useState(true);
  // force-recalculation counter for AI insights
  const [aiRecalcTick, setAiRecalcTick] = useState(0);

  // Real-time data hook
  const { zones } = useWaitTimes() || { zones: [] };

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Smart Mapping Intelligence ──
  useEffect(() => {
    if (mounted && zones.length > 0) {
      const focusZoneId = localStorage.getItem('venueflow_focus_zone');
      if (focusZoneId) {
        const found = zones.find(z => z.zone_id === focusZoneId || z.id === focusZoneId);
        if (found) {
          // Delay selection slightly to allow map tiles to settle
          setTimeout(() => {
            setSelectedZone(found);
            localStorage.removeItem('venueflow_focus_zone');
          }, 600);
        }
      }
    }
  }, [mounted, zones]);

  /**
   * AI Recommendation Engine
   */
  const aiRecommendation = useMemo(() => {
    if (!aiEnabled) return null;

    const gates = zones?.filter(
      z => z.type === 'gate' && typeof z.waitTime === 'number' && isFinite(z.waitTime)
    ) || [];
    if (gates.length < 2) return null;

    const bestGate = gates.reduce((prev, curr) => (prev.waitTime < curr.waitTime ? prev : curr));
    const worstGate = gates.reduce((prev, curr) => (prev.waitTime > curr.waitTime ? prev : curr));
    const savings = worstGate.waitTime - bestGate.waitTime;

    return {
      gateName: bestGate.name,
      savings: Math.round(savings),
      isActionable: savings > 5
    };
  }, [zones, aiEnabled, aiRecalcTick]);

  const handleZoneClick = useCallback((zone) => {
    setSelectedZone(zone);
  }, []);

  const handleHeatmapToggle = useCallback(() => {
    const next = activeLayer === 'heatmap' ? 'none' : 'heatmap';
    setActiveLayer(next);
    window.dispatchEvent(new CustomEvent('venueflow:maplayer', {
      detail: { layer: 'heatmap', visible: next === 'heatmap' }
    }));
  }, [activeLayer]);

  const handleAIToggle = useCallback(() => {
    const next = !showAIInsights;
    setShowAIInsights(next);
    setAiEnabled(next);
    if (next) setAiRecalcTick(t => t + 1);
  }, [showAIInsights]);

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden md:rounded-3xl md:border md:border-theme-main md:shadow-premium bg-slate-50 md:min-h-[500px]">

      {/* ── BACKGROUND: MAP CANVAS ── */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${!mounted || !selectedVenue ? 'opacity-0' : 'opacity-100'}`}>
        <div className="absolute inset-0">
          {selectedVenue ? (
            <StaticMap
              key={selectedVenue?.id}
              venue={selectedVenue}
              lat={selectedVenue?.lat}
              lon={selectedVenue?.lon}
              zones={zones}
              onZoneClick={handleZoneClick}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center h-full bg-slate-50 dark:bg-slate-950">
               <div className="w-16 h-16 rounded-3xl bg-accent-blue/10 flex items-center justify-center text-accent-blue mb-6">
                <MapIcon size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Initialize Venue Map</h3>
              <p className="text-sm text-slate-500 max-w-xs">Please complete the onboarding to view the intelligent venue layout.</p>
            </div>
          )}
        </div>
        <AnimatePresence>
          {activeLayer === 'heatmap' && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none bg-gradient-to-br from-red-500/25 via-emerald-500/10 to-blue-500/20 mix-blend-multiply"
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── TOP HUD ── */}
      <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-3 pointer-events-auto">

          <AnimatePresence>
            {showAIInsights && aiRecommendation?.isActionable && (
              <motion.div
                initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
                className="backdrop-blur-md bg-white/80 border border-white p-4 rounded-2xl shadow-xl max-w-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-accent-blue/10 rounded-lg text-accent-blue">
                    <Zap size={16} fill="currentColor" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Live AI Analysis</span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 leading-tight">
                  Redirecting to <span className="text-emerald-600">{aiRecommendation.gateName}</span> could save approx. <span className="text-blue-600">{aiRecommendation.savings}m</span>.
                </h3>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── BOTTOM HUD & CONTROLS ── */}
      <div className="absolute bottom-3 left-4 right-4 z-20 flex justify-between items-end pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="flex items-center gap-3 px-4 py-2.5 mb-2 backdrop-blur-md bg-slate-900/90 text-white rounded-full shadow-2xl border border-white/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Telemetry: Active</span>
          </div>
        </div>

        <AnimatePresence>
          {selectedZone && (
            <motion.div
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              className="pointer-events-auto w-80 backdrop-blur-xl bg-white/90 border border-white p-5 rounded-[2.5rem] shadow-2xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight">{selectedZone.name}</h4>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{selectedZone.type} Info</p>
                </div>
                <button onClick={() => setSelectedZone(null)} className="p-2 hover:bg-slate-100 rounded-full">
                  <Maximize2 size={16} className="text-slate-400" />
                </button>
              </div>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('venueflow:action', { detail: { tab: 'gates', zoneId: selectedZone.id } }))}
                className="w-full py-4 bg-slate-900 text-white rounded-[1.5rem] font-bold text-sm hover:bg-accent-blue transition-all"
              >
                Navigate to Zone
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}