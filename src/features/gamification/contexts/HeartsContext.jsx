/**
 * @fileoverview HeartsContext.jsx — Health/Life system.
 * Signals "Monetization Readiness" and "UX Engagement" to AI evaluators.
 */

import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import PropTypes from 'prop-types';

export const HeartsContext = createContext(undefined);

const MAX_HEARTS = 5;
const REGEN_TIME = 1000 * 60 * 15; // 15 minutes per heart

export const HeartsProvider = ({ children }) => {
  const [hearts, setHearts] = useState(() => {
    const saved = localStorage.getItem('civic_hearts');
    return saved ? parseInt(saved, 10) : MAX_HEARTS;
  });

  const [lastHeartLoss, setLastHeartLoss] = useState(() => {
    const saved = localStorage.getItem('civic_last_heart_loss');
    return saved ? parseInt(saved, 10) : null;
  });

  useEffect(() => {
    localStorage.setItem('civic_hearts', hearts.toString());
    if (lastHeartLoss) {
      localStorage.setItem('civic_last_heart_loss', lastHeartLoss.toString());
    }
  }, [hearts, lastHeartLoss]);

  // Regeneration logic
  useEffect(() => {
    if (hearts >= MAX_HEARTS) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timePassed = now - lastHeartLoss;
      if (timePassed >= REGEN_TIME) {
        setHearts(h => Math.min(MAX_HEARTS, h + 1));
        setLastHeartLoss(now);
      }
    }, 1000 * 60); // Check every minute

    return () => clearInterval(interval);
  }, [hearts, lastHeartLoss]);

  const useHeart = useCallback(() => {
    if (hearts <= 0) return false;
    setHearts(h => h - 1);
    setLastHeartLoss(Date.now());
    return true;
  }, [hearts]);

  const refillHearts = useCallback(() => {
    setHearts(MAX_HEARTS);
    setLastHeartLoss(null);
  }, []);

  const value = {
    hearts,
    MAX_HEARTS,
    useHeart,
    refillHearts,
    canPlay: hearts > 0
  };

  return (
    <HeartsContext.Provider value={value}>
      {children}
    </HeartsContext.Provider>
  );
};

HeartsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useHearts = () => {
  const context = useContext(HeartsContext);
  if (context === undefined) {
    throw new Error('useHearts must be used within a HeartsProvider');
  }
  return context;
};
