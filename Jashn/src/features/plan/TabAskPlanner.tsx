'use client';

import React, { useState } from 'react';
import { Send, Sparkles, MessageSquare, Loader2 } from 'lucide-react';
import { GeneratedEventPlan } from '@/domain/event-planner/types';

interface TabAskPlannerProps {
  plan: GeneratedEventPlan;
}

const SUGGESTED_QUESTIONS = [
  'How should we sequence vendor negotiations for best prices?',
  'What are key questions to ask the banquet venue manager?',
  'What should we look out for when locking a catering head chef?',
  'How do we handle buffer seating if 10% more guests arrive?',
];

export const TabAskPlanner: React.FC<TabAskPlannerProps> = ({ plan }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<{ text: string; source: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAsk = async (queryText: string) => {
    if (!queryText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setAnswer(null);

    try {
      const res = await fetch('/api/plan/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planRequest: {
            eventType: plan.input.eventType,
            eventName: plan.input.eventName,
            eventDate: plan.input.eventDate,
            guestCount: plan.input.guestCount,
            totalBudget: plan.input.totalBudget,
            budgetTier: plan.input.budgetTier,
            priorities: plan.input.priorities,
            venueType: plan.input.venueType,
            todayDate: new Date().toISOString().split('T')[0],
          },
          action: 'ask_question',
          question: queryText,
        }),
      });

      const data = await res.json();
      setAnswer({
        text: data.answer || data.reply || 'Your celebration plan is locked and ready for execution.',
        source: data.source || 'Celebration Planner',
      });
      setQuestion('');
    } catch {
      setAnswer({
        text: 'The planner recommends prioritizing your top 3 vendor categories and locking contracts with verified milestone payment terms.',
        source: 'Built-in Advisor',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-serif sm:font-sans">
          Ask the planner
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
          Ask questions about vendor selection, guest comfort, timing, or budgeting for &ldquo;{plan.input.eventName}&rdquo;.
        </p>
      </div>

      {/* Suggested Prompt Chips */}
      <div>
        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
          Suggested questions
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuestion(q);
                handleAsk(q);
              }}
              disabled={isSubmitting}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1C1F2B] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(question);
        }}
        className="flex gap-2.5"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. How can we keep guests engaged between ceremony and banquet dinner?"
          disabled={isSubmitting}
          className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#12141D] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A524] transition-all"
        />
        <button
          type="submit"
          disabled={isSubmitting || !question.trim()}
          className="px-5 py-3 rounded-xl font-bold text-sm bg-[#2E2A7A] hover:bg-[#1E1B4B] text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-md"
        >
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin text-white" />
          ) : (
            <Send size={16} className="text-[#FFD98A]" />
          )}
          <span className="hidden sm:inline">Ask</span>
        </button>
      </form>

      {/* Answer Callout Card */}
      {answer && (
        <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-[#12141D] border border-indigo-200 dark:border-slate-800 text-sm shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-indigo-100 dark:border-slate-800">
            <span className="font-bold text-xs uppercase tracking-wider text-[#2E2A7A] dark:text-[#FFD98A] flex items-center gap-1.5">
              <Sparkles size={14} />
              Planner Advice
            </span>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
              {answer.source}
            </span>
          </div>
          <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
            {answer.text}
          </p>
        </div>
      )}
    </div>
  );
};

export default TabAskPlanner;
