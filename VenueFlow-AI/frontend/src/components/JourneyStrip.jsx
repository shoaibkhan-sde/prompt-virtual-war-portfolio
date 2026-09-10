import React from 'react';
import { motion } from 'framer-motion';
import { Car, Smartphone, MapPin, Armchair, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { useOnboarding } from '../context/OnboardingContext';
import { useCrowdData } from '../hooks/useCrowdData';

export default function JourneyStrip() {
  const { selectedDestination } = useOnboarding();
  const { recommendations } = useCrowdData();
  
  // Logic: Map the journey nodes based on selection
  // In a real app, 'currentStep' would come from GPS/Check-in state.
  // Here we'll simulate the progression.
  const currentStep = 1; // 0: Parking, 1: Entry, 2: Concourse, 3: Seat

  const bestGate = recommendations?.[0]?.gate?.gate_id?.toUpperCase() || "N1";
  const gateWait = recommendations?.[0]?.gate?.estimatedWaitSec || 120;

  const steps = [
    {
      id: 'parking',
      label: 'Parking',
      sub: 'Lot A',
      status: 'Available',
      icon: Car,
      color: 'text-blue-400',
      glow: 'shadow-blue-500/20'
    },
    {
      id: 'gate',
      label: 'Entry',
      sub: `Gate ${bestGate}`,
      status: `${Math.round(gateWait/60)}m Wait`,
      icon: Smartphone,
      color: 'text-emerald-400',
      glow: 'shadow-emerald-500/20'
    },
    {
      id: 'concourse',
      label: 'Concourse',
      sub: 'East Hub',
      status: 'Moderate',
      icon: MapPin,
      color: 'text-amber-400',
      glow: 'shadow-amber-500/20'
    },
    {
      id: 'seat',
      label: 'Your Seat',
      sub: selectedDestination || 'Sec 104',
      status: 'Clear Path',
      icon: Armchair,
      color: 'text-purple-400',
      glow: 'shadow-purple-500/20'
    }
  ];

  return (
    <div className="w-full py-6 mb-12">
      <div className="flex items-center justify-between gap-2 max-w-[1200px] mx-auto overflow-x-auto no-scrollbar pb-4 px-2">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;
          const isPending = idx > currentStep;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-3 min-w-[120px] relative group">
                {/* Icon Circle */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 relative z-10
                    ${isCompleted ? 'bg-emerald-500/10 border-emerald-500/30' : 
                      isCurrent ? 'bg-white/10 border-white/40 shadow-xl ' + step.glow : 
                      'bg-white/[0.03] border-white/5 opacity-40'}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={24} className="text-emerald-400" />
                  ) : (
                    <Icon size={24} className={isCurrent ? step.color : 'text-white/40'} />
                  )}

                  {/* Active Indicator Pulse */}
                  {isCurrent && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-40"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-white border-2 border-slate-900"></span>
                    </span>
                  )}
                </motion.div>

                {/* Text Info */}
                <div className={`text-center transition-all duration-300 ${isCurrent ? 'opacity-100 scale-105' : 'opacity-40'}`}>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-white">
                    {step.label}
                  </div>
                  <div className={`text-xs font-bold leading-none ${isCurrent ? 'text-white' : 'text-white/60'}`}>
                    {step.sub}
                  </div>
                  {isCurrent && (
                    <div className={`mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${step.color} border-white/10 bg-white/5`}>
                      {step.status}
                    </div>
                  )}
                </div>
              </div>

              {/* Connecting Line */}
              {idx < steps.length - 1 && (
                <div className="flex-1 h-px min-w-[30px] sm:min-w-[60px] bg-gradient-to-r from-white/5 via-white/20 to-white/5 relative top-[-1.5rem]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: isCompleted ? '100%' : '0%' }}
                    className="h-full bg-emerald-500/40"
                  />
                  {isCurrent && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                       <ChevronRight size={14} className="text-white/20" />
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
