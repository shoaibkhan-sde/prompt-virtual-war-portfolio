/**
 * @fileoverview Tests for useQuiz hook.
 * Covers initial state, answer selection, score tracking,
 * question advancement, and quiz reset.
 */

import { renderHook, act } from '@testing-library/react';
import useQuiz from '@/features/learning/hooks/useQuiz.js';
import { QUIZ_QUESTIONS } from '@/shared/utils/constants.js';

// Mock firebase to prevent initialization errors
jest.mock('@/firebase.js', () => ({
  auth: {},
  database: {},
  googleProvider: {},
}));

describe('useQuiz', () => {
  it('returns initial state with currentIndex=0, score=0, phase="playing"', () => {
    const { result } = renderHook(() => useQuiz());

    expect(result.current.state.currentIndex).toBe(0);
    expect(result.current.state.score).toBe(0);
    expect(result.current.state.selectedIndex).toBeNull();
    expect(result.current.state.phase).toBe('playing');
    expect(result.current.currentQuestion).toBe(QUIZ_QUESTIONS[0]);
    expect(result.current.totalQuestions).toBe(41);
  });

  it('selectAnswer with correct index increments score and transitions to "answered"', () => {
    const { result } = renderHook(() => useQuiz());
    const correctIndex = QUIZ_QUESTIONS[0].correctIndex;

    act(() => {
      result.current.selectAnswer(correctIndex);
    });

    expect(result.current.state.score).toBe(1);
    expect(result.current.state.selectedIndex).toBe(correctIndex);
    expect(result.current.state.phase).toBe('answered');
  });

  it('selectAnswer with wrong index does NOT increment score', () => {
    const { result } = renderHook(() => useQuiz());
    const correctIndex = QUIZ_QUESTIONS[0].correctIndex;
    const wrongIndex = correctIndex === 0 ? 1 : 0;

    act(() => {
      result.current.selectAnswer(wrongIndex);
    });

    expect(result.current.state.score).toBe(0);
    expect(result.current.state.phase).toBe('answered');
  });

  it('nextQuestion after answering advances currentIndex', () => {
    const { result } = renderHook(() => useQuiz());

    act(() => {
      result.current.selectAnswer(QUIZ_QUESTIONS[0].correctIndex);
    });
    act(() => {
      result.current.nextQuestion();
    });

    expect(result.current.state.currentIndex).toBe(1);
    expect(result.current.state.phase).toBe('playing');
    expect(result.current.state.selectedIndex).toBeNull();
  });

  it('nextQuestion on the last question transitions to "results" phase', () => {
    const { result } = renderHook(() => useQuiz());

    // Advance through all 10 questions
    act(() => {
      for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
        result.current.selectAnswer(0); // select first option each time
        result.current.nextQuestion();
      }
    });

    expect(result.current.state.phase).toBe('results');
  });

  it('resetQuiz returns to the initial state', () => {
    const { result } = renderHook(() => useQuiz());

    // Answer a question first
    act(() => {
      result.current.selectAnswer(QUIZ_QUESTIONS[0].correctIndex);
    });
    act(() => {
      result.current.nextQuestion();
    });

    act(() => {
      result.current.resetQuiz();
    });

    expect(result.current.state.currentIndex).toBe(0);
    expect(result.current.state.score).toBe(0);
    expect(result.current.state.selectedIndex).toBeNull();
    expect(result.current.state.phase).toBe('playing');
  });
});
