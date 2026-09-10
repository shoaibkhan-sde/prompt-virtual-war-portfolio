import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { ChatMessage, ChatAIResponse } from '../types';
import { Send, Compass, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';
import { motion } from 'framer-motion';

interface FanConciergeProps {
  onResponseReceived: (highlights: string[]) => void;
  accessibilityMode: boolean;
  setAccessibilityMode: (mode: boolean) => void;
  externalQuery?: string;
  onClearExternalQuery?: () => void;
}

export const FanConcierge: React.FC<FanConciergeProps> = ({
  onResponseReceived,
  accessibilityMode,
  externalQuery,
  onClearExternalQuery
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: 'Hello! I am your **Fanflow AI Concierge**. I monitor live crowd densities and gate updates to guide you safely around the venue.\n\nAsk me about routes, zero-emission transit, or toggle accessibility options above.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Quick query chips to make demo interactions fast and easy
  const quickChips = [
    { label: '🧭 Navigation', text: 'Where is the fastest and safest route to my stand based on current congestion?' },
    { label: '👥 Crowd Management', text: 'What is the current crowd density situation across the stadium right now?' },
    { label: '♿ Accessibility', text: 'Where can I find wheelchair ramp access and elevator paths?' },
    { label: '🚌 Transportation', text: 'How do I leave the stadium using green public transportation?' },
    { label: '♻️ Sustainability', text: 'What eco-friendly transit or waste guidelines are in place today?' },
    { label: '🌐 Multilingual Help', text: 'Hola, ¿puedes ayudarme en español? Querría saber el estado de las puertas.' },
    { label: '📊 Ops Intelligence', text: 'Are there any scanner breakdowns or volunteer logs reported?' },
    { label: '⚡ Decision Support', text: 'Should I enter through Gate-4 or Gate-1 right now considering capacity?' }
  ];

  const handleSendMessage = useCallback(async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': 'fanflow-demo-session'
        },
        body: JSON.stringify({
          message: textToSend,
          accessibilityMode: accessibilityMode
        })
      });

      if (!response.ok) {
        throw new Error('API server returned an error.');
      }

      const data: ChatAIResponse = await response.json();
      
      setMessages(prev => [...prev, { role: 'model', text: data.text }]);
      
      // Update highlights in parent component (StadiumMap updates)
      onResponseReceived(data.highlights);
    } catch (err: unknown) {
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          text: '⚠️ **System Notice**: Failed to communicate with Fanflow AI. Running offline. Please check your connectivity.'
        }
      ]);
    } finally {
      setIsLoading(false);
      // Auto refocus input for keyboard users
      chatInputRef.current?.focus();
    }
  }, [isLoading, accessibilityMode, onResponseReceived]);

  useEffect(() => {
    if (externalQuery) {
      setIsOpen(true);
      setInput(externalQuery);
      handleSendMessage(externalQuery);
      if (onClearExternalQuery) {
        onClearExternalQuery();
      }
    }
  }, [externalQuery, onClearExternalQuery, handleSendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  // Secure markdown rendering utilizing DOMPurify sanitization
  const SafeMarkdownMessage = ({ text }: { text: string }) => {
    const sanitized = useMemo(() => DOMPurify.sanitize(text), [text]);
    return (
      <div className="prose prose-invert max-w-none text-sm leading-relaxed text-emerald-50">
        <ReactMarkdown>{sanitized}</ReactMarkdown>
      </div>
    );
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
        <motion.button 
          onClick={() => setIsOpen(true)}
          animate={{
            y: ["0%", "-12%", "0%"]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          aria-label="Open Matchday Assistant AI Chat"
          className="h-20 w-20 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all focus:outline-none"
        >
          {/* Custom vector robot face from user image with animations */}
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_6px_12px_rgba(0,0,0,0.3)]">
            {/* Antenna Stick */}
            <line x1="50" y1="36" x2="50" y2="24" stroke="#a0a3a8" strokeWidth="4.5" strokeLinecap="round" />
            
            {/* Antenna Ball (Pulsing Cyan/Gray Glow) */}
            <motion.circle 
              cx="50" 
              cy="18" 
              r="7" 
              animate={{
                fill: ["#b5b8c0", "#00f5d4", "#b5b8c0"]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Left Ear */}
            <circle cx="19" cy="62" r="8" fill="#d1d5db" />
            {/* Right Ear */}
            <circle cx="81" cy="62" r="8" fill="#d1d5db" />

            {/* Head Outer body */}
            <rect x="20" y="40" width="60" height="44" rx="22" fill="#d1d5db" />

            {/* Visor Display */}
            <rect x="27" y="48" width="46" height="28" rx="14" fill="#1f2022" />

            {/* Glowing/Blinking Left Eye */}
            <motion.ellipse 
              cx="39" 
              cy="62" 
              rx="6.5" 
              animate={{
                ry: [6.5, 6.5, 0.5, 6.5, 6.5, 6.5, 6.5, 0.5, 6.5, 6.5]
              }}
              transition={{
                duration: 4.0,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              fill="#00f5d4" 
            />

            {/* Glowing/Blinking Right Eye */}
            <motion.ellipse 
              cx="61" 
              cy="62" 
              rx="6.5" 
              animate={{
                ry: [6.5, 6.5, 0.5, 6.5, 6.5, 6.5, 6.5, 0.5, 6.5, 6.5]
              }}
              transition={{
                duration: 4.0,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              fill="#00f5d4" 
            />
          </svg>
        </motion.button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-16 sm:bottom-20 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 h-[520px] max-h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-9.5rem)] z-50 shadow-2xl flex flex-col">
      <div className={`flex flex-col h-full border rounded-2xl bg-emerald-900 transition-all ${
        accessibilityMode ? 'border-lime-400 border-2' : 'border-emerald-800'
      }`}>
        {/* Top Header & Controls */}
        <div className="p-4 border-b border-emerald-800 flex items-center justify-between gap-3 bg-emerald-900/60 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="bg-lime-500/10 text-lime-400 p-2 rounded-xl border border-lime-500/20">
              <Compass size={18} />
            </div>
            <div>
              <h2 className="font-bold text-emerald-50 text-sm">Matchday Assistant</h2>
              <p className="text-[10px] text-emerald-300">Crowd-Aware AI</p>
            </div>
          </div>

          {/* Accessibility Panel conforming to WCAG AA guidelines */}
          <div className="flex items-center gap-2" role="group" aria-label="Accessibility settings">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Minimize Chat"
              className="text-xs p-1.5 rounded-lg border bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:text-emerald-100 hover:border-emerald-700/50 flex items-center justify-center"
            >
              <Minimize2 size={16} />
            </button>
          </div>
        </div>

        {/* Messages Window */}
        <div 
          className={`flex-1 p-4 overflow-y-auto space-y-4 min-h-[200px] ${
            accessibilityMode ? 'text-lg' : 'text-sm'
          } ${accessibilityMode ? 'bg-black' : 'bg-emerald-950/30'}`}
          role="log"
          aria-label="Chat messages history"
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 border transition-all ${
                  msg.role === 'user'
                    ? accessibilityMode
                      ? 'bg-emerald-100 text-emerald-900 border-white font-bold'
                      : 'bg-teal-600/10 text-teal-100 border-lime-500/20'
                    : accessibilityMode
                      ? 'bg-black text-white border-2 border-lime-400 font-medium'
                      : 'bg-emerald-900 text-emerald-100 border-emerald-800/80'
                }`}
              >
                {/* Semantic styling and markdown */}
                <div className="text-[10px] uppercase font-bold opacity-60 mb-1 flex items-center gap-1">
                  {msg.role === 'user' ? 'You' : 'Fanflow AI Concierge'}
                  {msg.role === 'model' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-lime-400"></span>
                  )}
                </div>
                
                {/* Screen reader live update container for the latest message */}
                <div 
                  aria-live={msg.role === 'model' && i === messages.length - 1 ? 'polite' : 'off'}
                  className="overflow-x-auto"
                >
                  <SafeMarkdownMessage text={msg.text} />
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-emerald-900 border border-emerald-800 rounded-2xl p-4 flex items-center gap-2">
                <span className="h-2 w-2 bg-lime-400 rounded-full animate-bounce"></span>
                <span className="h-2 w-2 bg-lime-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="h-2 w-2 bg-lime-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-xs text-emerald-300 ml-1">Analyzing crowd densities...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Query Chips */}
        <div className="px-4 py-2 bg-emerald-950/20 border-t border-emerald-800 flex gap-2 overflow-x-auto whitespace-nowrap">
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(chip.text)}
              disabled={isLoading}
              tabIndex={0}
              className={`text-[11px] px-3 py-1.5 rounded-full border bg-emerald-900 transition-all font-medium ${
                accessibilityMode
                  ? 'border-white text-white hover:bg-emerald-50 hover:text-emerald-900'
                  : 'border-emerald-800 text-emerald-200 hover:border-lime-500/40 hover:text-lime-400'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input Message Form */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-emerald-800 bg-emerald-900 rounded-b-2xl">
          <label htmlFor="concierge-chat-input" className="sr-only">
            Type your message for Fanflow AI Concierge
          </label>
          <div className="relative flex items-center bg-emerald-950 rounded-xl border border-emerald-800/80 focus-within:border-lime-500">
            <input
              id="concierge-chat-input"
              ref={chatInputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
              placeholder={
                accessibilityMode 
                  ? "Type query here (ADA Mode Active)..." 
                  : "Ask about gates, accessibility, transit routes..."
              }
              tabIndex={0}
              className="flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none text-emerald-50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              tabIndex={0}
              aria-label="Send message to AI Concierge"
              className="p-2 mr-1.5 text-lime-400 hover:text-teal-300 disabled:text-emerald-600 disabled:hover:text-emerald-600 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
