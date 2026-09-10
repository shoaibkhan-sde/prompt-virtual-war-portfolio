import React, { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import { UserProfile, ActivityLog } from "../lib/emissionFactors";
import { AtmosCoachResponse, ActionPlanItem } from "../lib/localInsights";
import { CoachSkeleton, Skeleton } from "./Skeleton";
import { Send, Bot, User, Sparkles, Plus, AlertCircle } from "lucide-react";
import { renderSafeAIContent } from "../utils/sanitizer";
import { clientLogger } from "../utils/logger";

interface AtmosCoachProps {
  profile: UserProfile;
  activities: ActivityLog[];
  onAdoptAction: (action: ActionPlanItem) => void;
}

interface ChatMessage {
  sender: "user" | "coach";
  text: string;
  timestamp: string;
}

export const AtmosCoach: React.FC<AtmosCoachProps> = ({
  profile,
  activities,
  onAdoptAction,
}) => {
  // Insights State
  const [coachData, setCoachData] = useState<AtmosCoachResponse | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(true);
  
  // Chat States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Load Insights Feed on Mount & when activities change
  useEffect(() => {
    let active = true;
    const fetchCoachData = async () => {
      setLoadingInsights(true);
      try {
        const data = await api.getInsights();
        if (active) {
          setCoachData(data);
        }
      } catch (err) {
        clientLogger.error("insights_load_failed", { error: err instanceof Error ? err.message : String(err) });
      } finally {
        if (active) setLoadingInsights(false);
      }
    };

    fetchCoachData();

    return () => {
      active = false;
    };
  }, [activities, profile]);

  // 2. Chat Scroll Effect
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, sendingChat]);

  // 3. Send Chat message
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageText = chatInput.trim();
    if (!messageText || sendingChat) return;

    // Append user message
    const userMsg: ChatMessage = {
      sender: "user",
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setSendingChat(true);

    try {
      const response = await api.sendChatMessage(messageText);
      const coachMsg: ChatMessage = {
        sender: "coach",
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, coachMsg]);
    } catch (err: unknown) {
      const errMsg: ChatMessage = {
        sender: "coach",
        text: `Error connecting to Atmos Coach server proxy: ${(err as Error).message}. Please try again shortly.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, errMsg]);
    } finally {
      setSendingChat(false);
    }
  };

  return (
    <section className="space-y-6" aria-label="Atmos Coach Interface" data-testid="atmos-coach-section">
      {/* Page Title & Status Badge */}
      <div className="flex justify-between items-center bg-surface border border-border p-4 rounded-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Atmos AI Coach
            <Sparkles className="text-accent-teal animate-pulse" size={18} />
          </h2>
          <p className="text-xs text-muted">Reduce your footprint with personalized carbon-saving advisory powered by Gemini.</p>
        </div>

        {coachData && (
          <div 
            className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
              coachData.usingFallback
                ? "text-accent-amber border-accent-amber/20 bg-accent-amber/5"
                : "text-accent-teal border-accent-teal/20 bg-accent-teal/5"
            }`}
            role="status"
            aria-live="polite"
          >
            {coachData.usingFallback ? "Local Advisory Rule Mode" : "Gemini AI Live Connection"}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insights & Recommendations Panel */}
        <div className="lg:col-span-2 space-y-6" data-testid="coach-insights-panel" aria-busy={loadingInsights}>
          {loadingInsights ? (
            <CoachSkeleton />
          ) : coachData ? (
            <>
              {/* Main Driver Insight card */}
              <div className="ledger-card border-accent-teal/20 space-y-3" aria-live="polite">
                <div className="flex items-center gap-2 text-accent-teal font-bold text-sm uppercase tracking-wider">
                  <Bot size={18} />
                  <span>Ledger Analytics Insight</span>
                </div>
                <div className="text-white text-base">
                  {renderSafeAIContent(coachData.insight)}
                </div>
              </div>

              {/* Goal Progress Coaching card */}
              <div className="ledger-card border-border/60 space-y-3" aria-live="polite">
                <div className="flex items-center gap-2 text-muted font-bold text-sm uppercase tracking-wider">
                  <AlertCircle size={18} />
                  <span>Goal status review</span>
                </div>
                <div className="text-[#e2edea] text-sm">
                  {renderSafeAIContent(coachData.goalCoaching)}
                </div>
              </div>

              {/* Personalized Actions List */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Recommended carbon savings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coachData.actionPlan.map((action) => (
                    <div 
                      key={action.id} 
                      className="ledger-card flex flex-col justify-between p-5 hover:border-accent-teal/40 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-background border border-border text-muted">
                            {action.category}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            action.difficulty === "Easy" ? "text-emerald-500 bg-emerald-500/5 border border-emerald-500/20" :
                            action.difficulty === "Medium" ? "text-accent-amber bg-accent-amber/5 border border-accent-amber/20" :
                            "text-accent-red bg-accent-red/5 border border-accent-red/20"
                          }`}>
                            {action.difficulty}
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-white mt-1">{action.title}</h4>
                        <p className="text-xs text-muted leading-relaxed">{action.description}</p>
                      </div>

                      <div className="flex justify-between items-center pt-4 mt-2 border-t border-border/40">
                        <div className="text-xs">
                          <span className="font-mono font-bold text-accent-teal text-base">
                            -{action.co2SavedKg.toFixed(1)}
                          </span>
                          <span className="text-muted font-mono"> kg/week</span>
                        </div>

                        <button
                          onClick={() => onAdoptAction(action)}
                          className="flex items-center gap-1 text-xs font-semibold text-accent-teal hover:underline min-h-[44px] px-2"
                          aria-label={`Adopt action: ${action.title}`}
                        >
                          Adopt Task
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="ledger-card text-center py-12 text-muted">
              <p>No carbon analysis available. Please check back shortly.</p>
            </div>
          )}
        </div>

        {/* Conversational Chat Interface */}
        <div className="lg:col-span-1 ledger-card flex flex-col h-[520px] justify-between p-4 relative">
          <header className="flex items-center gap-3 border-b border-border pb-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-accent-teal/10 border border-accent-teal/20 flex items-center justify-center text-accent-teal">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Atmos Coach Chat</h3>
              <p className="text-[10px] text-muted font-mono">Ask ledger or reduction questions</p>
            </div>
          </header>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4" data-testid="ai-chat-log" role="log" aria-live="polite" aria-relevant="additions">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 text-muted py-12">
                <Bot size={36} className="text-muted mb-2 animate-bounce" />
                <p className="text-xs">Ask anything regarding carbon offsets, grid efficiency, or your budget trajectory.</p>
                <div className="grid grid-cols-1 gap-1.5 mt-4 w-full text-[10px] text-left">
                  <button 
                    onClick={() => setChatInput("How can I reduce my transportation emissions?")} 
                    className="border border-border p-2 rounded hover:bg-border/30 text-white font-medium"
                  >
                    "How can I reduce transport emissions?"
                  </button>
                  <button 
                    onClick={() => setChatInput("What is the carbon cost of a vegetarian diet?")} 
                    className="border border-border p-2 rounded hover:bg-border/30 text-white font-medium"
                  >
                    "Vegetarian diet carbon benefits?"
                  </button>
                </div>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex gap-2.5 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                >
                  <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center ${
                    msg.sender === "user" ? "bg-accent-teal text-background" : "bg-border text-white"
                  }`}>
                    {msg.sender === "user" ? <User size={14} /> : <Bot size={14} />}
                  </div>

                  <div className={`rounded-xl p-3 text-xs leading-relaxed ${
                    msg.sender === "user" 
                      ? "bg-accent-teal/10 border border-accent-teal/20 text-[#e2edea]" 
                      : "bg-[#121816] border border-border text-white"
                  }`}>
                    {renderSafeAIContent(msg.text)}
                    <span className="block text-[9px] text-muted text-right mt-1.5 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))
            )}
            
            {/* Thinking skeleton */}
            {sendingChat && (
              <div className="flex gap-2.5 max-w-[85%] mr-auto items-center">
                <div className="w-7 h-7 rounded-full bg-border text-white flex items-center justify-center">
                  <Bot size={14} className="animate-spin" />
                </div>
                <div className="bg-[#121816] border border-border rounded-xl p-3 flex space-x-1 items-center">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-2 w-2 rounded-full animate-delay-100" />
                  <Skeleton className="h-2 w-2 rounded-full animate-delay-200" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Form */}
          <form onSubmit={handleChatSubmit} className="flex gap-2 pt-2 border-t border-border">
            <input
              aria-label="Atmos Coach Chat Input"
              type="text"
              placeholder="Ask Atmos Coach..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="ledger-input text-xs py-2"
              disabled={sendingChat}
              required
            />
            <button
              type="submit"
              disabled={sendingChat}
              aria-label="Send message"
              className="ledger-btn-primary px-3 py-2"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default AtmosCoach;
