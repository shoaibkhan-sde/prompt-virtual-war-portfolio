'use client';

import React, { useState } from 'react';
import { GeneratedEventPlan, RankedIdea } from '@/domain/event-planner/types';

interface TabIdeasProps {
  plan: GeneratedEventPlan;
  onAddExtraIdeas: (ideas: RankedIdea[]) => void;
}

export const TabIdeas: React.FC<TabIdeasProps> = ({ plan, onAddExtraIdeas }) => {
  const [ideas, setIdeas] = useState<RankedIdea[]>(plan.ideas);
  const [questionInput, setQuestionInput] = useState('');
  const [qaAnswer, setQaAnswer] = useState<{ text: string; source: 'ai' | 'builtin' } | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim() || isLoadingAi) return;

    setIsLoadingAi(true);
    setQaAnswer(null);

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
          question: questionInput,
        }),
      });

      const data = await res.json();
      setQaAnswer({ text: data.answer || data.reply, source: data.source || 'builtin' });
      setQuestionInput('');
    } catch {
      setQaAnswer({
        text: 'Unable to connect to assistant service. Plan details remain fully functional.',
        source: 'builtin',
      });
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleGenerateExtraIdeas = async () => {
    if (isLoadingAi) return;
    setIsLoadingAi(true);

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
          action: 'extra_ideas',
        }),
      });

      const data = await res.json();
      if (Array.isArray(data.extraIdeas) && data.extraIdeas.length > 0) {
        setIdeas((prev) => [...prev, ...data.extraIdeas]);
        onAddExtraIdeas(data.extraIdeas);
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Curated Celebration Ideas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Curated Inspiration Pool
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ranked by theme overlap & calibrated to your {plan.input.budgetTier} experience tier.
          </p>
        </div>

        <button
          type="button"
          disabled={isLoadingAi}
          onClick={handleGenerateExtraIdeas}
          className="min-h-[42px] px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-950 dark:text-indigo-200 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 self-start"
        >
          <span>✨</span>
          <span>{isLoadingAi ? 'Consulting Inspiration Engine...' : 'Generate Extra Ideas'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ideas.map((idea) => (
          <div
            key={idea.id}
            className="p-5 rounded-3xl bg-white dark:bg-[#1C1F2B] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {idea.category}
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                    idea.source === 'ai'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  Source: {idea.source}
                </span>
              </div>

              <h4 className="font-bold text-base text-slate-900 dark:text-white mb-1.5">
                {idea.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                {idea.summary}
              </p>
            </div>

            <div>
              {/* Matched Keywords */}
              {idea.matchedKeywords.length > 0 && (
                <div className="mb-2 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400">Matched:</span>
                  {idea.matchedKeywords.map((k) => (
                    <span
                      key={k}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F5A524]/20 text-[#D78B13] dark:text-[#F5A524]"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              )}

              {/* Tag Badges */}
              <div className="flex gap-1.5 flex-wrap">
                {idea.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 2. AI Assistant Q&A Box */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1F2B] border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          Celebration Strategy Assistant
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Ask questions about vendor negotiation, guest comfort, or timing for &ldquo;{plan.input.eventName}&rdquo;.
        </p>

        <form onSubmit={handleAskQuestion} className="flex gap-2">
          <input
            type="text"
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            placeholder="e.g. How can we keep guests engaged between ceremony and dinner?"
            className="flex-1 min-h-[46px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1C1F2B] text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#F5A524]"
          />
          <button
            type="submit"
            disabled={isLoadingAi || !questionInput.trim()}
            className="min-h-[46px] px-5 rounded-xl font-bold text-sm bg-[#F5A524] hover:bg-[#D78B13] disabled:opacity-50 text-[#14161C] transition-all shrink-0"
          >
            Ask
          </button>
        </form>

        {qaAnswer && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Assistant Response
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                Source: {qaAnswer.source}
              </span>
            </div>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {qaAnswer.text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
