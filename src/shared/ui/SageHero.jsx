/**
 * @fileoverview SageHero — Character-led banner for the Journey Map.
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useXP } from '@/features/gamification';
import { useJourney } from '@/features/learning';

/**
 * Renders Sage the Mentor and their contextual dialogue.
 */
export default function SageHero() {
  const { xpState } = useXP();
  const { currentStage } = useJourney();

  const dialogue = useMemo(() => {
    if (xpState.level === 1) return `Welcome, future citizen! I'm Sage. Let's start your journey at the ${currentStage.title} stage! 🦉`;
    if (xpState.level < 4) return `You're doing great! You've reached Level ${xpState.level}. Ready to master the ${currentStage.title}?`;
    return `Greetings, ${xpState.title}! Your wisdom grows. Let's tackle the ${currentStage.title} together.`;
  }, [xpState, currentStage]);

  return (
    <div className="sage-hero">
      <div className="sage-avatar-wrapper">
        <div className="sage-avatar">🦉</div>
        <div className="sage-level-badge">Lvl {xpState.level}</div>
      </div>
      
      <div className="sage-content">
        <div className="sage-dialogue-bubble">
          {dialogue}
          <div className="bubble-tail" />
        </div>
        
        <div className="xp-progress-container">
          <div className="xp-info">
            <span className="xp-title">{xpState.title}</span>
            <span className="xp-values">{xpState.xp} XP</span>
          </div>
          <div className="xp-bar-bg">
            <div 
              className="xp-bar-fill" 
              style={{ width: `${xpState.progressToNext}%` }}
              aria-valuenow={xpState.progressToNext}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

SageHero.propTypes = {
  // Props would go here if any
};
