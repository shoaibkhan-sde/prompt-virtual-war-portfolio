import { renderHook, act, waitFor } from '@testing-library/react';
import useSageChat from '@/features/learning/hooks/useSageChat';

// Mock dependencies
jest.mock('@/features/auth/hooks/useAuth', () => () => ({
  user: { getIdToken: jest.fn().mockResolvedValue('mock-token') }
}));

jest.mock('@/features/gamification/hooks/useXP', () => () => ({
  xpState: { level: 5, xp: 1200 }
}));

jest.mock('@/features/learning/hooks/useJourney', () => () => ({
  currentStage: { id: 'registration', title: 'Voter Registration' }
}));

jest.mock('@/shared/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

// Mock fetch is handled in setup.js

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

describe('useSageChat Hook', () => {
  beforeEach(() => {
    global.fetch.mockReset();
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  test('should start with empty messages', () => {
    const { result } = renderHook(() => useSageChat());
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  test('sendMessage should add user message and fetch response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: 'Hello from Sage!', timestamp: new Date().toISOString() })
    });

    const { result } = renderHook(() => useSageChat());

    await act(async () => {
      await result.current.sendMessage('How do I register?');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].content).toBe('How do I register?');
    expect(result.current.messages[1].content).toBe('Hello from Sage!');
  });

  test('should handle API errors gracefully', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'AI Error' })
    });

    const { result } = renderHook(() => useSageChat());

    await act(async () => {
      await result.current.sendMessage('Error query');
    });

    await waitFor(() => {
      expect(result.current.error).toBe('AI Error');
    });
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].isError).toBe(true);
  });
});
