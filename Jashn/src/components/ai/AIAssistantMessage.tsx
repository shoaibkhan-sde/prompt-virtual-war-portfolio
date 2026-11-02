'use client';

import React from 'react';
import { RobotIcon } from './RobotIcon';
import { ChatMessage } from '@/store/types';
import { Check, GitCompare } from 'lucide-react';
import { ScenarioSimulation } from '@/domain/types';

interface AIAssistantMessageProps {
  message: ChatMessage;
  isFirstAssistant: boolean;
  suggestions: string[];
  onSuggestionClick: (prompt: string) => void;
  onApplySimulation: (sim: ScenarioSimulation) => void;
  onCompareSimulation: (sim: ScenarioSimulation) => void;
}

export const AIAssistantMessage: React.FC<AIAssistantMessageProps> = ({
  message,
  isFirstAssistant,
  suggestions,
  onSuggestionClick,
  onApplySimulation,
  onCompareSimulation,
}) => {
  const isUser = message.sender === 'user';

  const renderText = (text: string) =>
    text.split('\n').map((line, lIdx) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={lIdx} className="block leading-relaxed">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-bold">{part.slice(2, -2)}</strong>;
            }
            return <React.Fragment key={pIdx}>{part}</React.Fragment>;
          })}
        </span>
      );
    });

  return (
    <div className="space-y-2">
      <div className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-[#1E1B4B] border border-[#F5A524]/60 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
            <RobotIcon size={19} />
          </div>
        )}

        <div
          className={`p-3.5 rounded-2xl text-sm ${
            isUser
              ? 'bg-[#2E2A7A] dark:bg-[#4338CA] text-white rounded-br-sm max-w-[85%] shadow-sm'
              : 'bg-white dark:bg-[#1E2130] text-slate-800 dark:text-slate-100 rounded-tl-sm max-w-[85%] shadow-sm border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          {renderText(message.text)}

          {!isUser && message.simulation && (
            <div className="flex gap-2 mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => onApplySimulation(message.simulation!)}
                className="min-h-[32px] px-3 rounded-lg bg-[#2E2A7A] hover:bg-[#1E1B4B] text-white text-xs font-semibold flex items-center gap-1 transition-transform active:scale-95 shadow-xs"
              >
                <Check size={13} />
                <span>Apply changes</span>
              </button>
              <button
                type="button"
                onClick={() => onCompareSimulation(message.simulation!)}
                className="min-h-[32px] px-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#1C1F2B] text-slate-800 dark:text-white text-xs font-semibold flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <GitCompare size={13} />
                <span>Compare</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {isFirstAssistant && (
        <div className="pl-10 space-y-2 pt-1">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSuggestionClick(s)}
              className="w-fit text-left px-4 py-2 rounded-full border border-[#2E2A7A]/30 dark:border-indigo-400/40 bg-white dark:bg-[#1E2130] text-[#2E2A7A] dark:text-indigo-200 text-xs font-semibold shadow-xs hover:border-[#F5A524] hover:bg-amber-50/70 dark:hover:bg-amber-950/25 transition-all cursor-pointer active:scale-95 block"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIAssistantMessage;
