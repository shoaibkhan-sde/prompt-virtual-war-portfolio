import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AlertStrip } from '../components/AlertStrip';
import { SideDrawer } from '../components/SideDrawer';
import { AlertTriangle, Clock, CheckCircle2, Users } from 'lucide-react';
import type { Incident, CrowdZone } from '../types';

export const OpsWorkspacePage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [zones, setZones] = useState<CrowdZone[]>([]);
  const [densityHistory, setDensityHistory] = useState<Record<string, string | number>[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

        let incData: Incident[] = [];
        let zoneData: CrowdZone[] = [];

        try {
          const [incRes, zoneRes] = await Promise.all([
            fetch('/api/incidents', { signal: controller.signal }),
            fetch('/api/crowd', { signal: controller.signal })
          ]);
          clearTimeout(timeoutId);

          if (incRes.ok) incData = await incRes.json();
          if (zoneRes.ok) zoneData = await zoneRes.json();
        } catch (fetchErr) {
          console.warn('API fetch failed or timed out, using fallback data.', fetchErr);
        }

        // Mock Fallback Data
        if (!zoneData || zoneData.length === 0) {
          zoneData = [
            { zoneId: 'z1', name: 'North Stand', density: 86, capacity: 1000, currentCount: 860, status: 'HIGH', updatedAt: new Date().toISOString() },
            { zoneId: 'z2', name: 'East Stand', density: 70, capacity: 1000, currentCount: 700, status: 'MEDIUM', updatedAt: new Date().toISOString() },
            { zoneId: 'z3', name: 'South Stand', density: 55, capacity: 1000, currentCount: 550, status: 'MEDIUM', updatedAt: new Date().toISOString() },
            { zoneId: 'z4', name: 'West Stand', density: 49, capacity: 1000, currentCount: 490, status: 'LOW', updatedAt: new Date().toISOString() }
          ];
        }

        // Dynamically generate incidents based on zone densities
        incData = zoneData.map((z): Incident => {
          let priority: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
          let summary = 'Normal Operations';
          let description = `Crowd density is at ${z.density}%. Operations running smoothly.`;
          
          if (z.density >= 80) {
            priority = 'HIGH';
            summary = 'Critical Crowd Density';
            description = `Density has reached ${z.density}%. Immediate dispatch of crowd control staff recommended.`;
          } else if (z.density >= 60) {
            priority = 'MEDIUM';
            summary = 'Elevated Crowd Density';
            description = `Density has reached ${z.density}%. Monitor queues and turnstiles closely.`;
          }

          return {
            incidentId: `dyn-${z.zoneId}`,
            zoneId: z.name,
            category: 'crowd',
            priority,
            status: 'active',
            summary,
            description,
            reportedBy: 'system',
            createdAt: new Date().toISOString()
          };
        }).sort((a, b) => {
          const pMap: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          return pMap[b.priority] - pMap[a.priority];
        });

        setIncidents(incData);
        setZones(zoneData);
        
        // Mock a 30-min history trend based on current density
        const now = new Date();
        const history = [];
        for (let i = 30; i >= 0; i -= 5) {
          const t = new Date(now.getTime() - i * 60000);
          const dataPoint: Record<string, string | number> = { time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
          zoneData.forEach((z: CrowdZone) => {
            const jitter = Math.floor(Math.random() * 10 - 5);
            dataPoint[z.name] = Math.max(0, Math.min(100, z.density + jitter));
          });
          history.push(dataPoint);
        }
        setDensityHistory(history);

      } catch (err) {
        console.error('Error processing dashboard data:', err);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-[calc(100dvh-100px)] md:h-[calc(100dvh-100px)]">
      <AlertStrip incidents={incidents} onIncidentClick={setSelectedIncident} />
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Triage Queue */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="glass-panel p-4 rounded-xl flex-1 flex flex-col">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide mb-4 border-b border-slate-800 pb-2">
              Incident Triage Queue
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {incidents.length === 0 ? (
                <div className="text-sm text-slate-500 text-center mt-10">No active incidents.</div>
              ) : (
                incidents.map(inc => (
                  <button 
                    key={inc.incidentId}
                    onClick={() => setSelectedIncident(inc)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      inc.priority === 'HIGH' ? 'bg-brand-red/10 border-brand-red/30 hover:border-brand-red/60' :
                      inc.priority === 'MEDIUM' ? 'bg-brand-amber/10 border-brand-amber/30 hover:border-brand-amber/60' :
                      'bg-brand-teal/10 border-brand-teal/30 hover:border-brand-teal/60'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-slate-300">{inc.zoneId}</span>
                      <span className="text-[10px] text-slate-500">{new Date(inc.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-100">{inc.summary}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        inc.priority === 'HIGH' ? 'bg-brand-red text-white' : 
                        inc.priority === 'MEDIUM' ? 'bg-brand-amber text-slate-900' : 
                        'bg-brand-teal text-slate-900'
                      }`}>
                        {inc.priority}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize">{inc.status}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Analytics & Charts */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Density Trend Chart */}
          <div className="glass-panel p-4 rounded-xl h-72 flex flex-col">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide mb-4">Crowd Density Trend (Last 30 Min)</h2>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={densityHistory} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorNorth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSouth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#475569" fontSize={10} tickMargin={10} />
                  <YAxis stroke="#475569" fontSize={10} tickFormatter={(val) => `${val}%`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#10151C', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="North Stand" stroke="#14b8a6" fillOpacity={1} fill="url(#colorNorth)" strokeWidth={2} />
                  <Area type="monotone" dataKey="South Stand" stroke="#f59e0b" fillOpacity={1} fill="url(#colorSouth)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Staff Assignment Panel */}
          <div className="glass-panel p-4 rounded-xl flex-1 flex flex-col">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Users size={16} className="text-brand-teal" /> Resource Assignment
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {zones.map(z => (
                <div key={z.zoneId} className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">{z.name}</p>
                    <p className="text-lg font-bold text-slate-100 mt-1">
                      {Math.max(5, Math.floor(z.density / 10))} <span className="text-xs font-normal text-slate-500">Staff</span>
                    </p>
                  </div>
                  <div className={`h-2 w-2 rounded-full ${z.status === 'HIGH' ? 'bg-brand-red' : z.status === 'MEDIUM' ? 'bg-brand-amber' : 'bg-brand-teal'}`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <SideDrawer 
        isOpen={!!selectedIncident} 
        onClose={() => setSelectedIncident(null)}
        title="Incident Details"
        subtitle={selectedIncident?.zoneId}
      >
        {selectedIncident && (
          <div className="space-y-6">
            <div className={`p-4 rounded-xl border ${
              selectedIncident.priority === 'HIGH' ? 'bg-brand-red/10 border-brand-red/30' :
              selectedIncident.priority === 'MEDIUM' ? 'bg-brand-amber/10 border-brand-amber/30' :
              'bg-brand-teal/10 border-brand-teal/30'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {selectedIncident.priority === 'HIGH' ? <AlertTriangle className="text-brand-red" size={20} /> :
                 selectedIncident.priority === 'MEDIUM' ? <Clock className="text-brand-amber" size={20} /> :
                 <CheckCircle2 className="text-brand-teal" size={20} />}
                <span className="font-bold uppercase tracking-wider">{selectedIncident.status}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">{selectedIncident.summary}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{selectedIncident.description}</p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category</h4>
                <p className="text-sm font-medium text-slate-200 capitalize">{selectedIncident.category}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Reported By</h4>
                <p className="text-sm font-medium text-slate-200 capitalize">{selectedIncident.reportedBy}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Time Logged</h4>
                <p className="text-sm font-medium text-slate-200">{new Date(selectedIncident.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="pt-6 flex gap-3">
              <button className="flex-1 bg-brand-teal text-slate-900 font-bold py-2.5 rounded-lg hover:bg-teal-400 transition-colors">
                Acknowledge
              </button>
              <button className="flex-1 bg-slate-800 text-slate-100 font-bold py-2.5 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors">
                Resolve
              </button>
            </div>
          </div>
        )}
      </SideDrawer>
    </div>
  );
};
