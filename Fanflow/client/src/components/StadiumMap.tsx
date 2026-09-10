import React, { useMemo } from 'react';
import type { CrowdZone, VenueGate, TransitHub } from '../types';

interface StadiumMapProps {
  zones: CrowdZone[];
  gates: VenueGate[];
  transitHubs: TransitHub[];
  highlights: string[];
  activeIncidentZones: string[];
  activeFilter?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  onLegendClick?: (status: 'LOW' | 'MEDIUM' | 'HIGH' | null) => void;
  onElementClick?: (id: string, name: string, type: 'zone' | 'gate' | 'transit') => void;
  compact?: boolean;
}

export const StadiumMap: React.FC<StadiumMapProps> = React.memo(({
  zones,
  gates,
  highlights,
  activeIncidentZones,
  activeFilter = null,
  onLegendClick,
  onElementClick,
  compact = false
}) => {
  const zonesMap = useMemo(() => {
    const map = new Map<string, CrowdZone>();
    zones.forEach(z => map.set(z.zoneId, z));
    return map;
  }, [zones]);

  const gatesMap = useMemo(() => {
    const map = new Map<string, VenueGate>();
    gates.forEach(g => map.set(g.gateId, g));
    return map;
  }, [gates]);

  // Command center colors based on design tokens
  const getDensityColor = (density: number) => {
    if (density > 80) return 'url(#grad-red)'; // HIGH
    if (density > 50) return 'url(#grad-amber)'; // MEDIUM
    return 'url(#grad-teal)'; // LOW
  };

  const getBaseColor = (density: number) => {
    if (density > 80) return '#ef4444';
    if (density > 50) return '#f59e0b';
    return '#14b8a6';
  };

  const handleItemClick = (id: string, name: string, type: 'zone' | 'gate' | 'transit') => {
    if (onElementClick) {
      onElementClick(id, name, type);
    }
  };

  return (
    <div className={`w-full flex flex-col items-center ${compact ? '' : 'glass-panel rounded-2xl p-6'}`}>
      {!compact && (
        <div className="w-full flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 tracking-wide">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-red animate-live-pulse"></span>
              STADIUM VISUALIZER
            </h3>
            <p className="text-xs text-slate-400">Live crowd density and routing telemetry.</p>
          </div>

          <div className="flex gap-4 text-xs font-semibold tracking-wider">
            {(['LOW', 'MEDIUM', 'HIGH'] as const).map(status => {
              const isActive = activeFilter === status;
              const color = status === 'LOW' ? 'bg-brand-teal' : status === 'MEDIUM' ? 'bg-brand-amber' : 'bg-brand-red';
              return (
                <button
                  key={status}
                  onClick={() => onLegendClick && onLegendClick(isActive ? null : status)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${isActive ? 'bg-slate-800 ring-1 ring-slate-700' : 'hover:bg-slate-800/50 cursor-pointer'}`}
                >
                  <span className={`w-3 h-3 rounded ${color} shadow-[0_0_8px_currentColor]`}></span>
                  <span className="text-slate-300">{status}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive SVG Stadium */}
      <div className={`relative w-full aspect-square ${compact ? 'max-w-full' : 'max-w-[500px] glass-card p-4 border border-slate-800'}`}>
        <svg viewBox="0 0 400 400" className="w-full h-full select-none drop-shadow-2xl">
          <defs>
            <radialGradient id="grad-teal" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.1" />
              <stop offset="70%" stopColor="#14b8a6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0f766e" stopOpacity="0.6" />
            </radialGradient>
            <radialGradient id="grad-amber" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1" />
              <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0.6" />
            </radialGradient>
            <radialGradient id="grad-red" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.1" />
              <stop offset="70%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#b91c1c" stopOpacity="0.6" />
            </radialGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Scanner Grid */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.5"/>
          </pattern>
          <rect width="400" height="400" fill="url(#grid)" />

          {/* Outer Ring boundary */}
          <circle cx="200" cy="200" r="185" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />

          {/* Central Soccer Pitch */}
          <g transform="translate(145, 160)">
            <rect width="110" height="80" fill="#0B0F14" stroke="#475569" strokeWidth="1.5" rx="4" />
            <circle cx="55" cy="40" r="18" fill="none" stroke="#475569" strokeWidth="1" />
            <line x1="55" y1="0" x2="55" y2="80" stroke="#475569" strokeWidth="1" />
          </g>

          {/* STANDS (ZONES) */}
          {[
            { id: 'Zone-A', title: 'Zone A (North Stand)', path: 'M 80,110 A 150,150 0 0,1 320,110 L 290,140 A 110,110 0 0,0 110,140 Z', cx: 200, cy: 130, ix: 200, iy: 115, rot: 0 },
            { id: 'Zone-B', title: 'Zone B (East Stand)', path: 'M 330,120 A 150,150 0 0,1 330,280 L 295,250 A 110,110 0 0,0 295,150 Z', cx: 310, cy: 204, ix: 310, iy: 200, rot: 90 },
            { id: 'Zone-C', title: 'Zone C (South Stand)', path: 'M 320,290 A 150,150 0 0,1 80,290 L 110,260 A 110,110 0 0,0 290,260 Z', cx: 200, cy: 278, ix: 200, iy: 285, rot: 0 },
            { id: 'Zone-D', title: 'Zone D (West Stand)', path: 'M 70,280 A 150,150 0 0,1 70,120 L 105,150 A 110,110 0 0,0 105,250 Z', cx: 90, cy: 204, ix: 90, iy: 200, rot: -90 }
          ].map(zoneConfig => {
            const z = zonesMap.get(zoneConfig.id);
            const density = z?.density || 0;
            const status = z?.status || 'LOW';
            
            // Filtering logic
            if (activeFilter && status !== activeFilter) {
              return null;
            }

            const hasHighlight = highlights.includes(zoneConfig.id);
            const isIncident = activeIncidentZones.includes(zoneConfig.id);
            const baseColor = getBaseColor(density);

            return (
              <g 
                key={zoneConfig.id}
                onClick={() => handleItemClick(zoneConfig.id, zoneConfig.title, 'zone')}
                className="cursor-pointer group"
              >
                {/* Tiered Seating Banding Effect */}
                <path
                  d={zoneConfig.path}
                  fill={getDensityColor(density)}
                  fillOpacity={hasHighlight ? 1 : 0.8}
                  stroke={hasHighlight ? baseColor : isIncident ? '#ef4444' : '#1e293b'}
                  strokeWidth={hasHighlight ? 3 : isIncident ? 2 : 1}
                  className="transition-all duration-300 group-hover:brightness-125"
                  filter={hasHighlight ? 'url(#glow)' : ''}
                />
                
                {/* Visual seating tiers */}
                <path
                  d={zoneConfig.path}
                  fill="none"
                  stroke="#000"
                  strokeWidth="0.5"
                  strokeOpacity="0.2"
                  transform="scale(0.96) translate(8, 8)"
                />

                <title>{`${zoneConfig.title}\nDensity: ${density}%\nCapacity: ${z?.currentCount.toLocaleString()} / ${z?.capacity.toLocaleString()}`}</title>
                
                {isIncident && (
                  <circle cx={zoneConfig.ix} cy={zoneConfig.iy} r="6" fill="#ef4444" className="animate-live-pulse" />
                )}
                
                <text 
                  x={zoneConfig.cx} 
                  y={zoneConfig.cy} 
                  textAnchor="middle" 
                  fill="#f8fafc" 
                  fontSize="11" 
                  fontWeight="700" 
                  transform={zoneConfig.rot ? `rotate(${zoneConfig.rot}, ${zoneConfig.cx}, ${zoneConfig.cy - 4})` : ''}
                  className="tracking-widest"
                >
                  {zoneConfig.id.replace('-', ' ')}
                </text>
              </g>
            );
          })}

          {/* GATES */}
          {[
            { id: 'Gate-1', title: 'Gate 1 (North Entrance)', cx: 200, cy: 40 },
            { id: 'Gate-2', title: 'Gate 2 (East Entrance)', cx: 360, cy: 200 },
            { id: 'Gate-3', title: 'Gate 3 (South Entrance)', cx: 200, cy: 360 },
            { id: 'Gate-4', title: 'Gate 4 (West Entrance)', cx: 40, cy: 200 }
          ].map(gateConfig => {
            const g = gatesMap.get(gateConfig.id);
            const hasHighlight = highlights.includes(gateConfig.id);
            return (
              <g 
                key={gateConfig.id}
                onClick={() => handleItemClick(gateConfig.id, gateConfig.title, 'gate')}
                className="cursor-pointer group"
              >
                <circle
                  cx={gateConfig.cx}
                  cy={gateConfig.cy}
                  r="12"
                  fill={hasHighlight ? '#14b8a6' : '#0f172a'}
                  stroke={hasHighlight ? '#2dd4bf' : '#334155'}
                  strokeWidth={hasHighlight ? 2 : 1}
                  className="transition-all duration-300 group-hover:scale-110 group-hover:stroke-brand-teal"
                  filter={hasHighlight ? 'url(#glow)' : ''}
                />
                <text x={gateConfig.cx} y={gateConfig.cy + 3} textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
                  {gateConfig.id.split('-')[1]}
                </text>
                
                {g?.isADACompliant && (
                  <g transform={`translate(${gateConfig.cx + 8}, ${gateConfig.cy - 8})`}>
                    <circle r="5" fill="#38bdf8" stroke="#0B0F14" strokeWidth="1" />
                    <text y="2" textAnchor="middle" fill="#ffffff" fontSize="6" fontWeight="bold">♿</text>
                  </g>
                )}
                {hasHighlight && (
                  <circle cx={gateConfig.cx} cy={gateConfig.cy} r="18" fill="none" stroke="#14b8a6" strokeWidth="1" opacity="0.6" className="animate-ping" />
                )}
              </g>
            );
          })}

          {/* TRANSIT HUBS */}
          {[
            { id: 'Hub-1', title: 'Metro Station Central', x: 280, y: 20, label: 'METRO', type: 'Train (Zero Emission)', color: '#38bdf8' },
            { id: 'Hub-2', title: 'Bus Terminal West', x: 15, y: 270, label: 'BUS', type: 'Electric Shuttle (Zero Emission)', color: '#10b981' },
            { id: 'Hub-3', title: 'Rideshare Zone South', x: 230, y: 350, label: 'RIDE', type: 'Taxi/Rideshare', color: '#fb923c' }
          ].map(hub => {
            const hasHighlight = highlights.includes(hub.id);
            return (
              <g 
                key={hub.id}
                onClick={() => handleItemClick(hub.id, hub.title, 'transit')}
                className="cursor-pointer group"
              >
                <rect
                  x={hub.x}
                  y={hub.y}
                  width="40"
                  height="20"
                  rx="3"
                  fill={hasHighlight ? hub.color : '#0B0F14'}
                  stroke={hasHighlight ? '#fff' : '#334155'}
                  strokeWidth={hasHighlight ? 2 : 1}
                  className="transition-all duration-300 group-hover:border-slate-300"
                  filter={hasHighlight ? 'url(#glow)' : ''}
                />
                <text x={hub.x + 20} y={hub.y + 13} textAnchor="middle" fill={hasHighlight ? '#000' : hub.color} fontSize="7" fontWeight="800 tracking-wider">
                  {hub.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
});
