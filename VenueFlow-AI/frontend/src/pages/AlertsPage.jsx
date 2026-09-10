import React, { useState, useMemo } from 'react';
import AlertFeed from '../components/AlertFeed';
import { useAlerts } from '../hooks/useAlerts';
import { Activity } from 'lucide-react';

export default function AlertsPage({ alerts: allAlertsRaw = [] }) {
  // Enforce strict limit of 10 in UI
  const allAlerts = useMemo(() => allAlertsRaw.slice(0, 10), [allAlertsRaw]);
  const [filter, setFilter] = useState('all');

  const filteredAlerts = useMemo(() => {
    if (filter === 'all') return allAlerts;
    return allAlerts.filter(a => a.level === filter);
  }, [allAlerts, filter]);

  const counts = useMemo(() => ({
    all: allAlerts.length,
    info: allAlerts.filter(a => a.level === 'info').length,
    warning: allAlerts.filter(a => a.level === 'warning').length,
    critical: allAlerts.filter(a => a.level === 'critical').length,
  }), [allAlerts]);

  return (
    <div className="flex flex-col gap-8">
      {/* 🛡️ Operational Alerts Hero Banner */}
      <section className="relative overflow-hidden bg-[#0A0B10] md:border md:border-white/5 md:shadow-2xl p-6 sm:p-10 lg:p-12 rounded-none">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[50%] h-[100%] bg-gradient-to-l from-red-600/5 to-transparent opacity-50" />
          <div className={`absolute -top-24 -right-24 w-80 h-80 blur-[120px] opacity-20 animate-pulse ${counts.critical > 0 ? 'bg-red-600' : 'bg-accent-blue'}`} />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
          <div className="space-y-6 max-w-xl">
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 ${counts.critical > 0 ? 'text-rose-400' : 'text-accent-blue'}`}>
                <Activity size={12} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                  {counts.critical > 0 ? 'Critical Activity Detected' : 'Security Feed Active'}
                </span>
              </div>
            </div>

            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[1.1] pb-2">
              Live Updates <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue via-accent-cyan to-white">
                Intelligence Stream
              </span>
            </h2>
          </div>

          <div className="w-full lg:max-w-md">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[
                { id: 'all', label: 'Total Alerts', count: counts.all, color: 'text-white' },
                { id: 'info', label: 'Informational', count: counts.info, color: 'text-emerald-500' },
                { id: 'warning', label: 'Warnings', count: counts.warning, color: 'text-amber-500' },
                { id: 'critical', label: 'Critical', count: counts.critical, color: 'text-rose-500' },
              ].map((item) => {
                const isActive = filter === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setFilter(item.id)}
                    className={`flex flex-col items-start transition-all duration-300 group ${isActive ? 'scale-105' : 'opacity-40 hover:opacity-100'}`}
                  >
                    <span className={`text-[10px] font-black uppercase tracking-widest mb-2 transition-colors ${isActive ? 'text-white' : 'text-white/30'}`}>
                      {item.label}
                    </span>
                    <span className={`text-4xl font-black transition-all ${isActive ? item.color : 'text-white/20'}`}>
                      {item.count}
                    </span>
                    {isActive && (
                      <div className={`h-1 w-full mt-2 rounded-full bg-gradient-to-r ${item.id === 'all' ? 'from-accent-blue to-accent-cyan' : item.id === 'info' ? 'from-emerald-500 to-emerald-400' : item.id === 'warning' ? 'from-amber-500 to-amber-400' : 'from-rose-500 to-rose-400'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="relative">
        {/* Glow effect for critical focus */}
        {filter === 'critical' && counts.critical > 0 && (
          <div className="absolute -inset-4 bg-red-500/5 blur-[40px] rounded-[3rem] z-[-1] animate-pulse" />
        )}
        <AlertFeed alerts={filteredAlerts} />
      </div>
    </div>
  );
}
