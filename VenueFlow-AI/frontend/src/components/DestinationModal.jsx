// src/components/DestinationModal.jsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Navigation,
  Clock,
  Zap,
  Utensils,
  Trophy,
  ParkingCircle,
  LayoutGrid,
  Sparkles,
  Settings,
  Radio,
} from 'lucide-react';
import { useOnboarding } from '../context/OnboardingContext';
import { useWaitTimes } from '../hooks/useWaitTimes';

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORY = {
  Food: { Icon: Utensils, image: '/images/food_court.webp' },
  Stand: { Icon: LayoutGrid, image: '/images/stadium_stand.webp' },
  Premium: { Icon: Trophy, image: '/images/vip_lounge.webp' },
  Parking: { Icon: ParkingCircle, image: '/images/parking_lot.webp' },
};

const SECTION_IMAGES = {
  'north-stand': '/images/stand_cricket_north.webp',
  'south-stand': '/images/stand_cricket_south.webp',
  'east-wing': '/images/stadium_stand_east.webp',
  'west-wing': '/images/stadium_stand_west.webp',
  'food-court-north': '/images/food_court_north.webp',
  'food-court-south': '/images/food_court_south.webp',
};

// ─── Activity status ──────────────────────────────────────────────────────────
// Google-Standard Accessibility Palette (Pastel BG + Dark Text)
function getActivity(crowdPercent) {
  // Synchronized with backend models.py thresholds
  if (crowdPercent >= 95) return { label: 'AT CAPACITY', bg: 'bg-[#FCE8E6]', text: 'text-[#C5221F]' };
  if (crowdPercent >= 80) return { label: 'HEAVY ACTIVITY', bg: 'bg-[#FCE8E6]', text: 'text-[#C5221F]' };
  if (crowdPercent >= 50) return { label: 'MODERATE ACTIVITY', bg: 'bg-[#FFF4E5]', text: 'text-[#663C00]' };
  return { label: 'LOW ACTIVITY', bg: 'bg-[#E6F4EA]', text: 'text-[#137333]' };
}

// ─── Single card ──────────────────────────────────────────────────────────────
function LocationCard({ section, index, onSelect, isBestChoice }) {
  const cat = CATEGORY[section.type] || { Icon: Navigation, image: '/images/stadium_stand.webp' };
  const bgImage = SECTION_IMAGES[section.id] || cat.image;
  const activity = getActivity(section.crowd);

  return (
    <motion.button
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      whileTap={{ scale: 0.96 }}
      onClick={() => onSelect(section.id)}
      className="group relative w-full rounded-xl overflow-hidden text-left flex flex-col cursor-pointer
                 shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:shadow-[0_40px_100px_rgba(0,0,0,0.5)]
                 transition-all duration-500 h-64"
    >
      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
        <div className="absolute inset-0 bg-black/20 mix-blend-overlay opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10 transition-opacity duration-300 group-hover:opacity-90" />
      </div>

      {/* Status Badges (Top Right) */}
      <div className="absolute top-5 right-6 z-20 flex flex-col items-end gap-2">
        {isBestChoice && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-blue shadow-[0_10px_20px_rgba(26,115,232,0.3)]"
          >
            <Sparkles size={10} className="text-white" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest">Best Choice</span>
          </motion.div>
        )}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg backdrop-blur-md border border-white/10 ${activity.bg} ${activity.text}`}
        >
          {activity.label}
        </motion.div>
      </div>

      <div className="flex-1" />

      <div className="relative z-10 px-8 pt-4 pb-6">
        <h3 className="text-2xl font-black text-white leading-tight tracking-tight mb-2 group-hover:text-accent-blue transition-colors duration-300">
          {section.name}
        </h3>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[10px] font-black text-white/50 tracking-widest uppercase">
            <Clock size={11} className="text-accent-blue" />
            {section.wait} MIN WAIT
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-black text-white/50 tracking-widest uppercase">
            <Navigation size={11} className="text-accent-blue" />
            {section.dist}M AWAY
          </span>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Semantic Section Header ──────────────────────────────────────────
function SectionHeader({ title, icon: Icon, color = "text-accent-blue" }) {
  return (
    <div className="w-full flex items-center gap-4">
      <div className={`p-2.5 rounded-xl bg-white/50 border border-slate-200 shadow-sm ${color}`}>
        <Icon size={18} />
      </div>
      <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">{title}</h2>
      <div className="flex-1 h-px bg-slate-200 ml-4" />
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export default function DestinationModal({ onSelect }) {
  const { selectedVenue } = useOnboarding();
  const { zones } = useWaitTimes();

  // Semantic Grouping with Recommendation Priority
  const categorizedData = useMemo(() => {
    const raw = selectedVenue?.sections || [];

    // Live Hydration: Update static sections with data from useWaitTimes
    const hydrated = raw.map(section => {
      const liveZone = zones?.find(z => (z.zoneId || z.id) === section.id);
      if (!liveZone) return section;

      return {
        ...section,
        crowd: Math.round((liveZone.currentOccupancy / (liveZone.capacity || 1)) * 100),
        wait: liveZone.waitTime || section.wait, // Prefer live wait time if available
      };
    });

    // 1. Recommended (Top 2 by shortest wait time)
    const recommended = [...hydrated].sort((a, b) => a.wait - b.wait).slice(0, 2);

    // 2. Near You (Top 2 closest distance, excluding Recommended)
    const nearYou = [...hydrated]
      .filter(item => !recommended.some(r => r.id === item.id))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 2);

    // 3. Others (Global Overview)
    const others = hydrated.filter(item =>
      !recommended.some(r => r.id === item.id) &&
      !nearYou.some(n => n.id === item.id)
    );

    return { recommended, nearYou, others };
  }, [selectedVenue, zones]);

  const bestIds = categorizedData.recommended.map(s => s.id);

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto pb-20"
      style={{ background: 'linear-gradient(160deg, #f0f4f8 0%, #e8eef5 50%, #f0f4f8 100%)' }}>

      <div className="fixed top-0 right-0 w-[600px] h-[400px] bg-cyan-300/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[300px] bg-blue-300/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="relative z-10 w-full md:max-w-[1400px] mx-auto px-4 md:px-10 py-6 md:py-10 flex flex-col items-center">

        {/* ── HEADER ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full flex flex-col items-center text-center mb-16"
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-7
                          bg-white/70 backdrop-blur-md border border-slate-200/80
                          shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <Settings size={11} className="text-slate-400" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
              VenueFlow Intelligence · Setup
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-[72px] font-black text-slate-900 tracking-tighter leading-none mb-5">
            Where are you{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
              heading?
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-500 max-w-lg leading-relaxed font-medium">
            Personalize your mission. We've grouped your destinations by{' '}
            <span className="font-black text-slate-700">recommendation</span> and{' '}
            <span className="font-black text-slate-700">proximity</span>.
          </p>
        </motion.div>

        {/* ── RECOMMENDED ─────────────────────────────────────── */}
        {categorizedData.recommended.length > 0 && (
          <div className="w-full mb-10">
            <SectionHeader title="Recommended for You" icon={Sparkles} color="text-amber-500" />
            <div className="h-10" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {categorizedData.recommended.map((section, i) => (
                <LocationCard
                  key={section.id}
                  section={section}
                  index={i}
                  onSelect={onSelect}
                  isBestChoice={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── NEAR YOU ────────────────────────────────────────── */}
        {categorizedData.nearYou.length > 0 && (
          <div className="w-full mb-10">
            <div className="h-10" />
            <SectionHeader title="Near Your Location" icon={Navigation} color="text-blue-500" />
            <div className="h-10" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {categorizedData.nearYou.map((section, i) => (
                <LocationCard
                  key={section.id}
                  section={section}
                  index={i + 2}
                  onSelect={onSelect}
                  isBestChoice={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── GLOBAL OVERVIEW ─────────────────────────────────── */}
        {categorizedData.others.length > 0 && (
          <div className="w-full">
            <div className="h-10" />
            <SectionHeader title="Global Overview" icon={LayoutGrid} color="text-slate-400" />
            <div className="h-10" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {categorizedData.others.map((section, i) => (
                <LocationCard
                  key={section.id}
                  section={section}
                  index={i + 4}
                  onSelect={onSelect}
                  isBestChoice={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── FOOTER ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-20 flex flex-col items-center gap-2"
        >
          <div className="w-16 h-px bg-slate-200 mb-1" />
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.35em]">
            VenueFlow AI · Operational Intelligence · {new Date().getFullYear()}
          </p>
        </motion.div>
      </div>
    </div>
  );
}