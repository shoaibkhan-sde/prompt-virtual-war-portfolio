/**
 * LeagueBadge — Shows current Civic League tier and weekly XP rank.
 * Modal is rendered via ReactDOM.createPortal into document.body to escape
 * any parent backdrop-filter / transform stacking context that traps fixed elements.
 */
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, TrendingUp } from 'lucide-react';
import { LEAGUES } from '@/shared/utils/leagues.js';
import { useXP } from '@/features/gamification';
import { Button } from '@/shared/ui/Button';

function LeagueBadge({ className = '' }) {
  const { xpState } = useXP();
  const [open, setOpen] = useState(false);
  const league = xpState.league || LEAGUES[0];

  const modal = open ? ReactDOM.createPortal(
    <div
      onClick={() => setOpen(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(2,6,23,0.80)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)',
          border: `1px solid ${league.color}55`,
          borderRadius: '24px',
          padding: '28px',
          maxWidth: '380px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: `0 24px 64px rgba(0,0,0,0.6), 0 0 40px ${league.glow}`,
          animation: 'slide-up 0.3s ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '36px', marginBottom: '6px' }}>{league.icon}</div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: league.color, margin: 0 }}>{league.name} League</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Resets every Monday · {xpState.weeklyXP || 0} XP this week
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            label="Close League Details"
            style={{ padding: '6px', flexShrink: 0 }}
          >
            <X size={20} />
          </Button>
        </div>

        {/* League tiers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {LEAGUES.map((tier) => {
            const isActive = tier.id === league.id;
            const isPast = xpState.xp >= tier.minXP;
            return (
              <div key={tier.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 14px', borderRadius: '12px',
                background: isActive ? `${tier.color}15` : 'var(--bg-elevated)',
                border: `1px solid ${isActive ? tier.color + '55' : 'var(--border-subtle)'}`,
              }}>
                <span style={{ fontSize: '20px' }}>{tier.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: isPast ? tier.color : 'var(--text-muted)' }}>
                    {tier.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tier.minXP.toLocaleString()} XP required</div>
                </div>
                {isActive && <span style={{ fontSize: '10px', fontWeight: '800', color: tier.color, background: `${tier.color}22`, padding: '2px 8px', borderRadius: '99px' }}>YOU</span>}
                {isPast && !isActive && <span style={{ fontSize: '14px' }}>✅</span>}
              </div>
            );
          })}
        </div>

        {/* Next league hint */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '12px 14px', borderRadius: '12px',
          background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
        }}>
          <TrendingUp size={15} style={{ color: 'var(--success)', flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Earn{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {Math.max(0,
                (LEAGUES[Math.min(LEAGUES.findIndex(l => l.id === league.id) + 1, LEAGUES.length - 1)]?.minXP ?? 0)
                - xpState.xp
              ).toLocaleString()}
            </strong>{' '}
            more XP to reach next league
          </span>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <Button
        variant="ghost"
        className={`league-badge-btn ${className}`}
        onClick={() => setOpen(true)}
        label={`View ${league.name} League Details`}
        title={`${league.name} League — ${xpState.weeklyXP || 0} XP this week`}
        style={{
          padding: '5px 10px', borderRadius: '99px',
          background: 'rgba(0,0,0,0.3)',
          border: `1px solid ${league.color}44`,
          boxShadow: `0 0 10px ${league.glow}`,
          color: league.color,
          fontSize: '13px', fontWeight: '700',
        }}
        onMouseOver={e => e.currentTarget.style.boxShadow = `0 0 18px ${league.glow}`}
        onMouseOut={e => e.currentTarget.style.boxShadow = `0 0 10px ${league.glow}`}
      >
        <span role="img" aria-label={league.name} style={{ fontSize: '15px' }}>{league.icon}</span>
        <span>{league.name}</span>
      </Button>

      {modal}
    </>
  );
}

export default LeagueBadge;
