/**
 * @fileoverview useAdaptiveQuiz.test.js — Tests for adaptive logic.
 */

import { renderHook, act } from '@testing-library/react';
import useAdaptiveQuiz from '@/features/learning/hooks/useAdaptiveQuizAI';

import { AppProvider } from '@/shared/providers/AppProvider';

describe('useAdaptiveQuiz', () => {
  const wrapper = ({ children }) => <AppProvider>{children}</AppProvider>;
  it('fetchQuestion should call API and return data', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ question: 'Test?', options: ['A', 'B'], correctIndex: 0 }),
    });

    const { result } = renderHook(() => useAdaptiveQuiz(), { wrapper });
    
    let data;
    await act(async () => {
      data = await result.current.fetchQuestion();
    });

    expect(data.question).toBe('Test?');
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/quiz/generate'), expect.any(Object));
  });
});
