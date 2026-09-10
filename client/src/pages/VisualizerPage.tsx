import React, { useState, useEffect, useCallback } from 'react';
import type { CrowdZone, Incident } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMatch, TEAM_CONFIG } from '../context/MatchContext';

const ALERT_LEVELS = ["Low", "Elevated", "High", "Critical"];

export const VisualizerPage: React.FC = () => {
  const [zones, setZones] = useState<CrowdZone[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeStandId, setActiveStandId] = useState<'north' | 'east' | 'south' | 'west'>('south');
  
  // Local overrides for alert levels per stand, as the mockup implies manual triage
  const [alertOverrides, setAlertOverrides] = useState<Record<string, string>>({
    north: 'Moderate', // Mockup default
    east: 'Low',
    south: 'Low',
    west: 'Low'
  });

  const [matchTime, setMatchTime] = useState(78 * 60 + 31); // 78:31 in seconds

  const { 
    homeScore, 
    awayScore,
    activeGoalCelebration, 
    activeWinnerCelebration,
    clearCelebrations
  } = useMatch();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [crowdRes, incRes] = await Promise.all([
          fetch('/api/crowd'),
          fetch('/api/incidents')
        ]);
        
        if (crowdRes.ok) {
          const crowdData = await crowdRes.json();
          setZones(Array.isArray(crowdData) ? crowdData : []);
        }

        if (incRes.ok) {
          const incData = await incRes.json();
          setIncidents(Array.isArray(incData) ? incData : []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, []);

  // Timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setMatchTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      clearCelebrations();
    }
  }, [clearCelebrations]);

  useEffect(() => {
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);



  // Dynamically update activeStandId to the stand with the lowest density
  useEffect(() => {
    const stands = ['north', 'east', 'south', 'west'];
    let minStand = 'south';
    let minDensity = Infinity;

    stands.forEach(id => {
      const realZone = zones.find(z => z.name.toLowerCase().includes(id));
    const defaults: Record<string, { density: number }> = {
        north: { density: 86 },
        east: { density: 70 },
        south: { density: 55 },
        west: { density: 49 }
      };
      const density = realZone ? realZone.density : defaults[id].density;
      
      if (density < minDensity) {
        minDensity = density;
        minStand = id;
      }
    });

    setActiveStandId(minStand as 'north' | 'east' | 'south' | 'west');
  }, [zones]);

  // Map API zones to the 4 stands
  const getStandData = (id: string) => {
    // Attempt to find the real zone from the API
    const realZone = zones.find(z => z.name.toLowerCase().includes(id));
    const alertLevel = alertOverrides[id] || 'Low';
    
    // Default mock data matching the HTML mockup if API data isn't loaded yet
    const defaults: Record<string, { name: string; density: number; desc: string }> = {
      north: { name: "North Stand", density: 86, desc: "Heavy queue formation observed at North turning lanes. Wait times adjusting upwards." },
      east: { name: "East Stand", density: 70, desc: "Main gates flowing steadily. Structural entry pathways running normal." },
      south: { name: "South Stand", density: 55, desc: "Wait time at gates is estimated at 4 mins. System parameters are running and safe for immediate access." },
      west: { name: "West Stand", density: 49, desc: "Minimal operational load. Ideal distribution tracking across outer zones." }
    };

    const base = defaults[id];
    
    return {
      name: realZone ? realZone.name : base.name,
      density: realZone ? realZone.density : base.density,
      alertLevel: alertLevel,
      incident: incidents.find(i => i.zoneId === realZone?.zoneId && i.status === 'active') ? 'Active Alert' : 'None',
      desc: alertLevel !== 'Low' && alertLevel !== 'Moderate' 
        ? `Warning: Alert parameters changed to ${alertLevel} for ${base.name}. Please monitor processing queues.`
        : `Alert level is ${alertLevel}. ${base.desc}`
    };
  };

  const activeStand = getStandData(activeStandId);
  const overallDensity = zones.length > 0 
    ? Math.round(zones.reduce((acc, z) => acc + z.density, 0) / zones.length) 
    : 65;
    
  const activeIncidentCount = incidents.filter(i => i.status === 'active').length;

  const handleShiftAlert = (direction: number) => {
    setAlertOverrides(prev => {
      const current = prev[activeStandId] || 'Low';
      let idx = ALERT_LEVELS.indexOf(current);
      if (idx === -1) idx = 0; // Handle 'Moderate' mapping to the array
      
      let nextIdx = idx + direction;
      if (nextIdx >= 0 && nextIdx < ALERT_LEVELS.length) {
        return { ...prev, [activeStandId]: ALERT_LEVELS[nextIdx] };
      }
      return prev;
    });
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="-mx-4 md:-mx-6 -my-4 md:-my-6 bg-white min-h-[calc(100dvh-111px)] md:h-[calc(100dvh-111px)] md:overflow-hidden overflow-y-auto p-4 sm:p-6 md:p-10 text-[#110F18] font-sans flex items-start md:items-center justify-center relative">
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(400px); }
        }
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(400px) rotate(360deg); opacity: 0; }
        }
      `}</style>
      

      
      <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center py-4 md:py-0">
        
        {/* Stadium Viewport - Left Side */}
        <div className="lg:col-span-7 bg-[#0A0712] rounded-xl p-4 sm:p-6 md:p-10 relative flex items-center justify-center shadow-inner overflow-hidden min-h-[280px] sm:min-h-[360px] md:min-h-[400px]">
          <svg className="w-full max-w-[680px] h-auto drop-shadow-2xl" viewBox="0 0 160 100">
            {/* Pitch */}
            <rect x="60" y="36" width="40" height="28" rx="4" fill="#06040A" stroke="#625E75" strokeWidth="1.5" opacity="0.4" />
            
            {/* Stands */}
            {[
              { id: 'north', points: "50,15 110,15 100,32 60,32", labelX: 80, labelY: 24.5 },
              { id: 'east', points: "113,22 143,30 143,70 113,78", labelX: 128, labelY: 51.5 },
              { id: 'south', points: "50,85 110,85 100,68 60,68", labelX: 80, labelY: 78.5 },
              { id: 'west', points: "47,22 17,30 17,70 47,78", labelX: 32, labelY: 51.5 }
            ].map(stand => {
              const isActive = activeStandId === stand.id;
              const data = getStandData(stand.id);
              return (
                <g key={stand.id} onClick={() => setActiveStandId(stand.id as any)} className="cursor-pointer group">
                  <polygon 
                    points={stand.points} 
                    className="transition-all duration-200 ease-in-out"
                    fill={isActive ? 'rgba(0, 230, 118, 0.12)' : 'rgba(72, 33, 97, 0.45)'}
                    stroke={isActive ? '#00E676' : '#6B3B8E'}
                    strokeWidth="2"
                    style={isActive ? { filter: 'drop-shadow(0px 0px 6px rgba(0,230,118,0.5))' } : {}}
                  />
                  <text 
                    x={stand.labelX} 
                    y={stand.labelY} 
                    fill="#FFFFFF" 
                    fontSize="3.5" 
                    fontWeight="700" 
                    textAnchor="middle" 
                    pointerEvents="none" 
                    letterSpacing="0.2"
                  >
                    {stand.id.charAt(0).toUpperCase() + stand.id.slice(1)} ({data.density}%)
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Telemetry Content Engine - Right Side */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="text-center mb-8">
            <div className="text-[12px] font-bold uppercase tracking-[1.5px] text-[#110F18] mb-3">
              {activeStand.name} Status
            </div>
            <div className="text-xl md:text-[24px] font-bold mb-4 text-[#110F18]">
              {activeStand.density}% Density
            </div>
            <p className="text-[14px] text-[#625E75] max-w-[400px] mx-auto leading-[1.6]">
              {activeStand.desc}
            </p>
          </div>

        {/* Metrics Breakdown Grid */}
        <div className="flex justify-around items-center border-y border-[#E5E5E8] py-5 mb-8">
          <div className="text-center flex-1">
            <label className="text-[11px] font-bold uppercase text-[#625E75] block mb-1.5 tracking-[0.5px]">Match Time</label>
            <div className="text-[18px] font-bold text-[#110F18]">{formatTime(matchTime)}</div>
          </div>
          <div className="w-px h-8 bg-[#E5E5E8]"></div>
          <div className="text-center flex-1">
            <label className="text-[11px] font-bold uppercase text-[#625E75] block mb-1.5 tracking-[0.5px]">Overall Crowd</label>
            <div className="text-[18px] font-bold text-[#110F18]">{overallDensity}%</div>
          </div>
          <div className="w-px h-8 bg-[#E5E5E8]"></div>
          <div className="text-center flex-1">
            <label className="text-[11px] font-bold uppercase text-[#625E75] block mb-1.5 tracking-[0.5px]">Active Incident</label>
            <div className={`text-[18px] font-bold ${activeIncidentCount > 0 ? 'text-brand-red' : 'text-[#110F18]'}`}>
              {activeIncidentCount > 0 ? `${activeIncidentCount} Active` : 'None'}
            </div>
          </div>
        </div>

          {/* Alert Triage Controller */}
          <div className="flex items-center justify-between max-w-[400px] mx-auto mt-2">
            <span className="text-[14px] font-bold text-[#110F18]">Alert Level</span>
            <div className="flex items-center bg-[#F4F6FA] rounded-[24px] p-1 w-[220px] justify-between">
              <button 
                onClick={() => handleShiftAlert(-1)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#A0A5B5] hover:bg-[#E4E8F0] hover:text-[#110F18] transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="font-bold text-[14px] text-[#110F18]">
                {activeStand.alertLevel}
              </div>
              <button 
                onClick={() => handleShiftAlert(1)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#A0A5B5] hover:bg-[#E4E8F0] hover:text-[#110F18] transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

      </div>



      {/* Goal Celebration Overlay */}
      {activeGoalCelebration && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#020605]/70 backdrop-blur-md cursor-pointer overflow-hidden"
          onClick={() => clearCelebrations()}
        >
          {/* Radial Burst */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-0 animate-in fade-in duration-1000"
            style={{ 
              background: `radial-gradient(circle at center, ${TEAM_CONFIG[activeGoalCelebration.side].color}55 0%, transparent 70%)` 
            }}
          />
          
          {/* Card */}
          <div 
            className="relative w-[300px] rounded-[16px] border-[2px] p-6 flex flex-col items-center justify-center shadow-2xl animate-in zoom-in-90 slide-in-from-bottom-4 duration-500 overflow-hidden"
            style={{ 
              background: 'linear-gradient(to bottom, #10241C, #081511)',
              borderColor: TEAM_CONFIG[activeGoalCelebration.side].color 
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Scanline */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[14px]">
              <div className="w-full h-8 bg-white/5 blur-sm absolute top-0 animate-[scan_2.6s_linear_infinite]" />
            </div>

            {/* Content */}
            <img 
              src={TEAM_CONFIG[activeGoalCelebration.side].flagUrl} 
              alt="Flag" 
              className="absolute top-4 right-4 w-6 rounded-[2px] shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
            />
            
            <h2 
              className="text-[32px] font-bold tracking-tight mb-4"
              style={{ 
                color: TEAM_CONFIG[activeGoalCelebration.side].color,
                textShadow: `0 0 12px ${TEAM_CONFIG[activeGoalCelebration.side].color}88`
              }}
            >
              GOAL!
            </h2>
            
            <div 
              className="w-[96px] h-[96px] rounded-full p-1 mb-4 flex-shrink-0"
              style={{
                background: `conic-gradient(from 0deg, transparent, ${TEAM_CONFIG[activeGoalCelebration.side].color})`
              }}
            >
              <img 
                src={activeGoalCelebration.photoUrl} 
                alt="Player" 
                className="w-full h-full rounded-full object-cover border-2 border-[#10241C]"
              />
            </div>
            
            <div className="text-[19px] font-semibold text-[#F3F7EC] mb-1">
              {activeGoalCelebration.playerName}
            </div>
            <div className="text-xs font-mono text-[#F3F7EC]/60 mb-6 uppercase tracking-wider">
              #{activeGoalCelebration.playerNumber} • {TEAM_CONFIG[activeGoalCelebration.side].code}
            </div>
            
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full">
              <div 
                className="h-full origin-left animate-[shrink_5s_linear_forwards]"
                style={{ backgroundColor: TEAM_CONFIG[activeGoalCelebration.side].color }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Match Winner Celebration Overlay */}
      {activeWinnerCelebration && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#020605]/70 backdrop-blur-md cursor-pointer overflow-hidden"
          onClick={() => clearCelebrations()}
        >
          {/* Radial Burst */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-0 animate-in fade-in duration-1000"
            style={{ background: `radial-gradient(circle at center, #F2B70555 0%, transparent 70%)` }}
          />
          
          {/* Card */}
          <div 
            className="relative w-[340px] rounded-[20px] border border-[#F2B705]/45 p-8 flex flex-col items-center justify-center shadow-[0_24px_60px_rgba(0,0,0,0.6)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-700 overflow-hidden"
            style={{ background: 'linear-gradient(to bottom, #17190F, #0A0C07)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Confetti Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(18)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute w-2 h-2 rounded-sm opacity-80"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `-10px`,
                    backgroundColor: i % 2 === 0 ? '#F2B705' : '#F3F7EC',
                    animation: `fall ${2 + Math.random() * 2}s linear ${Math.random() * 2}s infinite`
                  }}
                />
              ))}
            </div>

            {/* Scanline */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[19px]">
              <div className="w-full h-8 bg-[#F2B705]/5 blur-md absolute top-0 animate-[scan_2.6s_linear_infinite]" />
            </div>

            {/* Content */}
            <div className="border border-[#F2B705]/50 bg-[#F2B705]/10 rounded-full px-3 py-1 mb-6 text-[#F2B705] text-[11px] font-bold tracking-[0.08em]">
              FULL TIME
            </div>
            
            {/* Trophy Icon */}
            <div className="w-16 h-16 mb-4 flex items-center justify-center text-[#F2B705] drop-shadow-[0_0_15px_rgba(242,183,5,0.6)] animate-pulse">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                <path d="M4 22h16"></path>
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
              </svg>
            </div>
            
            <div className="text-[11px] tracking-[0.16em] text-[#F3F7EC]/60 font-semibold mb-2">
              CHAMPIONS
            </div>
            
            <img 
              src={TEAM_CONFIG[activeWinnerCelebration.side].flagUrl} 
              alt="Flag" 
              className="w-10 rounded-[2px] shadow-[0_0_0_1px_rgba(255,255,255,0.1)] mb-3"
            />
            
            <div className="text-[26px] font-bold text-white mb-6 text-center">
              {TEAM_CONFIG[activeWinnerCelebration.side].fullName}
            </div>
            
            <div className="text-[14px] font-mono text-[#F3F7EC]/50 font-medium">
              {homeScore} <span className="text-[#F3F7EC]/30">—</span> {awayScore}
            </div>
            
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full">
              <div 
                className="h-full origin-left bg-[#F2B705] animate-[shrink_6s_linear_forwards]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
