// frontend/src/components/ZoneCard.jsx
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import {
  AlertCircle, Map as MapIcon, Zap,
  Shield, Trophy, Utensils, Star, Car,
  Armchair, Columns, LayoutGrid
} from 'lucide-react';

const STATUS_CONFIG = {
  low: { label: 'Low', bar: 'bg-emerald-500', glow: 'rgba(16,185,129,0.15)', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', text: 'text-emerald-500' },
  moderate: { label: 'Moderate', bar: 'bg-amber-500', glow: 'rgba(245,158,11,0.15)', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20', text: 'text-amber-500' },
  high: { label: 'High Density', bar: 'bg-orange-500', glow: 'rgba(249,115,22,0.15)', badge: 'bg-orange-500/10 text-orange-500 border-orange-500/20', text: 'text-orange-500' },
  critical: { label: 'Critical', bar: 'bg-rose-500', glow: 'rgba(239,68,68,0.2)', badge: 'bg-rose-500/10 text-rose-500 border-rose-500/30', text: 'text-rose-500' },
};

const ZONE_ICONS = {
  'north-stand': { Icon: Armchair, color: '#1a73e8' },
  'south-stand': { Icon: Armchair, color: '#1a73e8' },
  'east-wing': { Icon: Armchair, color: '#1a73e8' },
  'west-wing': { Icon: Armchair, color: '#1a73e8' },
  'food-court-north': { Icon: Utensils, color: '#ef4444' },
  'food-court-south': { Icon: Utensils, color: '#f97316' },
  'vip-lounge': { Icon: Star, color: '#eab308' },
  'parking-a': { Icon: Car, color: '#64748b' },
};

function Counter({ value }) {
  const nodeRef = useRef();
  useEffect(() => {
    const node = nodeRef.current;
    const controls = animate(
      parseInt(node.textContent.replace(/,/g, '')) || 0,
      value,
      {
        duration: 1.2,
        ease: [0.16, 1, 0.3, 1],
        onUpdate(v) { node.textContent = Math.round(v).toLocaleString(); },
      }
    );
    return () => controls.stop();
  }, [value]);
  return <span ref={nodeRef} />;
}

export const RENAME_MAP = {
  'East Wing': 'East Stand',
  'West Wing': 'West Stand',
  'South Food Court': 'South Food Hub',
  'North Food Court': 'North Food Hub',
  'Parking Lot A': 'Parking (Zone A)'
};

export default function ZoneCard({ zone, onRedirect, onViewMap }) {
  const { zoneId, name: rawName, currentOccupancy, capacity, density, status } = zone;
  const displayName = RENAME_MAP[rawName] || rawName;
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.low;
  const isCritical = status === 'critical';
  const isHigh = status === 'high';
  const pct = Math.min(density * 100, 100);
  const zoneIcon = ZONE_ICONS[zoneId] || { Icon: LayoutGrid, color: '#6b7280' };
  const { Icon: ZoneIcon, color: iconColor } = zoneIcon;
  const free = Math.max(0, capacity - currentOccupancy);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: isCritical
          ? 'linear-gradient(145deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.04) 100%)'
          : isHigh
            ? 'linear-gradient(145deg, rgba(249,115,22,0.08) 0%, rgba(249,115,22,0.04) 100%)'
            : undefined,
        border: isCritical
          ? '1.5px solid rgba(239,68,68,0.25)'
          : isHigh
            ? '1.5px solid rgba(249,115,22,0.2)'
            : '1.5px solid var(--border-main)',
        boxShadow: isCritical
          ? `0 4px 24px ${config.glow}, 0 1px 3px rgba(0,0,0,0.06)`
          : `0 4px 16px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.04)`,
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
      }}
      className={`group transition-all duration-500 ${isCritical ? '' : isHigh ? '' : 'bg-theme-card'
        }`}
    >
      {/* ── Critical pulsing top bar ─────────────────────── */}
      {isCritical && (
        <motion.div
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            background: 'linear-gradient(90deg, #ef4444, #f87171)',
            padding: '6px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <AlertCircle size={11} color="white" />
          <span style={{ fontSize: '9px', fontWeight: 900, color: 'white', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            At Capacity — Redirect Now
          </span>
        </motion.div>
      )}

      {/* ── Card body ────────────────────────────────────── */}
      <div style={{ padding: '20px 20px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Zone icon pill */}
            <div style={{
              width: '44px', height: '44px',
              borderRadius: '14px',
              background: isCritical ? 'rgba(239,68,68,0.08)' : `${iconColor}18`,
              border: isCritical ? '1px solid rgba(239,68,68,0.15)' : `1px solid ${iconColor}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <ZoneIcon size={20} color={isCritical ? '#ef4444' : iconColor} strokeWidth={2} />
            </div>
            <div>
              <h3 style={{
                fontSize: '14px', fontWeight: 900,
                color: 'var(--text-primary)',
                lineHeight: 1.2, marginBottom: '4px',
              }}>
                {displayName}
              </h3>
              {/* Status badge */}
              <span style={{
                fontSize: '9px', fontWeight: 900,
                textTransform: 'uppercase', letterSpacing: '0.15em',
                padding: '2px 8px', borderRadius: '999px',
                border: '1px solid',
              }} className={config.badge}>
                {config.label}
              </span>
            </div>
          </div>

          {/* Percentage pill */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px',
          }}>
            <span style={{
              fontSize: '22px', fontWeight: 900,
              lineHeight: 1,
            }} className={config.text}>
              {Math.round(pct)}%
            </span>
            <span style={{ fontSize: '9px', color: 'var(--text-secondary)', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              utilized
            </span>
          </div>
        </div>

        {/* Occupancy number */}
        <div style={{ marginBottom: '10px' }}>
          <span style={{
            fontSize: '32px', fontWeight: 900,
            letterSpacing: '-0.03em', lineHeight: 1,
          }} className={isCritical ? 'text-rose-500' : 'text-theme-primary'}>
            <Counter value={currentOccupancy} />
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.45, marginLeft: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Fans
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{
            height: '6px', borderRadius: '999px',
            background: 'var(--border-subtle)',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ height: '100%', borderRadius: '999px', position: 'relative' }}
              className={config.bar}
            >
              {/* Shimmer */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                animation: 'shimmer 2s infinite',
              }} />
            </motion.div>
          </div>
        </div>

        {/* Capacity row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', opacity: 0.45, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Cap {capacity.toLocaleString()}
          </span>
          <span style={{
            fontSize: '10px', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }} className={isCritical ? 'text-rose-500' : 'text-theme-secondary opacity-50'}>
            {free.toLocaleString()} free
          </span>
        </div>

        {/* ── Action buttons ─────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>

          {/* Redirect button */}
          <button
            onClick={() => onRedirect(zone)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '6px', padding: '10px 8px', borderRadius: '12px',
              border: isCritical ? '1.5px solid rgba(239,68,68,0.3)' : '1.5px solid rgba(99,102,241,0.15)',
              background: isCritical ? 'rgba(239,68,68,0.06)' : 'rgba(26,115,232,0.04)',
              cursor: 'pointer', transition: 'all 0.2s ease',
              fontSize: '10px', fontWeight: 900,
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}
            className={isCritical ? 'text-rose-500' : 'text-accent-blue'}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.background = isCritical ? '#f43f5e' : 'rgb(26, 115, 232)';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.boxShadow = isCritical
                ? '0 4px 12px rgba(239,68,68,0.25)'
                : '0 4px 12px rgba(26,115,232,0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = isCritical ? 'rgba(239,68,68,0.06)' : 'rgba(26,115,232,0.04)';
              e.currentTarget.style.color = isCritical ? '#f43f5e' : 'rgb(26, 115, 232)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Zap size={12} />
            Redirect
          </button>

          {/* Map button */}
          <button
            onClick={() => onViewMap(zoneId)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '6px', padding: '10px 8px', borderRadius: '12px',
              border: '1.5px solid rgba(16,185,129,0.2)',
              background: 'rgba(16,185,129,0.04)',
              cursor: 'pointer', transition: 'all 0.2s ease',
              fontSize: '10px', fontWeight: 900,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'rgb(16,185,129)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.background = 'rgb(16,185,129)';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.25)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = 'rgba(16,185,129,0.04)';
              e.currentTarget.style.color = 'rgb(16,185,129)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <MapIcon size={12} />
            Map
          </button>

        </div>
      </div>
    </motion.div>
  );
}