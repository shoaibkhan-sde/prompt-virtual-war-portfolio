import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Settings, Ticket, Send, MapPin, Users, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';
import type { ChatMessage, ChatAIResponse, CrowdZone } from '../types';

export const FanConciergePage: React.FC = () => {
  const [adaEnabled, setAdaEnabled] = useState(false);
  const [chatInput, setChatInput] = useState('');
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: "Hello, I'm your **Matchday Assistant**. I track live crowd density and gate updates to help you get around MetLife Stadium.\n\nAsk me about routes, transit, or accessibility, or use a quick action below."
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [zones, setZones] = useState<CrowdZone[]>([]);

  useEffect(() => {
    const fetchCrowd = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch('/api/crowd', { signal: controller.signal });
        clearTimeout(timeoutId);
        
        let data: CrowdZone[] = [];
        if (res.ok) data = await res.json();
        
        if (!data || data.length === 0) {
          data = [
            { zoneId: 'z1', name: 'Gate 1', density: 86, capacity: 1000, currentCount: 860, status: 'HIGH', updatedAt: new Date().toISOString() },
            { zoneId: 'z2', name: 'Gate 2', density: 60, capacity: 1000, currentCount: 600, status: 'MEDIUM', updatedAt: new Date().toISOString() },
            { zoneId: 'z3', name: 'Gate 3', density: 70, capacity: 1000, currentCount: 700, status: 'MEDIUM', updatedAt: new Date().toISOString() },
            { zoneId: 'z4', name: 'Gate 4', density: 40, capacity: 1000, currentCount: 400, status: 'LOW', updatedAt: new Date().toISOString() },
            { zoneId: 'z5', name: 'Gate 5', density: 55, capacity: 1000, currentCount: 550, status: 'MEDIUM', updatedAt: new Date().toISOString() },
            { zoneId: 'z6', name: 'Gate 6', density: 30, capacity: 1000, currentCount: 300, status: 'LOW', updatedAt: new Date().toISOString() },
            { zoneId: 'z7', name: 'Gate 7', density: 49, capacity: 1000, currentCount: 490, status: 'LOW', updatedAt: new Date().toISOString() },
            { zoneId: 'z8', name: 'Gate 8', density: 90, capacity: 1000, currentCount: 900, status: 'HIGH', updatedAt: new Date().toISOString() }
          ];
        }
        setZones(data);
      } catch (err) {
        setZones([
          { zoneId: 'z1', name: 'North Stand', density: 86, capacity: 1000, currentCount: 860, status: 'HIGH', updatedAt: new Date().toISOString() },
          { zoneId: 'z2', name: 'East Stand', density: 70, capacity: 1000, currentCount: 700, status: 'MEDIUM', updatedAt: new Date().toISOString() },
          { zoneId: 'z3', name: 'South Stand', density: 55, capacity: 1000, currentCount: 550, status: 'MEDIUM', updatedAt: new Date().toISOString() },
          { zoneId: 'z4', name: 'West Stand', density: 49, capacity: 1000, currentCount: 490, status: 'LOW', updatedAt: new Date().toISOString() }
        ]);
      }
    };
    fetchCrowd();
    const interval = setInterval(fetchCrowd, 10000);
    return () => clearInterval(interval);
  }, []);

  const gatesConfig = useMemo(() => {
    const defaultGates = [
      { id: 'g1', label: 'Gate 1', transform: 'translate(170,30)', density: 100, status: 'LOW', accessible: true, pathCenter: 70, mapZone: 'North' },
      { id: 'g2', label: 'Gate 2', transform: 'translate(296.5,53.5)', density: 100, status: 'LOW', accessible: false, pathCenter: 202.8, mapZone: 'East' },
      { id: 'g3', label: 'Gate 3', transform: 'translate(320,110)', density: 100, status: 'LOW', accessible: false, pathCenter: 265.7, mapZone: 'East' },
      { id: 'g4', label: 'Gate 4', transform: 'translate(296.5,166.5)', density: 100, status: 'LOW', accessible: true, pathCenter: 328.5, mapZone: 'South' },
      { id: 'g5', label: 'Gate 5', transform: 'translate(170,190)', density: 100, status: 'LOW', accessible: true, pathCenter: 461.3, mapZone: 'South' },
      { id: 'g6', label: 'Gate 6', transform: 'translate(43.5,166.5)', density: 100, status: 'LOW', accessible: false, pathCenter: 594.1, mapZone: 'West' },
      { id: 'g7', label: 'Gate 7', transform: 'translate(20,110)', density: 100, status: 'LOW', accessible: false, pathCenter: 657.0, mapZone: 'West' },
      { id: 'g8', label: 'Gate 8', transform: 'translate(43.5,53.5)', density: 100, status: 'LOW', accessible: true, pathCenter: 719.8, mapZone: 'North' },
    ];
    
    if (zones.length > 0) {
      defaultGates.forEach(g => {
        const zone = zones.find(z => z.name.toLowerCase().includes(g.mapZone.toLowerCase()));
        if (zone) {
          g.density = zone.density;
          g.status = zone.status || (zone.density > 80 ? 'HIGH' : zone.density > 50 ? 'MEDIUM' : 'LOW');
        }
      });
    }
    
    let best = defaultGates[0];
    defaultGates.forEach(g => {
      if (g.density < best.density) best = g;
    });
    
    return { gates: defaultGates, optimalGate: best };
  }, [zones]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
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
          accessibilityMode: adaEnabled
        })
      });

      if (!response.ok) {
        throw new Error('API server returned an error.');
      }

      const data: ChatAIResponse = await response.json();
      
      setMessages(prev => [...prev, { role: 'model', text: data.text }]);
      
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
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(chatInput);
  };

  const SafeMarkdownMessage = ({ text }: { text: string }) => {
    const sanitized = useMemo(() => DOMPurify.sanitize(text), [text]);
    return (
      <div className="prose prose-invert max-w-none text-sm leading-relaxed prose-p:my-1 prose-a:text-[#2fbf9f]">
        <ReactMarkdown>{sanitized}</ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="-mx-4 md:-mx-6 -my-4 md:-my-6 flex flex-col md:flex-row min-h-[calc(100dvh-111px)] md:h-[calc(100dvh-111px)] assistant-container md:overflow-hidden overflow-y-auto">
      <style>{`
        .assistant-container {
          --bg: #0e0b1a;
          --panel: #17132a;
          --panel-2: #1d1836;
          --border: #2b2547;
          --text: #f2f0f8;
          --text-dim: #9c96b8;
          --accent: #f5a623;
          --accent-2: #2fbf9f;
          --arg: #7c5cff;
          --bra: #f5c542;
          --radius: 14px;
          
          background: var(--bg);
          color: var(--text);
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        }
        
        .assistant-container *::-webkit-scrollbar {
          display: none;
        }
        .assistant-container * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .sidebar {
          padding: 20px;
          gap: 16px;
          overflow-y: auto;
        }
        .assistant-card {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
        }
        .card-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 700; color: var(--text-dim);
          margin-bottom: 14px;
          text-transform: uppercase; letter-spacing: .03em;
        }
        .pref-row {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 13.5px;
        }
        .assistant-toggle {
          width: 38px; height: 20px; border-radius: 20px;
          position: relative; cursor: pointer;
          transition: background 0.2s;
        }
        .assistant-toggle::after {
          content: ''; position: absolute; top: 2px;
          width: 16px; height: 16px; border-radius: 50%;
          background: #1a1330;
          transition: left 0.2s, right 0.2s;
        }
        .assistant-toggle.active { background: var(--accent); }
        .assistant-toggle.active::after { right: 2px; }
        .assistant-toggle.inactive { background: var(--text-dim); }
        .assistant-toggle.inactive::after { left: 2px; }
        
        .muted { color: var(--text-dim); font-size: 13px; line-height: 1.5; }

        .stadium-view {
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .stadium-col {
          display:flex;
          flex-direction:column;
          align-items:center;
          gap:22px;
          padding:60px 80px;
        }
        .ring-wrap {
          position:relative;
          width:460px;
          height:300px;
        }
        .ring-wrap svg{width:100%;height:100%;overflow:visible;}

        .stand-label {
          position:absolute;
          font-size:11px;font-weight:700;
          letter-spacing:.06em;
          color:var(--text-dim);
          white-space:nowrap;
          pointer-events:none;
        }
        .stand-label.vert { font-size:10px; }

        .gate-name {
          position:absolute;
          font-size:10.5px;font-weight:700;
          color:#1a1330;
          background:var(--accent);
          padding:3px 9px;
          border-radius:12px;
          white-space:nowrap;
          pointer-events:none;
        }

        .legend {
          display:flex;gap:18px;
          font-size:12px;color:var(--text-dim);
          flex-wrap:wrap;
          justify-content:center;
          max-width:440px;
        }
        .legend-item {display:flex;align-items:center;gap:7px;}
        .dot {width:9px;height:9px;border-radius:50%;display:inline-block;}
        .dot.low {background:#38bdf8;}
        .dot.mid {background:#f5a623;}
        .dot.high {background:#e5533d;}
        .door-icon {
          width:8px;height:11px;
          border-radius:2px;
          background:var(--accent);
          display:inline-block;
        }

        .chat-panel {
          background: var(--panel);
        }
        .chat-status {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 18px;
          font-size: 12px; color: var(--text-dim);
          border-bottom: 1px solid var(--border);
          flex-wrap: wrap;
        }
        .chat-body {
          flex: 1;
          padding: 18px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .assistant-msg {
          background: var(--panel-2);
          border: 1px solid var(--border);
          border-left: 3px solid var(--accent);
          border-radius: 10px;
          padding: 14px 16px;
          font-size: 13.5px;
          line-height: 1.6;
        }
        .user-msg {
          background: var(--bg);
          border: 1px solid var(--border);
          border-right: 3px solid var(--accent-2);
          border-radius: 10px;
          padding: 14px 16px;
          font-size: 13.5px;
          line-height: 1.6;
          margin-left: 20px;
        }
        .assistant-msg .label {
          color: var(--accent);
          font-weight: 700;
          font-size: 11px;
          letter-spacing: .04em;
          margin-bottom: 8px;
          display: flex; align-items: center; gap: 6px;
        }
        .user-msg .label {
          color: var(--accent-2);
          font-weight: 700;
          font-size: 11px;
          letter-spacing: .04em;
          margin-bottom: 8px;
          display: flex; align-items: center; justify-content: flex-end; gap: 6px;
        }
        .assistant-msg .label::before {
          content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--accent);
        }
        .quick-actions {
          display: flex; flex-wrap: wrap; gap: 8px;
          margin-top: 16px;
        }
        .qa-btn {
          background: var(--panel-2);
          border: 1px solid var(--border);
          color: var(--text);
          font-size: 12.5px;
          padding: 9px 14px;
          border-radius: 20px;
          display: flex; align-items: center; gap: 6px;
          cursor: pointer;
        }
        .qa-btn:hover { background: var(--border); }
        .qa-btn.wide { width: 100%; justify-content: center; }
        .chat-input {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 18px;
          border-top: 1px solid var(--border);
        }
        .chat-input input {
          flex: 1;
          background: var(--panel-2);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 10px 16px;
          color: var(--text);
          font-size: 13px;
          outline: none;
        }
        .chat-input input:focus { border-color: var(--accent); }
        .send-btn {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: var(--accent);
          display: flex; align-items: center; justify-content: center;
          color: #1a1330;
          flex-shrink: 0;
          cursor: pointer;
          border: none;
        }
        .send-btn:hover { opacity: 0.9; }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      {/* Sidebar */}
      <div className="sidebar hidden md:flex flex-col w-[260px] shrink-0">
        <div className="assistant-card">
          <div className="card-title"><Settings size={14} /> Preferences</div>
          <div className="pref-row">
            ADA accessible routes
            <div 
              className={`assistant-toggle ${adaEnabled ? 'active' : 'inactive'}`} 
              onClick={() => setAdaEnabled(!adaEnabled)}
            ></div>
          </div>
        </div>
        <div className="assistant-card">
          <div className="card-title"><Ticket size={14} /> Wait times</div>
          <div className="flex flex-col gap-2 mt-3">
            {gatesConfig.gates
              .filter(g => !adaEnabled || g.accessible)
              .sort((a, b) => a.density - b.density)
              .slice(0, 3)
              .map(g => (
                <div key={g.id} className="flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: g.status === 'HIGH' ? '#ff4b4b' : g.status === 'MEDIUM' ? '#f5a623' : '#38bdf8' }}></div>
                    <span className="text-[#a49ebf]">{g.label}</span>
                  </div>
                  <strong className="text-white">{Math.max(1, Math.ceil(g.density * 0.25))} min</strong>
                </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stadium View */}
      <div className="stadium-view hidden lg:flex flex-1">
        <div className="stadium-col">
          <div className="ring-wrap">
            <svg viewBox="0 0 340 220">
              <defs>
                <linearGradient id="low" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7dd3fc"/>
                  <stop offset="100%" stopColor="#0284c7"/>
                </linearGradient>
                <linearGradient id="mid" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ffd166"/>
                  <stop offset="100%" stopColor="#f5a623"/>
                </linearGradient>
                <linearGradient id="high" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ff8a65"/>
                  <stop offset="100%" stopColor="#e5533d"/>
                </linearGradient>
                <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1c332a"/>
                  <stop offset="100%" stopColor="#142520"/>
                </linearGradient>
                <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.6" result="blur"/>
                  <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>

                <symbol id="gateIcon" viewBox="-11 -13 22 26">
                  <path d="M -7 11 L -7 -3 Q -7 -11 0 -11 Q 7 -11 7 -3 L 7 11"
                        fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="-7" y1="11" x2="7" y2="11" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round"/>
                </symbol>
              </defs>

              <rect x="20" y="30" width="300" height="160" rx="80" fill="none" stroke="#241f42" strokeWidth="1"/>

              <g filter="url(#softGlow)">
                {gatesConfig.gates.map((gate) => {
                  const dashOffset = -(gate.pathCenter - 38);
                  const strokeUrl = gate.status === 'HIGH' ? 'url(#high)' : gate.status === 'MEDIUM' ? 'url(#mid)' : 'url(#low)';
                  return (
                    <rect key={`border-${gate.id}`} x="20" y="30" width="300" height="160" rx="80" 
                          fill="none" stroke={strokeUrl} strokeWidth="15" strokeLinecap="round" 
                          strokeDasharray="76 706.6" strokeDashoffset={dashOffset} 
                          style={{ transition: 'stroke-dashoffset 0.5s, stroke 0.5s' }}/>
                  );
                })}
              </g>

              <rect x="52" y="58" width="236" height="104" rx="52" fill="none" stroke="#2fbf9f" strokeWidth="7" strokeOpacity="0.45" strokeDasharray="30 12"/>

              <rect x="88" y="72" width="164" height="76" rx="2" fill="url(#pitchGrad)" stroke="#3a5c4c" strokeWidth="1.2"/>
              <line x1="170" y1="72" x2="170" y2="148" stroke="#3a5c4c" strokeWidth="1"/>
              <circle cx="170" cy="110" r="14" fill="none" stroke="#3a5c4c" strokeWidth="1"/>
              <circle cx="170" cy="110" r="1.6" fill="#3a5c4c"/>
              <rect x="88" y="88" width="18" height="44" fill="none" stroke="#3a5c4c" strokeWidth="1"/>
              <rect x="234" y="88" width="18" height="44" fill="none" stroke="#3a5c4c" strokeWidth="1"/>

              {gatesConfig.gates.map(gate => {
                let color = '#38bdf8'; // Blue (LOW)
                let fill = '#0c3052';
                
                if (gate.status === 'HIGH') {
                  color = '#ff4b4b'; // Red
                  fill = '#451a1a';
                } else if (gate.status === 'MEDIUM') {
                  color = '#f5a623'; // Amber
                  fill = '#3a2f14';
                }

                const isMuted = adaEnabled && !gate.accessible;

                return (
                  <g key={gate.id} transform={gate.transform} color={color} style={{ opacity: isMuted ? 0.2 : 1, transition: 'opacity 0.3s' }}>
                    <circle r="12" fill={fill}/>
                    <use href="#gateIcon" width="18" height="18" x="-9" y="-9"/>
                    {adaEnabled && gate.accessible && (
                      <g transform="translate(10, -10)">
                        <circle cx="0" cy="0" r="5" fill="#38bdf8" />
                        <text x="0" y="3" fontSize="7" fontWeight="bold" fill="#0e0b1a" textAnchor="middle">&uarr;</text>
                      </g>
                    )}
                    <text x="0" y="3.5" fontSize="8" fontWeight="800" fill="#ffffff" textAnchor="middle">
                      {gate.id.replace('g', '')}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="stand-label" style={{top: '-2%', left: '50%', transform: 'translateX(-50%)'}}>NORTH STAND</div>
            <div className="stand-label" style={{bottom: '-2%', left: '50%', transform: 'translateX(-50%)'}}>SOUTH STAND</div>
            <div className="stand-label vert" style={{top: '50%', right: '-9%', transform: 'translateY(-50%) rotate(90deg)'}}>EAST END</div>
            <div className="stand-label vert" style={{top: '50%', left: '-9%', transform: 'translateY(-50%) rotate(-90deg)'}}>WEST END</div>
          </div>

          <div className="legend">
            <div className="legend-item"><span className="dot low"></span>Light crowd</div>
            <div className="legend-item"><span className="dot mid"></span>Moderate crowd</div>
            <div className="legend-item"><span className="dot high"></span>Heavy crowd &mdash; avoid</div>
            <div className="legend-item">
              <svg width="12" height="15" viewBox="-11 -13 22 26" style={{ color: 'var(--accent)' }}>
                <path d="M -7 11 L -7 -3 Q -7 -11 0 -11 Q 7 -11 7 -3 L 7 11" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="-7" y1="11" x2="7" y2="11" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round"/>
              </svg>
              Gate / entrance
            </div>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <div className="chat-panel flex flex-col shrink-0 w-full lg:w-[340px]">
        <div className="chat-status">
          <strong>78:24</strong> MetLife Stadium · Attendance 81,240 · 28°C, clear
        </div>
        
        <div className="chat-body">
          {messages.map((msg, i) => (
            <div key={i} className={msg.role === 'user' ? 'user-msg' : 'assistant-msg'}>
              <div className="label">
                {msg.role === 'user' ? 'You' : 'Matchday Assistant'}
              </div>
              <SafeMarkdownMessage text={msg.text} />
              
              {msg.role === 'model' && i === 0 && (
                <div className="quick-actions">
                  <div className="qa-btn" onClick={() => handleSendMessage('Where is the fastest and safest route to my stand based on current congestion?')}><MapPin size={14} /> Navigation</div>
                  <div className="qa-btn" onClick={() => handleSendMessage('What is the current crowd density situation across the stadium right now?')}><Users size={14} /> Crowd management</div>
                  <div className="qa-btn wide" onClick={() => handleSendMessage('Where can I find wheelchair ramp access and elevator paths?')}><Clock size={14} /> Accessibility</div>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="assistant-msg">
              <div className="label">Matchday Assistant</div>
              <div className="flex gap-1.5 mt-2">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" style={{animationDelay: '0.2s'}}></span>
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" style={{animationDelay: '0.4s'}}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input" onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Ask about gates, accessibility, transit..." 
            value={chatInput} 
            onChange={(e) => setChatInput(e.target.value)} 
            disabled={isLoading}
          />
          <button type="submit" className="send-btn" disabled={!chatInput.trim() || isLoading}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
