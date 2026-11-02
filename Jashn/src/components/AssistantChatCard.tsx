'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { Send, Loader2, Sparkles, Check, GitCompare } from 'lucide-react';

export const AssistantChatCard: React.FC = () => {
  const {
    messages,
    isThinking,
    sendAssistantQuery,
    applySimulation,
    setActiveDiffSimulation,
  } = usePlannerStore();
  const [inputVal, setInputVal] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isThinking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isThinking) return;
    const query = inputVal;
    setInputVal('');
    await sendAssistantQuery(query);
  };

  const handleSuggestion = (prompt: string) => {
    setInputVal(prompt);
  };

  return (
    <section
      aria-labelledby="assistant-heading"
      className="card bg-white dark:bg-[#1C1F2B] border-2 border-[#C9C6F0] dark:border-[#5A53DA] rounded-2xl p-6 shadow-sm flex flex-col"
    >
      <div className="flex justify-between items-center gap-2 pb-3 border-b border-[#EEF0F6] dark:border-[#2C3040]">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-[#F5A524]" />
          <h2 id="assistant-heading" className="text-base font-bold text-[#14161C] dark:text-white">
            Planner assistant
          </h2>
        </div>
        <span className="chip px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EEF0F6] dark:bg-[#2C3040] text-[#3F4457] dark:text-[#C9CCD8]">
          Gemini + planner checks
        </span>
      </div>

      {/* Message History */}
      <div
        ref={chatContainerRef}
        aria-live="polite"
        className="mt-4 flex flex-col gap-3.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin"
      >
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col text-sm ${
                isUser ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`p-3.5 rounded-2xl max-w-[92%] leading-relaxed ${
                  isUser
                    ? 'bg-[#2E2A7A] dark:bg-[#5A53DA] text-white rounded-br-sm'
                    : 'bg-[#F3F3F8] dark:bg-[#242838] text-[#14161C] dark:text-white rounded-bl-sm border border-[#E6E7EE] dark:border-[#2C3040]'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>

                {/* Simulation Action Buttons */}
                {!isUser && m.simulation && (
                  <div className="flex gap-2 mt-3 pt-2.5 border-t border-[#D5D7E2] dark:border-[#3F4457]">
                    <button
                      type="button"
                      onClick={() => applySimulation(m.simulation!)}
                      className="min-h-[38px] px-3.5 rounded-xl bg-[#2E2A7A] dark:bg-[#5A53DA] hover:bg-[#1F1B58] dark:hover:bg-[#413AC2] text-white text-xs font-semibold flex items-center gap-1.5 transition-transform active:scale-95"
                    >
                      <Check size={14} />
                      <span>Apply changes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveDiffSimulation(m.simulation!)}
                      className="min-h-[38px] px-3 rounded-xl border border-[#D5D7E2] dark:border-[#3F4457] bg-white dark:bg-[#1C1F2B] text-[#14161C] dark:text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#F7F7FA] dark:hover:bg-[#2C3040]"
                    >
                      <GitCompare size={14} />
                      <span>Compare</span>
                    </button>
                  </div>
                )}
              </div>

              {!isUser && (
                <span className="text-[10px] text-[#5B6070] dark:text-[#7A8299] mt-1 px-1">
                  Source: {m.source === 'gemini' ? `Gemini (${m.modelUsed})` : 'Deterministic planner'}
                </span>
              )}
            </div>
          );
        })}

        {isThinking && (
          <div className="flex items-center gap-2 text-xs text-[#5B6070] dark:text-[#C9CCD8] p-2 bg-[#F3F3F8] dark:bg-[#242838] rounded-xl self-start">
            <Loader2 size={14} className="animate-spin text-[#2E2A7A] dark:text-[#F5A524]" />
            <span>Consulting celebration domain engine…</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts */}
      <div className="mt-3 flex gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => handleSuggestion('Cut 10% from the total but keep the photographer.')}
          className="text-[11px] font-medium bg-[#F7F7FA] dark:bg-[#242838] hover:bg-[#E4E2FA] dark:hover:bg-[#1F1B58] text-[#2E2A7A] dark:text-[#C9C6F0] px-2.5 py-1 rounded-full border border-[#E6E7EE] dark:border-[#2C3040] transition-colors"
        >
          Cut 10% (keep photo)
        </button>
        <button
          type="button"
          onClick={() => handleSuggestion('Suggest vegetarian menu items for 200 guests.')}
          className="text-[11px] font-medium bg-[#F7F7FA] dark:bg-[#242838] hover:bg-[#E4E2FA] dark:hover:bg-[#1F1B58] text-[#2E2A7A] dark:text-[#C9C6F0] px-2.5 py-1 rounded-full border border-[#E6E7EE] dark:border-[#2C3040] transition-colors"
        >
          Menu ideas
        </button>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 mt-3">
        <label htmlFor="ask" className="sr-only">
          Ask about budget, vendors, ideas…
        </label>
        <input
          id="ask"
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Ask about budget, vendors, ideas…"
          disabled={isThinking}
          className="flex-1 min-h-[44px] border border-[#D5D7E2] dark:border-[#3F4457] rounded-xl px-3.5 text-sm bg-white dark:bg-[#14161C] text-[#14161C] dark:text-white placeholder:text-[#5B6070] dark:placeholder:text-[#7A8299] focus:outline-none focus:ring-2 focus:ring-[#2E2A7A] dark:focus:ring-[#5A53DA]"
        />
        <button
          type="submit"
          disabled={!inputVal.trim() || isThinking}
          className="min-h-[44px] px-4 rounded-xl bg-[#2E2A7A] dark:bg-[#5A53DA] hover:bg-[#1F1B58] dark:hover:bg-[#413AC2] text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center transition-all active:scale-95 shadow-sm"
        >
          {isThinking ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          <span className="sr-only">Send</span>
        </button>
      </form>
    </section>
  );
};
