/**
 * @fileoverview useJourney.test.js — Tests for mission map logic.
 */

import { renderHook, act } from '@testing-library/react';
import useJourney from '@/features/learning/hooks/useJourney';
import { JOURNEY_STAGES } from '@/shared/utils/constants';

// Mock Firebase
jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  onValue: jest.fn((ref, callback) => {
    callback({ val: () => ({ announcement: true }) });
    return jest.fn(); // Unsubscribe
  }),
  update: jest.fn(),
}));

jest.mock('@/features/auth/hooks/useAuth', () => ({
  __esModule: true,
  default: () => ({ user: { uid: 'test-uid' } }),
}));

import { JourneyProvider } from '@/features/learning/contexts/JourneyContext';

describe('useJourney', () => {
  const wrapper = ({ children }) => <JourneyProvider>{children}</JourneyProvider>;

  it('should initialize with completed stages from Firebase', () => {
    // Note: JourneyContext uses localStorage by default. 
    // We should clear it to ensure clean tests.
    localStorage.clear();
    const { result } = renderHook(() => useJourney(), { wrapper });
    expect(result.current.completedStages).toEqual([]);
  });

  it('should identify the correct current stage', () => {
    const { result } = renderHook(() => useJourney(), { wrapper });
    // First stage is announcement
    expect(result.current.currentStage.id).toBe('announcement');
  });

  it('should correctly identify locked stages', () => {
    const { result } = renderHook(() => useJourney(), { wrapper });
    // nomination is locked because registration is not completed
    expect(result.current.isLocked('nomination')).toBe(true);
    // announcement is never locked
    expect(result.current.isLocked('announcement')).toBe(false);
  });
});
