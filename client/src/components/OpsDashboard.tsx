import React, { useState } from 'react';
import type { CrowdZone, Incident } from '../types';
import { AlertOctagon, Activity, PlusCircle, Wrench, Shield, Users, Leaf, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OpsDashboardProps {
  zones: CrowdZone[];
  incidents: Incident[];
  onIncidentReported: () => void;
  onRefreshData: () => void;
  onAdjustDensity: (zoneId: string, percentChange: number) => void;
  isLoading: boolean;
  onShowToast?: (msg: string, type: 'info' | 'success' | 'warn') => void;
}

export const OpsDashboard: React.FC<OpsDashboardProps> = ({
  zones,
  incidents,
  onIncidentReported,
  onRefreshData,
  onAdjustDensity,
  isLoading,
  onShowToast
}) => {
  // Incident Form state
  const [description, setDescription] = useState('');
  const [reportedBy, setReportedBy] = useState<'volunteer' | 'staff'>('volunteer');
  const [zoneId, setZoneId] = useState('Zone-A');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  // Form submission handler
  const handleIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    setFormSuccess(false);

    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description,
          reportedBy,
          zoneId
        })
      });

      if (response.ok) {
        setFormSuccess(true);
        setDescription('');
        onIncidentReported(); // Refresh feed
        setTimeout(() => setFormSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error submitting incident:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Macro Sustainability Metrics Card (included here as an ops metric card)
  const sustainabilityMetrics = {
    carbonSavedKg: 14250 + (zones.reduce((acc, z) => acc + z.currentCount, 0) * 0.12), // Dynamic simulation based on crowd size
    transitUsePercent: 78,
    savedTrips: 4720
  };

  // Total stadium attendance calculation
  const totalAttendance = zones.reduce((sum, z) => sum + z.currentCount, 0);
  const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);
  const overallOccupancyPercent = Math.round((totalAttendance / totalCapacity) * 100);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'border-rose-500 bg-rose-950/20 text-rose-400';
      case 'MEDIUM': return 'border-yellow-500 bg-yellow-950/20 text-yellow-400';
      default: return 'border-emerald-800 bg-emerald-900/60 text-emerald-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return <Shield className="w-4 h-4" />;
      case 'transit': return <Activity className="w-4 h-4" />;
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      default: return <AlertOctagon className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Banner metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Attendance */}
        <div className="bg-emerald-900 border border-emerald-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Overall Occupancy</span>
            <h4 className="text-2xl font-black mt-1 text-emerald-50">{totalAttendance.toLocaleString()}</h4>
            <p className="text-xs text-emerald-300 mt-1">{overallOccupancyPercent}% of total capacity</p>
          </div>
          <div className="bg-lime-500/10 text-lime-400 p-3 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* High Density Alarms */}
        <div className="bg-emerald-900 border border-emerald-800 rounded-2xl p-4 flex items-center justify-between">
          {(() => {
            const highZones = zones.filter(z => z.density > 80);
            return (
              <>
                <div>
                  <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">High Density Alarms</span>
                  <h4 className={`text-2xl font-black mt-1 ${highZones.length > 0 ? 'text-rose-500 animate-pulse' : 'text-emerald-200'}`}>
                    {highZones.length}
                  </h4>
                  <p className="text-xs text-emerald-300 mt-1">
                    {highZones.length > 0 ? `Crowded: ${highZones.map(hz => hz.name).join(', ')}` : 'All stands safe'}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${highZones.length > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-950 text-emerald-600'}`}>
                  <AlertOctagon className="w-6 h-6" />
                </div>
              </>
            );
          })()}
        </div>

        {/* Sustainability monitor card (integrated here) */}
        <div className="bg-emerald-900 border border-emerald-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Carbon Footprint Saved</span>
            <h4 className="text-2xl font-black mt-1 text-emerald-400 flex items-center gap-1.5">
              {Math.round(sustainabilityMetrics.carbonSavedKg).toLocaleString()}
              <span className="text-xs font-medium text-emerald-500">kg CO2</span>
            </h4>
            <p className="text-xs text-emerald-300 mt-1">
              🌱 {sustainabilityMetrics.transitUsePercent}% public transit share
            </p>
          </div>
          <div className="bg-cyan-500/10 text-emerald-400 p-3 rounded-xl">
            <Leaf className="w-6 h-6" />
          </div>
        </div>

        {/* Active Incident Tickets */}
        <div className="bg-emerald-900 border border-emerald-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Active Incidents</span>
            <h4 className="text-2xl font-black mt-1 text-yellow-400">
              {incidents.filter(i => i.status === 'active').length}
            </h4>
            <p className="text-xs text-emerald-300 mt-1">
              AI triaged in last 2 hours
            </p>
          </div>
          <div className="bg-yellow-500/10 text-yellow-400 p-3 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-Time Incident Reporting Form */}
        <div className="bg-emerald-900 border border-emerald-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-emerald-100 flex items-center gap-2 mb-2">
              <PlusCircle className="text-lime-400 w-5 h-5" />
              Report Incident
            </h3>
            <p className="text-xs text-emerald-300 mb-4">
              Submit issues for AI routing and prioritization. Updates crowd density models immediately.
            </p>

            <form onSubmit={handleIncidentSubmit} className="space-y-4">
              {/* Reporter Type */}
              <div>
                <label className="block text-xs font-bold text-emerald-300 mb-1.5 uppercase">Reported By</label>
                <div className="grid grid-cols-2 gap-2 bg-emerald-950 p-1 rounded-xl border border-emerald-800">
                  <button
                    type="button"
                    onClick={() => setReportedBy('volunteer')}
                    className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                      reportedBy === 'volunteer' ? 'bg-lime-500 text-emerald-950 font-bold' : 'text-emerald-300'
                    }`}
                  >
                    Volunteer
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportedBy('staff')}
                    className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                      reportedBy === 'staff' ? 'bg-lime-500 text-emerald-950 font-bold' : 'text-emerald-300'
                    }`}
                  >
                    Venue Staff
                  </button>
                </div>
              </div>

              {/* Zone */}
              <div>
                <label htmlFor="incident-zone" className="block text-xs font-bold text-emerald-300 mb-1.5 uppercase">Location Zone</label>
                <select
                  id="incident-zone"
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                  className="w-full bg-emerald-950 border border-emerald-800 rounded-xl px-3 py-2 text-xs text-emerald-100 focus:outline-none focus:border-lime-500"
                >
                  {zones.map(z => (
                    <option key={z.zoneId} value={z.zoneId}>{z.name} ({z.zoneId})</option>
                  ))}
                </select>
              </div>

              {/* Issue Description */}
              <div>
                <label htmlFor="incident-desc" className="block text-xs font-bold text-emerald-300 mb-1.5 uppercase">Issue Description</label>
                <textarea
                  id="incident-desc"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Broken turnstile at Gate 4 causing queue delay, or water leak in corridor near Section 100..."
                  maxLength={1000}
                  className="w-full bg-emerald-950 border border-emerald-800 rounded-xl px-3 py-2 text-xs text-emerald-100 focus:outline-none focus:border-lime-500 placeholder-emerald-600 resize-none"
                />
              </div>

              {/* Status alerts */}
              {formSuccess && (
                <div className="bg-cyan-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-2.5 rounded-xl flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                  <span>Incident triaged and logged successfully!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className="w-full bg-lime-500 text-emerald-950 font-bold py-2.5 rounded-xl hover:bg-lime-400 transition-colors disabled:opacity-50 text-xs"
              >
                {isSubmitting ? 'Triage processing...' : 'Submit & Analyze'}
              </button>
            </form>
          </div>
        </div>

        {/* Operational Intelligence Feed */}
        <div className="bg-emerald-900 border border-emerald-800 rounded-2xl p-6 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-emerald-100 flex items-center gap-2">
                <Activity className="text-lime-400 w-5 h-5 animate-pulse" />
                Ops Intelligence Feed
              </h3>
              <p className="text-xs text-emerald-300">Stream of AI-categorized incident logs and priority queues.</p>
            </div>
            <button
              onClick={onRefreshData}
              disabled={isLoading}
              className="p-2 text-emerald-300 hover:text-emerald-50 hover:bg-emerald-800 rounded-xl border border-emerald-800/80 transition-all"
              aria-label="Refresh incident feed"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-[420px] pr-2">
            <AnimatePresence initial={false}>
              {incidents.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-emerald-800 rounded-xl bg-emerald-950/20 text-emerald-400 text-xs">
                  No incidents currently active. Stadium operations running smoothly.
                </div>
              ) : (
                incidents.map((inc) => (
                  <motion.div
                    key={inc.incidentId}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`p-3.5 border rounded-xl flex flex-col md:flex-row gap-3 md:items-center justify-between transition-all ${getPriorityColor(inc.priority)}`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-current">
                          {inc.priority} PRIORITY
                        </span>
                        <span className="text-[10px] bg-emerald-950/50 text-emerald-200 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          {getCategoryIcon(inc.category)}
                          <span className="capitalize">{inc.category}</span>
                        </span>
                        <span className="text-[10px] bg-emerald-950/50 text-emerald-200 font-extrabold px-2 py-0.5 rounded">
                          {inc.zoneId}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-emerald-50">{inc.summary}</h4>
                      <p className="text-xs text-emerald-300 italic">"{inc.description}"</p>
                    </div>

                    <div className="text-right flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-2 md:pt-0 border-emerald-800">
                      <span className="text-[10px] text-emerald-300 uppercase font-semibold">
                        By {inc.reportedBy === 'staff' ? 'Staff' : 'Volunteer'}
                      </span>
                      <span className="text-[9px] text-emerald-400 mt-0.5 mb-1.5">
                        {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button 
                        onClick={() => onShowToast && onShowToast(`Incident ${inc.incidentId.slice(-4)} acknowledged!`, 'success')}
                        className="text-[10px] bg-emerald-950 hover:bg-lime-500/20 text-emerald-200 hover:text-lime-400 border border-emerald-700 hover:border-lime-500/50 transition-colors px-2.5 py-1 rounded-lg font-bold"
                      >
                        Acknowledge
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Manual Jitter Debug Tooling for Routing Validation */}
      <div className="bg-emerald-900 border border-emerald-800 rounded-2xl p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-lime-400 mb-3 flex items-center gap-1.5">
          <Wrench size={14} />
          Simulation Jitter Controls (Verify AI Crowd Rerouting)
        </h4>
        <p className="text-xs text-emerald-300 mb-4">
          Manually shift crowd levels to trigger high-density routing warnings. Switch back to **Fan View** after adjusting to see the AI Concierge reroute users instantly!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {zones.map(z => (
            <div key={z.zoneId} className="bg-emerald-950 border border-emerald-800 p-3 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-100">{z.name}</span>
                <div className="text-[10px] text-emerald-400 mt-0.5">Current: {z.density}%</div>
              </div>
              
              <div className="flex gap-1.5">
                <button
                  onClick={() => onAdjustDensity(z.zoneId, -15)}
                  title="Decrease density by 15%"
                  className="p-1.5 bg-emerald-900 border border-emerald-800 text-rose-400 hover:bg-emerald-800 hover:text-rose-300 rounded-lg transition-all"
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  onClick={() => onAdjustDensity(z.zoneId, 15)}
                  title="Increase density by 15%"
                  className="p-1.5 bg-emerald-900 border border-emerald-800 text-emerald-400 hover:bg-emerald-800 hover:text-emerald-300 rounded-lg transition-all"
                >
                  <ChevronUp size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
