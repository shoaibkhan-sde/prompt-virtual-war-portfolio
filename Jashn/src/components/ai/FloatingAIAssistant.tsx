'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { RobotIcon } from './RobotIcon';
import { AIAssistantMessage } from './AIAssistantMessage';
import { RotateCcw, X, Send, Loader2 } from 'lucide-react';

import { convertGeneratedToCelebrationPlan } from '@/domain/plan-utils';

const SUGGESTIONS = [
  'How do I start planning?',
  'How is my budget split?',
  'What if my event is soon?',
];

export const FloatingAIAssistant: React.FC = () => {
  const { messages, isThinking, sendAssistantQuery, setMessages, resetChat, applySimulation, setActiveDiffSimulation } =
    usePlannerStore();

  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Restore stored chat messages & user-created plan from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('jashn.ai_chat_messages');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      }
      const rawStoredPlan = localStorage.getItem('jashn.pure_event_plan');
      if (rawStoredPlan) {
        const parsedPlan = JSON.parse(rawStoredPlan);
        if (parsedPlan && parsedPlan.id && parsedPlan.input && !parsedPlan.id.startsWith('sample-')) {
          usePlannerStore.getState().syncUserPlan(convertGeneratedToCelebrationPlan(parsedPlan));
        }
      }
    } catch {}
  }, [setMessages]);

  useEffect(() => {
    if (isOpen && chatContainerRef.current) {
      if (typeof chatContainerRef.current.scrollTo === 'function') {
        chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
      } else {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }
  }, [messages, isThinking, isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputVal.trim();
    if (!query || isThinking) return;
    setInputVal('');
    await sendAssistantQuery(query);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 print:hidden">
      {/* Open Chat Screen Card */}
      {isOpen && (
        <section
          aria-label="Planning assistant chat"
          className="w-[360px] sm:w-[380px] h-[530px] max-h-[calc(100vh-120px)] bg-white dark:bg-[#181B28] rounded-3xl shadow-2xl border border-indigo-200/80 dark:border-indigo-950 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#17153B] via-[#2E2A7A] to-[#1E1B4B] p-4 text-white flex items-center justify-between border-b border-[#F5A524]/30 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#17153B] border-2 border-[#F5A524] flex items-center justify-center shrink-0 shadow-sm">
                <RobotIcon size={22} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white text-base leading-tight font-serif sm:font-sans">
                  Planning assistant
                </h2>
                <p className="text-xs text-[#FFD98A] leading-tight mt-0.5">
                  Powered by Gemini
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetChat}
                title="Reset chat"
                aria-label="Reset conversation"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all text-white border border-white/20"
              ><RotateCcw size={16} /></button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                aria-label="Close assistant chat"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all text-white border border-white/20"
              ><X size={19} /></button>
            </div>
          </div>

          {/* Messages Body */}
          <div
            ref={chatContainerRef}
            tabIndex={0}
            role="region"
            aria-label="Chat messages history"
            className="bg-[#F8F8FC] dark:bg-[#12141F] flex-1 overflow-y-auto p-4 space-y-3.5 focus:outline-none"
          >
            {messages.map((m, idx) => (
              <AIAssistantMessage
                key={m.id}
                message={m}
                isFirstAssistant={m.sender === 'assistant' && idx === 0}
                suggestions={SUGGESTIONS}
                onSuggestionClick={(s) => sendAssistantQuery(s)}
                onApplySimulation={applySimulation}
                onCompareSimulation={setActiveDiffSimulation}
              />
            ))}

            {isThinking && (
              <div className="flex items-center gap-2 pl-10 text-xs text-[#2E2A7A] dark:text-[#FFD98A]">
                <Loader2 size={15} className="animate-spin text-[#F5A524]" />
                <span>Consulting celebration domain engine…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-white dark:bg-[#181B28] border-t border-slate-200/80 dark:border-slate-800">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <label htmlFor="ai-chat-input" className="sr-only">Type your question</label>
              <div className="flex-1 rounded-full border-2 border-[#2E2A7A] dark:border-indigo-400 ring-2 ring-[#F5A524]/20 bg-white dark:bg-[#12141F] px-4 py-2 shadow-xs transition-all focus-within:ring-[#F5A524]/60">
                <input
                  id="ai-chat-input"
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Type your question"
                  disabled={isThinking}
                  className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={!inputVal.trim() || isThinking}
                aria-label="Send message"
                className="w-10 h-10 rounded-full bg-[#F5A524] hover:bg-[#E09217] active:scale-95 text-[#14161C] flex items-center justify-center shrink-0 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold"
              >
                <Send size={17} className="-ml-0.5 text-[#14161C]" />
              </button>
            </form>

            <span className="text-[11px] text-center text-slate-500 dark:text-slate-400 mt-2 block">
              AI can make mistakes. Check important details.
            </span>
          </div>
        </section>
      )}

      {/* Floating Sticky Toggle Button */}
      {isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close AI assistant chat"
          className="bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white font-semibold text-sm px-5 py-2.5 rounded-full flex items-center gap-2 shadow-xl shadow-indigo-600/20 cursor-pointer active:scale-95 transition-all duration-200 border border-indigo-500/40"
        >
          <X size={17} strokeWidth={2.5} />
          <span>Close chat</span>
        </button>
      ) : (
        <div className="relative group">
          {/* Soft ambient pulsing glow */}
          <div
            aria-hidden="true"
            className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 opacity-50 blur-md group-hover:opacity-85 animate-pulse transition duration-500 pointer-events-none"
          />

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Ask AI assistant"
            className="relative bg-gradient-to-r from-slate-900 via-[#1C1848] to-[#2E2A7A] hover:from-slate-800 hover:to-indigo-900 text-white pl-4 pr-5 py-2.5 rounded-full flex items-center gap-2.5 font-semibold text-sm border border-indigo-400/40 shadow-2xl shadow-indigo-500/20 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <div className="relative flex items-center justify-center">
              <RobotIcon size={20} className="text-indigo-200 group-hover:text-white transition-colors" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#F5A524] ring-1 ring-white/60 animate-ping opacity-75" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#F5A524] ring-1 ring-white/60" />
            </div>
            <span className="font-semibold tracking-wide">Ask AI</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FloatingAIAssistant;
