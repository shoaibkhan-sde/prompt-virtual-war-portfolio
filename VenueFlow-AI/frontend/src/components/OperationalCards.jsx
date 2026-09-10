import React from 'react';
import { motion } from 'framer-motion';
import { 
  Navigation, Utensils, ParkingCircle, Layout, 
  ArrowUpRight, ArrowDownRight, Clock, MapPin, 
  Zap, AlertCircle, Info, Coffee
} from 'lucide-react';
import { useCrowdData } from '../hooks/useCrowdData';
import { useWaitTimes } from '../hooks/useWaitTimes';
import { useOnboarding } from '../context/OnboardingContext';

// --- Sub-components for specific details ---
const DetailRow = ({ label, value, icon: Icon, color = "text-white/60" }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 grow">
    <div className="flex items-center gap-2">
      {Icon && <Icon size={12} className="text-white/20" />}
      <span className="text-[10px] font-black uppercase tracking-wider text-white/30">{label}</span>
    </div>
    <span className={`text-[11px] font-black ${color}`}>{value}</span>
  </div>
);

const CardFrame = ({ title, icon: Icon, theme, children, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.5 }}
    className={`relative overflow-hidden rounded-[24px] border backdrop-blur-3xl p-6 flex flex-col transition-all duration-500 group
      ${theme.bg} ${theme.border} hover:shadow-2xl hover:-translate-y-1`}
    style={{ minHeight: '280px' }}
  >
    <div className={`absolute -right-10 -top-10 w-40 h-40 blur-[80px] opacity-10 group-hover:opacity-30 transition-opacity ${theme.glow}`} />
    
    <div className="flex items-center gap-3 mb-6 relative z-10">
      <div className={`p-2.5 rounded-xl ${theme.iconBg}`}>
        <Icon size={20} />
      </div>
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/80">{title}</h3>
    </div>

    <div className="flex-1 space-y-1 relative z-10">
      {children}
    </div>
  </motion.div>
);

export default function OperationalCards() {
  const { recommendations, gates } = useCrowdData();
  const { zones } = useWaitTimes();
  const { selectedDestination } = useOnboarding();

  const bestGate = recommendations?.[0]?.gate;
  const nearestFood = zones?.find(z => z.zoneId.includes('food')) || { name: 'Central Court', occupancy: 450, capacity: 1000 };
  const parkingZone = zones?.find(z => z.zoneId.includes('parking')) || { occupancy: 2100, capacity: 5000 };

  const THEMES = {
    gates: { bg: "bg-blue-600/10", border: "border-blue-500/20", glow: "bg-blue-500", iconBg: "bg-blue-500/20 text-blue-400" },
    food: { bg: "bg-amber-600/10", border: "border-amber-500/20", glow: "bg-amber-500", iconBg: "bg-amber-500/20 text-amber-400" },
    parking: { bg: "bg-purple-600/10", border: "border-purple-500/20", glow: "bg-purple-500", iconBg: "bg-purple-500/20 text-purple-400" },
    wing: { bg: "bg-emerald-600/10", border: "border-emerald-500/20", glow: "bg-emerald-500", iconBg: "bg-emerald-500/20 text-emerald-400" }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
      {/* 🚪 GATES CARD */}
      <CardFrame title="Best Entry Gate" icon={Navigation} theme={THEMES.gates} delay={0.1}>
        <div className="mb-4">
          <div className="text-3xl font-black tracking-tighter text-blue-400 mb-1">Gate {bestGate?.gate_id?.toUpperCase() || 'N1'}</div>
          <p className="text-[10px] font-bold text-white/40 leading-relaxed uppercase tracking-wide">Recommended based on your current path</p>
        </div>
        <DetailRow label="Average Wait" value={`${Math.round((bestGate?.estimatedWaitSec || 120) / 60)} Minutes`} icon={Clock} color="text-blue-300" />
        <DetailRow label="Current Status" value="Open & Clear" icon={Zap} color="text-emerald-400" />
        <DetailRow label="Distance" value="~240 Meters" icon={MapPin} />
        <DetailRow label="Queue Trend" value="Shrinking" icon={ArrowDownRight} color="text-emerald-400" />
      </CardFrame>

      {/* 🍔 FOOD COURTS CARD */}
      <CardFrame title="Dining & Refreshments" icon={Utensils} theme={THEMES.food} delay={0.2}>
        <div className="mb-4">
          <div className="text-3xl font-black tracking-tighter text-amber-400 mb-1">{nearestFood.name || "North Court"}</div>
          <p className="text-[10px] font-bold text-white/40 leading-relaxed uppercase tracking-wide">Nearest active court to your seat</p>
        </div>
        <DetailRow label="Wait Time" value="~8 Minutes" icon={Clock} color="text-amber-300" />
        <DetailRow label="Popular Item" value="Classic Samosa Box" icon={Coffee} color="text-white/80" />
        <DetailRow label="Crowd Level" value={nearestFood.occupancy / nearestFood.capacity > 0.8 ? "Busy" : "Moderate"} icon={Info} color="text-amber-400" />
        <DetailRow label="Last Order" value="~2h Remaining" icon={AlertCircle} />
      </CardFrame>

      {/* 🅿️ PARKING CARD */}
      <CardFrame title="Parking & Arrival" icon={ParkingCircle} theme={THEMES.parking} delay={0.3}>
        <div className="mb-4">
          <div className="text-3xl font-black tracking-tighter text-purple-400 mb-1">Lot A Status</div>
          <p className="text-[10px] font-bold text-white/40 leading-relaxed uppercase tracking-wide">assigned based on ticket profile</p>
        </div>
        <DetailRow label="Current State" value={parkingZone.occupancy / parkingZone.capacity > 0.9 ? "Full" : "Available"} icon={ParkingCircle} color="text-purple-300" />
        <DetailRow label="Walk to Gate" value="~6 Minutes" icon={MapPin} />
        <DetailRow label="Exit Strategy" value="Route B (East)" icon={Navigation} color="text-emerald-400" />
        <DetailRow label="Overflow" value="Lot B - 12% space" icon={Info} />
      </CardFrame>

      {/* 🏟️ WINGS / SECTIONS CARD */}
      <CardFrame title="Section & Logistics" icon={Layout} theme={THEMES.wing} delay={0.4}>
        <div className="mb-4">
          <div className="text-3xl font-black tracking-tighter text-emerald-400 mb-1">{selectedDestination || "North Stand"}</div>
          <p className="text-[10px] font-bold text-white/40 leading-relaxed uppercase tracking-wide">Your specific venue destination</p>
        </div>
        <DetailRow label="Best Path" value="via Gate S2" icon={Navigation} color="text-emerald-300" />
        <DetailRow label="Nearest Facilities" value="Level 2 (Hub A)" icon={MapPin} />
        <DetailRow label="Zone Density" value="52% Filled" icon={Layout} color="text-emerald-400" />
        <DetailRow label="Time to Seat" value="~12 Minutes" icon={Clock} />
      </CardFrame>
    </div>
  );
}
