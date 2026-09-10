/**
 * @fileoverview Civic League tiers — Duolingo-style XP progression leagues.
 * Leagues reset weekly (Monday midnight).
 */

export const LEAGUES = [
  { id: 'bronze',   name: 'Bronze',   minXP: 0,    color: '#CD7F32', icon: '🥉', glow: 'rgba(205,127,50,0.25)' },
  { id: 'silver',   name: 'Silver',   minXP: 300,  color: '#94a3b8', icon: '🥈', glow: 'rgba(148,163,184,0.25)' },
  { id: 'gold',     name: 'Gold',     minXP: 800,  color: '#fbbf24', icon: '🥇', glow: 'rgba(251,191,36,0.25)' },
  { id: 'platinum', name: 'Platinum', minXP: 2000, color: '#a78bfa', icon: '💎', glow: 'rgba(167,139,250,0.25)' },
  { id: 'diamond',  name: 'Diamond',  minXP: 5000, color: '#67e8f9', icon: '💠', glow: 'rgba(103,232,249,0.25)' },
];

/**
 * Get the league object for a given total XP.
 * @param {number} xp
 * @returns {typeof LEAGUES[0]}
 */
export function getLeague(xp) {
  let league = LEAGUES[0];
  for (const tier of LEAGUES) {
    if (xp >= tier.minXP) league = tier;
    else break;
  }
  return league;
}

/** Daily XP goal (≈ 1 lesson or challenge). */
export const DAILY_GOAL_XP = 100;

/** Max hearts. */
export const MAX_HEARTS = 5;

/** Milliseconds between heart refills (5 minutes). */
export const HEART_REFILL_MS = 5 * 60 * 1000;
