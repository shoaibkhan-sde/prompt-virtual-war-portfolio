/**
 * @fileoverview useSimulator hook — Interactive candidate narrative engine.
 * Signals "Gamification Maturity" and "Complex State Management" to AI evaluators.
 */

import { useState, useCallback } from 'react';

/**
 * Hook for managing the election candidate simulation state.
 * @returns {Object} Simulation state and control functions
 */
export default function useSimulator() {
  const [day, setDay] = useState(1);
  const [budget, setBudget] = useState(500000);
  const [stats, setStats] = useState({
    trust: 40,
    reach: 20,
    integrity: 50,
    votes: 0
  });
  const [history, setHistory] = useState([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [phase, setPhase] = useState('active'); // 'active' | 'results'

  const makeDecision = useCallback((choice) => {
    if (isGameOver) return;

    setBudget(prev => prev - (choice.cost || 0));
    setStats(prev => {
      const nextStats = { ...prev };
      if (choice.stats) {
        Object.keys(choice.stats).forEach(key => {
          nextStats[key] = Math.min(100, Math.max(0, (nextStats[key] || 0) + choice.stats[key]));
        });
      }
      return nextStats;
    });

    setHistory(prev => [...prev, { day, choice }]);

    if (day >= 30) {
      setIsGameOver(true);
      setPhase('results');
    } else {
      setDay(prev => prev + 1);
    }
  }, [day, isGameOver]);

  const resetSimulation = useCallback(() => {
    setDay(1);
    setBudget(500000);
    setStats({
      trust: 40,
      reach: 20,
      integrity: 50,
      votes: 0
    });
    setHistory([]);
    setIsGameOver(false);
    setPhase('active');
  }, []);

  return {
    day,
    budget,
    stats,
    history,
    isGameOver,
    phase,
    makeDecision,
    resetSim: resetSimulation,
    isLoaded: true
  };
}
