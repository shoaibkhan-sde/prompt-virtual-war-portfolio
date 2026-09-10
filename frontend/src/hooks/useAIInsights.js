import { useMemo } from 'react';
import { useWaitTimes } from './useWaitTimes';
import { useCrowdData } from './useCrowdData';

/**
 * useAIInsights — Core logic engine for Venue Mission Control.
 * Derives actionable intelligence by comparing live simulation data points.
 */
export function useAIInsights() {
  const { zones, event_phase } = useWaitTimes();
  const { gates } = useCrowdData();

  const insights = useMemo(() => {
    const list = [];

    if (!zones.length || !gates.length) return list;

    // 1. Food Court Intelligence (Compare North vs South)
    const northFood = zones.find(z => z.zoneId === 'food-court-north');
    const southFood = zones.find(z => z.zoneId === 'food-court-south');

    if (northFood && southFood) {
      const northDensity = northFood.occupancy / northFood.capacity;
      const southDensity = southFood.occupancy / southFood.capacity;
      
      if (northDensity > southDensity + 0.15) {
        const diff = Math.round((northDensity - southDensity) * 100);
        list.push({
          id: 'food-redirect',
          type: 'success', // Green
          icon: '🟢',
          title: 'Move crowds to South Food Court',
          reasoning: `${diff}% less crowded than North · Est. wait 3 min vs 8 min`,
          importance: 2
        });
      }
    }

    // 2. Gate Congestion Intelligence (Compare N1 vs S2)
    const gateN1 = gates.find(g => g.gateId === 'gate-n1');
    const gateS2 = gates.find(g => g.gateId === 'gate-s2');

    if (gateN1 && gateS2 && gateN1.isOpen && gateS2.isOpen) {
      if (gateN1.queue > gateS2.queue + 80) {
        list.push({
          id: 'gate-redirect',
          type: 'error', // Red
          icon: '🔴',
          title: 'Close Gate N1 — redirect to Gate S2',
          reasoning: `Gate N1 queue: ${gateN1.queue} · Gate S2 queue: ${gateS2.queue} · Save ~6 min`,
          importance: 3
        });
      }
    }

    // 3. VIP Lounge Capacity Intelligence
    const vipLounge = zones.find(z => z.zoneId === 'vip-lounge');
    if (vipLounge) {
      const vipDensity = vipLounge.occupancy / vipLounge.capacity;
      if (vipDensity > 0.8) {
        list.push({
          id: 'vip-capacity',
          type: 'warning', // Yellow
          icon: '🟡',
          title: 'VIP Lounge approaching capacity',
          reasoning: `${Math.round(vipDensity * 100)}% full · Open overflow to West Wing Section C`,
          importance: 4
        });
      }
    }

    // 4. Strategic Prediction (Based on Event Phase)
    if (event_phase && event_phase.includes('Post-match')) {
      list.push({
        id: 'exodus-prediction',
        type: 'success', // Green
        icon: '🟢',
        title: 'Post-match exodus predicted in 18 min',
        reasoning: 'Pre-open Gates W1 + W2 now to distribute load',
        importance: 5
      });
    }

    // Sort by importance (highest first)
    return list.sort((a, b) => b.importance - a.importance);
  }, [zones, gates, event_phase]);

  return { insights };
}
