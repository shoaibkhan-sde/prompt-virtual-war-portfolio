import React from 'react';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Incident } from '../types';

interface AlertStripProps {
  incidents: Incident[];
  onIncidentClick?: (incident: Incident) => void;
}

export const AlertStrip: React.FC<AlertStripProps> = ({ incidents, onIncidentClick }) => {
  const activeIncidents = incidents.filter(i => i.status === 'active');
  
  return (
    <div role="region" aria-label="Live Operations Alerts" className="w-full h-10 border-y border-slate-800 bg-brand-charcoal/90 backdrop-blur flex items-center overflow-hidden">
      <div className="flex-none px-4 py-2 bg-brand-navy border-r border-slate-800 h-full flex items-center gap-2 z-10">
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeIncidents.length > 0 ? 'bg-brand-red' : 'bg-brand-teal'}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${activeIncidents.length > 0 ? 'bg-brand-red' : 'bg-brand-teal'}`}></span>
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Ops</span>
      </div>
      
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        <AnimatePresence mode="wait">
          {activeIncidents.length > 0 ? (
            <motion.div 
              key="active-alerts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-4 px-4 items-center animate-[marquee_20s_linear_infinite] whitespace-nowrap"
            >
              {activeIncidents.map(inc => (
                <button
                  key={inc.incidentId}
                  onClick={() => onIncidentClick?.(inc)}
                  className="flex items-center gap-2 hover:bg-slate-800/50 px-3 py-1 rounded-full transition-colors cursor-pointer"
                >
                  {inc.priority === 'HIGH' ? (
                    <AlertCircle size={14} className="text-brand-red" />
                  ) : (
                    <Clock size={14} className="text-brand-amber" />
                  )}
                  <span className="text-xs text-slate-200">
                    <strong className="mr-1">{inc.zoneId}:</strong> {inc.summary}
                  </span>
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="no-alerts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-4 text-slate-400"
            >
              <CheckCircle2 size={14} className="text-brand-teal" />
              <span className="text-xs">All zones operating normally. No active incidents.</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
