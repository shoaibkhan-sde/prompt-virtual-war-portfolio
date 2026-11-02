import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FloatingAIAssistant } from '@/components/ai/FloatingAIAssistant';
import { usePlannerStore } from '@/store/plannerStore';

describe('FloatingAIAssistant Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    usePlannerStore.getState().resetChat();
  });

  it('renders sticky "Ask AI" button in closed state', () => {
    render(<FloatingAIAssistant />);
    const askAiBtn = screen.getByRole('button', { name: /Ask AI assistant/i });
    expect(askAiBtn).toBeInTheDocument();
    expect(screen.getByText('Ask AI')).toBeInTheDocument();
  });

  it('opens chat window when "Ask AI" is clicked, and switches button to "Close chat"', async () => {
    const user = userEvent.setup();
    render(<FloatingAIAssistant />);

    await user.click(screen.getByRole('button', { name: /Ask AI assistant/i }));

    expect(screen.getByRole('region', { name: /Planning assistant chat/i })).toBeInTheDocument();
    expect(screen.getByText('Planning assistant')).toBeInTheDocument();
    expect(screen.getByText('Powered by Gemini')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Close AI assistant chat/i })).toBeInTheDocument();
  });

  it('displays default welcome message and suggestion chips', async () => {
    const user = userEvent.setup();
    render(<FloatingAIAssistant />);

    await user.click(screen.getByRole('button', { name: /Ask AI assistant/i }));

    expect(screen.getByText(/Hello! I am your planning assistant/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'How do I start planning?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'How is my budget split?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'What if my event is soon?' })).toBeInTheDocument();
  });

  it('submits a question and updates conversation', async () => {
    const user = userEvent.setup();
    render(<FloatingAIAssistant />);

    await user.click(screen.getByRole('button', { name: /Ask AI assistant/i }));

    const input = screen.getByPlaceholderText('Type your question');
    await user.type(input, 'What should I prioritize?');

    const sendBtn = screen.getByRole('button', { name: 'Send message' });
    await user.click(sendBtn);

    expect(screen.getByText('What should I prioritize?')).toBeInTheDocument();
  });

  it('resets chat when reload button is clicked', async () => {
    const user = userEvent.setup();
    render(<FloatingAIAssistant />);

    await user.click(screen.getByRole('button', { name: /Ask AI assistant/i }));

    const resetBtn = screen.getByRole('button', { name: 'Reset conversation' });
    await user.click(resetBtn);

    expect(screen.getByText(/Hello! I am your planning assistant/i)).toBeInTheDocument();
  });
});
