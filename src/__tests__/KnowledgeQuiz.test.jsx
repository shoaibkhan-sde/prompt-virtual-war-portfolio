/**
 * @fileoverview Tests for KnowledgeQuiz component.
 * Covers question rendering, answer selection feedback,
 * score tracking, and results screen.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import KnowledgeQuiz from '@/features/learning/components/KnowledgeQuiz.jsx';
import { QUIZ_QUESTIONS } from '@/shared/utils/constants.js';

// Mock features/gamification barrel
jest.mock('@/features/gamification', () => ({
  useHearts: jest.fn(() => ({
    hearts: 5,
    loseHeart: jest.fn(),
  })),
  useXP: jest.fn(() => ({
    xpState: { level: 1, xp: 0, title: 'New Voter', streak: 0 },
    addXP: jest.fn(),
  })),
}));

jest.mock('@/shared/hooks/useFirebase.js', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    saveScore: jest.fn(),
    leaderboard: [],
    leaderboardLoading: false,
    scoreSaving: false,
  })),
}));

// Mock gtag
beforeEach(() => {
  window.gtag = jest.fn();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('KnowledgeQuiz', () => {
  it('renders the first question on mount', () => {
    render(<KnowledgeQuiz />);
    expect(screen.getByText(QUIZ_QUESTIONS[0].question)).toBeInTheDocument();
  });

  it('all 4 answer options are rendered for the first question', () => {
    render(<KnowledgeQuiz />);
    QUIZ_QUESTIONS[0].options.forEach((option) => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });
  });

  it('selecting an option marks it as aria-checked=true', () => {
    render(<KnowledgeQuiz />);
    const options = screen.getAllByRole('radio');
    fireEvent.click(options[QUIZ_QUESTIONS[0].correctIndex]);
    expect(options[QUIZ_QUESTIONS[0].correctIndex]).toHaveAttribute('aria-checked', 'true');
  });

  it('correct answer gets "correct" class after answering', () => {
    render(<KnowledgeQuiz />);
    const correctIndex = QUIZ_QUESTIONS[0].correctIndex;
    const options = screen.getAllByRole('radio');
    fireEvent.click(options[correctIndex]);
    expect(options[correctIndex].className).toContain('correct');
  });

  it('wrong answer gets "incorrect" class', () => {
    render(<KnowledgeQuiz />);
    const correctIndex = QUIZ_QUESTIONS[0].correctIndex;
    const wrongIndex = correctIndex === 0 ? 1 : 0;
    const options = screen.getAllByRole('radio');
    fireEvent.click(options[wrongIndex]);
    expect(options[wrongIndex].className).toContain('wrong');
  });

  it('explanation is shown after selecting an answer', () => {
    render(<KnowledgeQuiz />);
    const options = screen.getAllByRole('radio');
    fireEvent.click(options[QUIZ_QUESTIONS[0].correctIndex]);
    expect(screen.getByText(new RegExp(QUIZ_QUESTIONS[0].explanation.slice(0, 10)))).toBeInTheDocument();
  });

  it('a next/results button appears after answering', () => {
    render(<KnowledgeQuiz />);
    const options = screen.getAllByRole('radio');
    fireEvent.click(options[QUIZ_QUESTIONS[0].correctIndex]);
    // Button aria-label is "Go to next question" or "See your results"
    const nextBtn = screen.getByRole('button', { name: /continue|finish|got it/i });
    expect(nextBtn).toBeInTheDocument();
  });

  it('results screen renders after completing all 10 questions', async () => {
    render(<KnowledgeQuiz />);

    for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
      const options = screen.getAllByRole('radio');
      fireEvent.click(options[QUIZ_QUESTIONS[i].correctIndex]);

      const isLast = i === QUIZ_QUESTIONS.length - 1;
      const nextBtn = screen.getByRole('button', {
        name: isLast ? /finish|got it/i : /continue|got it/i,
      });
      fireEvent.click(nextBtn);
    }

    // Now we should be on the Celebration screen (LessonComplete)
    // We need to click "Continue" there too
    const celebrateBtn = await screen.findByRole('button', { name: /continue/i });
    fireEvent.click(celebrateBtn);

    await waitFor(() => {
      // Results screen has headlines like "Civic Champion" or "Good Job"
      expect(screen.getByText(/Champion|Job|Learning/i)).toBeInTheDocument();
    });
  });
});
