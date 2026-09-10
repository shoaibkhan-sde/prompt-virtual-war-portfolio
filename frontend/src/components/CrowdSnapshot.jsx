import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, Clock, AlertCircle, Zap, MapPin } from 'lucide-react';
import { useWaitTimes } from '../hooks/useWaitTimes';
import { useCrowdData } from '../hooks/useCrowdData';
import { useOnboarding } from '../context/OnboardingContext';
import SnapshotCard from './SnapshotCard';

const SECTION_MAP = {
  'north-stand': { name: 'North Stand', gates: ['gate-n1', 'gate-n2'], nearby: ['North Food Hub'] },
  'south-stand': { name: 'South Stand', gates: ['gate-s1', 'gate-s2'], nearby: ['South Food Hub'] },
  'east-wing': { name: 'East Stand', gates: ['gate-e1'], nearby: ['North Food Hub'] },
  'west-wing': { name: 'West Stand', gates: ['gate-w1'], nearby: ['South Food Hub'] },
  'food-court-north': { name: 'North Food Hub', gates: ['gate-n1'], nearby: ['North Stand'] },
  'food-court-south': { name: 'South Food Hub', gates: ['gate-s1'], nearby: ['South Stand'] },
  'vip-lounge': { name: 'VIP Lounge', gates: ['gate-vip'], nearby: ['East Stand'] },
  'parking-a': { name: 'Parking (Zone A)', gates: ['gate-n1'], nearby: ['North Stand'] },
};

export default function CrowdSnapshot() {
  const { totalOccupancy, totalCapacity, zones } = useWaitTimes();
  const { gates, recommendations } = useCrowdData();
  const { selectedDestination } = useOnboarding();

  const isLoading = !zones || !gates || zones.length === 0;

  // 1. Resolve Location
  const locationId = typeof selectedDestination === 'string' ? selectedDestination : selectedDestination?.id;
  const locationInfo = SECTION_MAP[locationId] || { name: 'Whole Stadium', gates: [], nearby: [] };
  const locationName = locationInfo.name;

  // 2. Fetch Local Data
  // Important: We use 'zoneId' (camelCase) to match the backend sensor generator payload
  const localZone = zones?.find(z => (z.zoneId || z.zone_id) === locationId);

  // Realistic Dummy Data Fallbacks for specific stands
  const DUMMY_FALLBACKS = {
    'south-stand': { occupancy: 12540, wait: 4, cap: 25000 },
    'north-stand': { occupancy: 18200, wait: 12, cap: 25000 },
    'east-wing': { occupancy: 9500, wait: 5, cap: 20000 },
    'west-wing': { occupancy: 4200, wait: 3, cap: 20000 },
    'global': { occupancy: 70355, wait: 8, cap: 100000 }
  };

  // FIX: All derived metrics are computed inside useMemo so that Math.random()
  // (used for wait-time jitter) is NOT called on every render. Previously this
  // caused an infinite loop: random value → new prop → child re-render → parent
  // re-render → new random value → …
  const { localOccupancy, localCapacity, localPeak, localWait, capacityPercent, isOverCapacity } = useMemo(() => {
    const fallback = DUMMY_FALLBACKS[locationId] || DUMMY_FALLBACKS.global;
    const occ   = localZone ? (localZone.currentOccupancy ?? localZone.occupancy ?? fallback.occupancy) : fallback.occupancy;
    const cap   = localZone ? (localZone.capacity || fallback.cap) : fallback.cap;
    const peak  = localZone ? (localZone.peakOccupancy || occ) : Math.round(occ * 1.05);
    // Math.random() is safe here — it runs only when localZone or locationId changes
    const wait  = localZone ? (localZone.waitTime || fallback.wait + Math.round(Math.random() * 2)) : fallback.wait;
    const pct   = Math.round((occ / cap) * 100) || 0;
    return { localOccupancy: occ, localCapacity: cap, localPeak: peak, localWait: wait, capacityPercent: pct, isOverCapacity: occ > cap };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localZone, locationId]);

  // Logic: Matches GateStatus.jsx "clear" status criteria
  const getGateStatus = (gate) => {
    if (gate.isOpen === false) return 'closed';
    if (gate.estimatedWaitSec > 100) return 'heavy';
    if (gate.estimatedWaitSec > 40) return 'moderate';
    return 'clear';
  };

  // Fast Gates logic: Synchronized with Best Gate tab (All Clear Gates venue-wide)
  const allClearGates = useMemo(() => {
    return (gates || []).filter(g => {
      // Prioritize AI-predicted wait time if available, fallback to estimated
      const rec = (recommendations || []).find(r => (r.gate?.gateId || r.gate?.gate_id) === g.gateId);
      const wait = rec ? (rec.predictedWaitSec ?? rec.predicted_wait_seconds ?? g.estimatedWaitSec) : g.estimatedWaitSec;
      return getGateStatus({ ...g, estimatedWaitSec: wait }) === 'clear';
    });
  }, [gates, recommendations]);

  // Specifically for this stand (Sub-filter for contextual subtext)
  const localClearGates = allClearGates.filter(g => locationId ? locationInfo.gates.includes(g.gateId) : false);
  
  // AI-Powered "Fastest" Logic
  const bestGlobalGate = recommendations?.[0]?.gate;
  const bestLocalGateRect = recommendations?.find(r => locationId && r.gate?.zone === locationId);
  const bestLocalGate = bestLocalGateRect?.gate || localClearGates[0];

  // Status Logic for the cards (color themes)
  const getCardStatus = (val, type) => {
    if (isOverCapacity) return 'crowded';
    if (type === 'occupancy') {
      if (val < 50) return 'good';
      if (val < 80) return 'caution';
      return 'crowded';
    }
    if (type === 'wait') {
      if (val < 5) return 'good';
      if (val < 10) return 'caution';
      return 'crowded';
    }
    return 'good';
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-24 px-4 sm:px-8">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-5 bg-accent-blue rounded-full shadow-[0_0_15px_rgba(26,115,232,0.5)]" />
            <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-theme-secondary">Real-Time Operational Row</h3>
          </div>
          <div className="flex items-center gap-3 text-lg font-black text-theme-primary">
            <MapPin size={18} className="text-accent-blue" />
            <span>Live Intelligence for <span className="text-accent-blue px-1">{locationName}</span></span>
          </div>
        </div>
      </div>

      {/* Explicit Spacer to prevent layout collapse */}
      <div className="h-5" />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10 mt-12 justify-items-center">
        {/* Card 1: People */}
        <SnapshotCard
          loading={isLoading}
          label={`People in ${locationName}`}
          title={localOccupancy || 0}
          sub="Currently present inside this area"
          secondary={`Peak today: ${localPeak.toLocaleString()} visitors`}
          icon={<Users size={20} />}
          status={getCardStatus(capacityPercent, 'occupancy')}
          locationTag={locationName}
          sparkline={true}
        />

        {/* Card 2: Capacity */}
        <SnapshotCard
          loading={isLoading}
          label={isOverCapacity ? `${locationName} OVER CAPACITY` : `${locationName} Capacity`}
          title={`${capacityPercent}%`}
          sub={isOverCapacity ? `DANGEROUS OVERCROWDING: ${capacityPercent}%` : `${capacityPercent}% total fullness`}
          secondary={`${localOccupancy.toLocaleString()} of ${localCapacity.toLocaleString()} standard capacity`}
          icon={<Activity size={20} />}
          status={isOverCapacity ? 'crowded' : getCardStatus(capacityPercent, 'occupancy')}
          progress={capacityPercent}
          locationTag={locationName}
        />

        {/* Card 3: Wait Time */}
        <SnapshotCard
          loading={isLoading}
          label={`Entry Wait for ${locationName}`}
          title={localWait ? `${localWait} min` : "Calculating..."}
          sub="Typical timing to enter this area"
          secondary={localWait < 6 ? "Faster than overall average" : "Currently seeing high demand"}
          icon={<Clock size={20} />}
          status={getCardStatus(localWait, 'wait')}
          trend={localWait < 5 ? 12 : -5}
          locationTag={locationName}
        />

        {/* Card 4: Fast Entry Gates */}
        <SnapshotCard
          loading={isLoading}
          label={`Fast Gates for ${locationName}`}
          title={localClearGates.length > 0 
            ? `${localClearGates.length} ${localClearGates.length === 1 ? 'Gate' : 'Gates'}` 
            : (bestLocalGate ? "Best Gate" : "0 Gates")}
          sub={localClearGates.length > 0
            ? `${localClearGates.map(g => g.name).join(', ')} currently clear`
            : (bestLocalGate ? `${bestLocalGate.name} recommended` : "All entries heavy")}
          secondary={bestLocalGate ? `${bestLocalGate.name} is the optimal entry point` : "Standard entry applies"}
          icon={<Zap size={20} />} // Changed to Zap to match the fast entry theme
          status={localClearGates.length > 0 ? 'good' : (bestLocalGate ? 'caution' : 'crowded')}
          locationTag={locationName}
          onClick={() => {
            window.dispatchEvent(new CustomEvent('venueflow:action', {
              detail: { tab: 'gates' }
            }));
          }}
        />
      </div>
    </div>
  );
}
