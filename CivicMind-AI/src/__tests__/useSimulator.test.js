/**
 * @fileoverview useSimulator.test.js — Tests for candidate adventure.
 */

import { renderHook, act } from '@testing-library/react';
import useSimulator from '@/features/simulation/hooks/useSimulator';

jest.mock('@/features/auth/hooks/useAuth', () => ({
  __esModule: true,
  default: () => ({ user: { uid: 'test-uid' } }),
}));

describe('useSimulator', () => {
  it('should initialize with starting stats and budget', () => {
    const { result } = renderHook(() => useSimulator());
    expect(result.current.budget).toBe(500000);
    expect(result.current.stats.trust).toBe(40);
  });

  it('should update stats and budget after a decision', async () => {
    const { result } = renderHook(() => useSimulator());
    const choice = {
      id: 'test_choice',
      text: 'Test',
      cost: 5000,
      stats: { trust: 5, reach: 10 }
    };

    await act(async () => {
      result.current.makeDecision(choice);
    });

    expect(result.current.budget).toBe(495000);
    expect(result.current.stats.trust).toBe(45);
    expect(result.current.stats.reach).toBe(30);
  });

  it('should end the game after 30 days', async () => {
    const { result } = renderHook(() => useSimulator());
    
    // Simulate 30 days
    for (let i = 0; i < 30; i++) {
      await act(async () => {
        result.current.makeDecision({ id: 'c', text: 'c', cost: 0, stats: {} });
      });
    }

    expect(result.current.isGameOver).toBe(true);
    expect(result.current.phase).toBe('results');
  });
});
