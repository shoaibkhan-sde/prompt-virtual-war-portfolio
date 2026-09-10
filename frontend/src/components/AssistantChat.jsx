import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../socket';
import { ArrowUp, Bot, Sparkles, User, ChevronDown } from 'lucide-react';

export default function AssistantChat({ messages = [], setMessages }) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const textareaRef = useRef(null);
  const listRef = useRef(null);

  const getISTGreeting = () => {
    try {
      // Fetch time directly in IST regardless of local system timezone
      const hourStr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        hourCycle: 'h23'
      }).format(new Date());

      const hour = parseInt(hourStr, 10);
      if (hour >= 5 && hour < 12) return 'Good Morning';
      if (hour >= 12 && hour < 17) return 'Good Afternoon';
      return 'Good Evening';
    } catch (e) {
      return 'Welcome'; // Fallback
    }
  };

  const greeting = getISTGreeting();

  const isInitialMount = useRef(true);

  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    // Show button if user is more than 300px away from the bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 300;
    setShowScrollButton(!isAtBottom);
  };

  const scrollToBottom = () => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      if (isInitialMount.current) {
        // Snap immediately to bottom on mount (avoiding the 'scrolling from top' look)
        listRef.current.scrollTop = listRef.current.scrollHeight;
        isInitialMount.current = false;
      } else {
        // Smooth scroll for new incoming messages
        listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages]);

  useEffect(() => {
    const handleReply = (data) => {
      setMessages((prev) => [...prev, {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        text: data.text || 'No response.',
        options: data.options || [],
        zoneId: data.zone_id // Metadata captured from backend
      }]);
      setSending(false);
    };
    socket.on('chat_reply', handleReply);
    return () => socket.off('chat_reply', handleReply);
  }, []);

  // ── Contextual Orchestration — Handle Redirect Actions ─────────────────────
  useEffect(() => {
    const processQueuedMessage = () => {
      const queued = localStorage.getItem('venueflow_queued_message');
      const queuedZone = localStorage.getItem('venueflow_focus_zone');
      if (queued) {
        localStorage.removeItem('venueflow_queued_message');
        // If we have a zone in context, we keep it for now
        sendMessage(queued);
      }
    };

    // 1. Check on mount (in case tab switched from outside)
    processQueuedMessage();

    // 2. Listen for live events if already mounted
    const handleAction = (e) => {
      const { message, tab, zoneId } = e.detail;
      if (zoneId) localStorage.setItem('venueflow_focus_zone', zoneId);

      if (message) {
        // Delay slightly to allow the "Ask AI" tab animation to settle
        setTimeout(() => sendMessage(message), 400);
      }
    };

    window.addEventListener('venueflow:action', handleAction);
    return () => window.removeEventListener('venueflow:action', handleAction);
  }, []);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const sendMessage = (text, hiddenToken = '') => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const displayMsg = trimmed.replace(/\[CONTEXT_REDIRECT\] /g, ''); // Safety strip

    setMessages((prev) => [...prev, {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      text: displayMsg
    }]);

    setInput('');
    setSending(true);

    // The socket gets the full context, but the UI stays clean
    socket.emit('chat_message', { message: hiddenToken ? `${hiddenToken} ${trimmed}` : trimmed });

    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const suggestions = [
    { label: "Find best gate", icon: "🚪" },
    { label: "Open venue map", icon: "📍" },
    { label: "Crowd density", icon: "🔥" },
    { label: "Food zones", icon: "🍔" },
  ];

  // Renders Markdown-lite: **bold**, *italic*, newlines → clean JSX (no raw asterisks)
  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, lineIdx, arr) => {
      // Split on **bold** and *italic* tokens
      const tokens = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
      const rendered = tokens.map((token, i) => {
        if (token.startsWith('**') && token.endsWith('**'))
          return <strong key={i} className="font-semibold">{token.slice(2, -2)}</strong>;
        if (token.startsWith('*') && token.endsWith('*'))
          return <em key={i}>{token.slice(1, -1)}</em>;
        return <span key={i}>{token}</span>;
      });
      return (
        <span key={lineIdx}>
          {rendered}
          {lineIdx < arr.length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-theme-page font-sans selection:bg-accent-blue/10 overflow-hidden">
      <header className="px-4 md:px-8 py-4 sm:py-5 flex items-center justify-between bg-transparent border-b border-theme-main shrink-0">
        <div className="flex items-center gap-2 cursor-default">
          <Bot size={22} className="text-accent-blue" />
          <span className="text-[12px] sm:text-sm font-black tracking-tight text-theme-primary uppercase">VenueFlow</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 overflow-hidden relative">
        {messages.length === 0 ? (
          <div className="w-full max-w-3xl flex flex-col items-center pt-12 sm:pt-20 flex-1 pb-12 sm:pb-20 gap-y-8 sm:gap-y-12 overflow-y-auto overscroll-contain no-scrollbar">
            <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-[18px] sm:text-[22px] text-theme-secondary font-normal">{greeting}</h2>
              <h1 className="text-3xl sm:text-5xl font-bold text-theme-primary mt-2 tracking-tight leading-tight">
                How can I help <br className="sm:hidden" /> you today?
              </h1>
            </div>

            <div className="relative w-full shrink-0 min-h-[140px] sm:min-h-[180px] group">
              {/* Visual layer: flat rectangle bg — no rounded corners, no clipping */}
              <div className="absolute inset-0 rounded-xl bg-theme-card border border-theme-main shadow-sm group-focus-within:shadow-xl transition-all duration-300 pointer-events-none" />
              {/* Textarea: transparent bg, sits on top of visual layer */}
              <textarea
                ref={textareaRef}
                rows="1"
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
                placeholder="Ask VenueFlow..."
                className="relative z-10 w-full min-h-[140px] sm:min-h-[180px] px-6 py-5 pb-16 bg-transparent outline-none text-lg sm:text-xl text-theme-primary placeholder:text-theme-secondary resize-none overflow-y-auto"
              />
              <div className="absolute z-20 bottom-4 sm:bottom-5 right-4 sm:right-5">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    scale: input.trim() ? 1 : 0.95
                  }}
                  onClick={() => sendMessage(input)}
                  aria-label="Send message"
                  className={`p-2.5 rounded-full transition-all duration-300 shadow-sm ${input.trim()
                    ? "bg-accent-blue text-white hover:bg-blue-700 shadow-lg"
                    : "bg-theme-main text-theme-secondary opacity-40 cursor-default"
                    }`}
                >
                  <ArrowUp size={18} />
                </motion.button>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 w-full">
              {suggestions.map((item, i) => (
                <motion.button
                  key={`suggest-${i}`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => sendMessage(item.label)}
                  className="flex items-center gap-3 sm:gap-4 px-8 sm:px-11 py-5 sm:py-6 rounded-full bg-theme-card/40 backdrop-blur-xl border border-theme-main text-[15px] sm:text-[17px] font-medium text-theme-primary cursor-pointer shadow-sm hover:border-accent-blue/50 hover:shadow-[0_0_25px_rgba(59,130,246,0.12)] transition-colors duration-300 active:bg-theme-card/80"
                >
                  <span className="text-xl sm:text-2xl drop-shadow-sm">{item.icon}</span>
                  <span className="font-semibold tracking-tight">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-3xl flex flex-col flex-1 min-h-0 relative">
            <div
              ref={listRef}
              onScroll={handleScroll}
              className="flex-1 min-h-0 overflow-y-auto pt-4 sm:pt-6 pb-8 sm:pb-12 flex flex-col gap-y-10 sm:gap-y-16 scrollbar-hide px-2 sm:px-4 overscroll-contain"
              role="log"
              aria-live="polite"
              aria-relevant="additions"
            >
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex py-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 sm:gap-4 max-w-[90%] sm:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-accent-blue text-white' : 'bg-theme-card border border-theme-main text-accent-blue'}`}>
                        {msg.role === 'user' ? <User className="w-4 h-4 sm:w-5 sm:h-5" /> : <Bot className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </div>
                      <div className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg shadow-sm text-[14px] sm:text-[15px] leading-relaxed ${msg.role === 'user' ? 'bg-accent-blue text-white rounded-tr-none' : 'bg-theme-card border border-theme-main text-theme-primary rounded-tl-none'}`}>
                        <div className="font-medium whitespace-pre-wrap leading-relaxed">
                          {msg.role === 'assistant' ? renderMarkdown(msg.text) : msg.text}
                        </div>

                        {/* ── AI Action Options ──────────────────────────────── */}
                        {msg.role === 'assistant' && msg.options && msg.options.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-theme-main/10">
                            {msg.options.map((opt, i) => (
                              <button
                                key={`opt-${msg.id}-${i}`}
                                onClick={() => {
                                  sendMessage(opt);
                                  // Intercept Navigation requests
                                  if (opt.toLowerCase().includes('direction') || opt.toLowerCase().includes('map')) {
                                    if (msg.zoneId) localStorage.setItem('venueflow_focus_zone', msg.zoneId);

                                    // Use a small delay for better UX flow
                                    setTimeout(() => {
                                      window.dispatchEvent(new CustomEvent('venueflow:action', {
                                        detail: { tab: 'map', zoneId: msg.zoneId }
                                      }));
                                    }, 800);
                                  }
                                }}
                                className="px-4 py-2 rounded-full bg-accent-blue/5 border border-theme-main text-[11px] font-bold text-accent-blue hover:bg-theme-primary hover:text-theme-card hover:border-theme-primary hover:scale-105 transition-all duration-300 active:scale-95 shadow-sm"
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {sending && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="flex gap-4 items-center pl-14">
                      <div className="flex gap-1.5 bg-theme-main/50 p-2.5 rounded-full">
                        <div className="w-1.5 h-1.5 bg-theme-secondary rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-theme-secondary rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-theme-secondary rounded-full animate-bounce" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Reliable spacer block to force margin at the bottom of the scroll container */}
              <div className="h-6 sm:h-10 w-full shrink-0" />
            </div>

            <div className="pt-3 pb-8 sm:pb-10 px-1 shrink-0">
              <div className="relative group">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                  onFocus={(e) => {
                    // Minor UX improvement: scroll into view on focus if keyboard covers
                    setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'end' }), 300);
                  }}
                  placeholder="Reply here..."
                  className="w-full px-6 sm:px-8 py-7 sm:py-10 rounded-[32px] bg-theme-page text-theme-primary focus:bg-theme-card focus:shadow-lg focus:outline-none border border-theme-main focus:border-accent-blue/50 transition-all text-[16px] sm:text-[19px]"
                />
                <div className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 flex gap-1">
                  <button
                    onClick={() => sendMessage(input)}
                    className={`p-3 sm:p-4 rounded-full transition-all duration-300 shadow-md ${input.trim()
                      ? "bg-accent-blue text-white hover:bg-blue-700"
                      : "bg-theme-page text-theme-secondary opacity-30 cursor-default"
                      }`}
                  >
                    <ArrowUp size={22} />
                  </button>
                </div>
              </div>
              <p className="text-[9px] text-center text-theme-secondary mt-3 font-medium uppercase tracking-widest opacity-60 pb-[env(safe-area-inset-bottom)] sm:pb-0">
                VenueFlow AI • System Active
              </p>
            </div>
            {/* 🖱️ Floating Scroll-to-Bottom Button */}
            <AnimatePresence>
              {showScrollButton && (
                <motion.button
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-32 left-1/2 -translate-x-1/2 p-3 rounded-full bg-theme-card shadow-xl border border-theme-main text-accent-blue hover:bg-accent-blue/5 transition-all z-30 active:scale-90"
                  title="Return to latest"
                >
                  <ChevronDown size={20} strokeWidth={3} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}