import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Navigation,
  Users,
  Clock,
  Zap,
  Utensils,
  Trophy,
  ParkingCircle,
  LayoutGrid,
  TrendingUp,
  Sparkles,
  ChevronRight
} from 'lucide-react';

const CATEGORY_IMAGES = {
  Food: '/images/food_court.webp',
  Stand: '/images/stadium_stand.webp',
  Premium: '/images/vip_lounge.webp',
  Parking: '/images/parking_lot.webp',
};

const SECTIONS_METADATA = [
  { id: 'north-stand', name: 'North Stand', icon: LayoutGrid, type: 'Stand', crowd: 72, wait: 12, dist: 180, trend: false },
  { id: 'south-stand', name: 'South Stand', icon: LayoutGrid, type: 'Stand', crowd: 15, wait: 2, dist: 310, trend: true },
  { id: 'east-wing', name: 'East Stand', icon: Zap, type: 'Stand', crowd: 45, wait: 5, dist: 220, trend: false },
  { id: 'west-wing', name: 'West Stand', icon: Zap, type: 'Stand', crowd: 30, wait: 4, dist: 150, trend: true },
  { id: 'food-court-north', name: 'North Food Hub', icon: Utensils, type: 'Food', crowd: 85, wait: 18, dist: 90, trend: false },
  { id: 'food-court-south', name: 'South Food Hub', icon: Utensils, type: 'Food', crowd: 22, wait: 3, dist: 240, trend: true },
  { id: 'vip-lounge', name: 'VIP Lounge', icon: Trophy, type: 'Premium', crowd: 10, wait: 1, dist: 50, trend: false },
  { id: 'parking-a', name: 'Parking (Zone A)', icon: ParkingCircle, type: 'Parking', crowd: 50, wait: 10, dist: 600, trend: false },
];

function LocationCard({ section, index, onSelect, isRecommended }) {
  const Icon = section.icon;
  const bgImage = CATEGORY_IMAGES[section.type];

  const getCrowdStatus = (val) => {
    if (val > 70) return { label: 'Heavy', color: 'text-red-400', bg: 'bg-red-500/20' };
    if (val > 30) return { label: 'Moderate', color: 'text-amber-400', bg: 'bg-amber-500/20' };
    return { label: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
  };

  const status = getCrowdStatus(section.crowd);

  return (
    <motion.button
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.08,
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1]
      }}
      onClick={() => onSelect(section.id)}
      className={`group relative h-80 rounded-[2.5rem] overflow-hidden text-left transition-all duration-700 
        hover:shadow-[0_45px_90px_-20px_rgba(0,0,0,0.6)] hover:-translate-y-3 flex flex-col justify-end
        ${isRecommended ? 'ring-2 ring-accent-blue/50 shadow-[0_0_40px_rgba(26,115,232,0.2)]' : 'border border-white/10'}
      `}
    >
      {/* Background Image Layer */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      {/* Category-Aware Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent transition-opacity duration-700 group-hover:via-black/60" />
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      {/* Glassmorphism Content Box */}
      <div className="relative z-10 p-7 w-full backdrop-blur-md bg-white/5 border-t border-white/10 flex flex-col gap-4 transform transition-transform duration-500 group-hover:translate-y-[-4px]">

        {/* Top: Metadata & Smart Badge */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl bg-white/10 text-white`}>
              <Icon size={18} strokeWidth={2} />
            </div>
            <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">{section.type}</span>
          </div>

          <div className="flex gap-2">
            {isRecommended && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-blue text-white text-[9px] font-black uppercase tracking-widest shadow-xl shadow-accent-blue/30">
                <Sparkles size={10} /> Best Choice
              </div>
            )}
            {section.trend && (
              <div className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-[8px] font-bold uppercase tracking-widest border border-white/5 backdrop-blur-sm">
                Live
              </div>
            )}
          </div>
        </div>

        {/* Middle: Title & Proximity reasoning */}
        <div>
          <h2 className="text-2xl font-black text-white leading-tight tracking-tight mb-2 flex items-center justify-between group-hover:text-accent-blue transition-colors">
            {section.name}
            <ChevronRight size={20} className="opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
          </h2>
          <div className="flex items-center gap-4 text-white/40 text-[10px] font-bold uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><Clock size={12} className="text-accent-blue" /> {section.wait} min wait</span>
            <span className="flex items-center gap-1.5"><Navigation size={12} className="text-emerald-400" /> {section.dist}m away</span>
          </div>
        </div>

        {/* Bottom: Crowd Pulsar */}
        <div className="pt-2 border-t border-white/5">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 transition-colors backdrop-blur-sm ${status.bg}`}>
            <div className={`w-2 h-2 rounded-full ${status.color.replace('text', 'bg')} animate-pulse`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${status.color}`}>
              {status.label} Activity
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export default function SectionSelector({ onSelect }) {
  const sortedSections = useMemo(() => {
    return [...SECTIONS_METADATA].sort((a, b) => {
      const scoreA = (a.crowd * 0.7) + (a.wait * 0.3);
      const scoreB = (b.crowd * 0.7) + (b.wait * 0.3);
      return scoreA - scoreB;
    });
  }, []);

  const recommendedIds = sortedSections.slice(0, 2).map(s => s.id);

  return (
    <div className="fixed inset-0 z-[100] bg-theme-page overflow-y-auto flex flex-col items-center">
      {/* Immersive radial glow background */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-accent-blue/10 blur-[180px] animate-pulse" />
        <div className="absolute bottom-[5%] right-[0%] w-[50%] h-[50%] rounded-full bg-accent-cyan/10 blur-[200px]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl px-8 py-24 min-h-screen flex flex-col items-center">
        {/* Onboarding Header Segment */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col items-center text-center mb-20"
        >
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-accent-blue/10 border border-accent-blue/30 text-[10px] font-black uppercase tracking-[0.4em] text-accent-blue mb-8 backdrop-blur-md">
            <Sparkles size={12} /> VenueFlow Intelligence • Setup
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-theme-primary tracking-tighter mb-8 leading-[0.9]">
            Where are you <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-cyan">heading?</span>
          </h1>

          <p className="text-xl text-theme-secondary max-w-2xl opacity-70 leading-relaxed font-medium">
            Let's personalize your experience. Choose your destination and see
            <span className="text-accent-blue font-bold px-1 text-2xl animate-pulse"> real-time </span>
            intelligence for your route.
          </p>
        </motion.div>

        {/* Intelligent Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
          {sortedSections.map((section, i) => (
            <LocationCard
              key={section.id}
              section={section}
              index={i}
              onSelect={onSelect}
              isRecommended={recommendedIds.includes(section.id)}
            />
          ))}
        </div>

        {/* System Footer Metadata */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-24 flex items-center gap-6 text-[10px] font-black text-theme-secondary opacity-30 uppercase tracking-[0.5em]"
        >
          <span>VenueFlow AI · Operational Intelligence · 2026</span>
        </motion.div>
      </div>
    </div>
  );
}
