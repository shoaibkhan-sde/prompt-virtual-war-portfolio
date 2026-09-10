/**
 * HeartsBar — Duolingo-style lives display.
 * Shows up to MAX_HEARTS hearts. Lost hearts are faded.
 * Includes a refill countdown timer.
 */
import React, { useState, useEffect } from 'react';
import { useHearts } from '../contexts/HeartsContext';

function HeartsBar({ className = '' }) {
  const { hearts, maxHearts, secondsToRefill } = useHearts();
  const [display, setDisplay] = useState(secondsToRefill);

  // Live countdown
  useEffect(() => {
    if (secondsToRefill <= 0) { setDisplay(0); return; }
    setDisplay(secondsToRefill);
    const t = setInterval(() => setDisplay(d => Math.max(0, d - 1)), 1000);
    return () => clearInterval(t);
  }, [secondsToRefill]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  };

  return (
    <div className={`hearts-bar ${className}`} title={hearts < maxHearts && display > 0 ? `+❤️ in ${formatTime(display)}` : 'Full hearts'}>
      <div className="hearts-icons">
        {Array.from({ length: maxHearts }).map((_, i) => (
          <span
            key={i}
            className={`heart-icon ${i < hearts ? 'active' : 'lost'}`}
            role="img"
            aria-label={i < hearts ? "Active Heart" : "Lost Heart"}
            style={{
              fontSize: '16px',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              transform: i < hearts ? 'scale(1)' : 'scale(0.75)',
              opacity: i < hearts ? 1 : 0.25,
              filter: i < hearts ? 'drop-shadow(0 0 4px rgba(239,68,68,0.6))' : 'none',
            }}
          >
            ❤️
          </span>
        ))}
      </div>
      {hearts < maxHearts && display > 0 && (
        <span className="heart-timer">{formatTime(display)}</span>
      )}
    </div>
  );
}

export default HeartsBar;
