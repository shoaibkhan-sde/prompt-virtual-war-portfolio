import React, { useState, useEffect, useCallback, Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Spline from '@splinetool/react-spline';

const SPLINE_SCENE_URL = "REPLACE_WITH_SPLINE_EXPORT_URL"; // REPLACE_WITH_SPLINE_EXPORT_URL

interface LoadingScreenProps {
  onComplete: () => void;
}

const FifaBallIcon = ({ className, progress = 0 }: { className?: string; progress?: number }) => (
  <div
    className={className}
    style={{
      transform: `rotate(${progress * 7.2}deg)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem',
      lineHeight: 1,
    }}
  >
    ⚽
  </div>
);

// Same words as nynjfwc26.com, with #WEAREFANS replacing #WEARENYNJ
const CYCLE_WORDS: { text: string; color: string }[] = [
  { text: '#FIFAWORLDCUP', color: '#2fbf9f' }, // Fanflow Teal
  { text: '#WEARE26', color: '#f5a623' },      // Fanflow Amber
  { text: '#WEAREFANS', color: '#7c5cff' },    // Fanflow Violet
];

// Swiper config from nynjfwc26.com:
// direction: vertical, loop: true, autoplay delay: 500ms, speed: 300ms
const AUTOPLAY_DELAY = 500;  // ms word stays visible
const SLIDE_SPEED = 300;  // ms vertical slide transition

// Error boundary to gracefully catch Spline load failures (e.g. invalid URL)
class SplineErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Suppress console error if it's the expected Spline unpacking failure due to placeholder URL
    if (!error.message.includes('end of buffer not reached') && !error.message.includes('Unexpected token')) {
      console.error('Spline failed to load:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [exiting, setExiting] = useState(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const h = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  // Animate counter 0 → 100
  useEffect(() => {
    if (reducedMotion) {
      setProgress(100);
      setWordIndex(CYCLE_WORDS.length - 1);
      return;
    }

    const duration = 5000;
    const start = performance.now();
    let id: number;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setProgress(Math.floor(t * 100));
      if (t < 1) id = requestAnimationFrame(tick);
    };

    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [reducedMotion]);

  // Loop through words: 500ms hold + 300ms slide = 800ms per cycle, looping
  useEffect(() => {
    if (reducedMotion || exiting) return;

    const cycleTime = AUTOPLAY_DELAY + SLIDE_SPEED; // 800ms total
    const interval = setInterval(() => {
      setWordIndex(prev => (prev + 1) % CYCLE_WORDS.length); // loop
    }, cycleTime);

    return () => clearInterval(interval);
  }, [reducedMotion, exiting]);

  // Hold at 100%, then start exit
  useEffect(() => {
    if (progress === 100 && !exiting) {
      const t = setTimeout(() => setExiting(true), reducedMotion ? 150 : 600);
      return () => clearTimeout(t);
    }
  }, [progress, exiting, reducedMotion]);

  // After exit fade, unmount
  const handleComplete = useCallback(() => onComplete(), [onComplete]);
  useEffect(() => {
    if (exiting) {
      const t = setTimeout(handleComplete, reducedMotion ? 100 : 600);
      return () => clearTimeout(t);
    }
  }, [exiting, handleComplete, reducedMotion]);

  const currentWord = CYCLE_WORDS[wordIndex];

  // Vertical slide height (matches text line height)
  const slideDistance = 60;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: exiting ? 0.6 : 0, ease: 'easeInOut' }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 20% -20%, #3b2667 0%, transparent 50%), radial-gradient(circle at 80% 120%, #153c35 0%, transparent 50%), #0e0b1a',
      }}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Loading Fanflow"
    >
      {/* 3D Spline Accent Element (Behind Text) */}
      {!reducedMotion && (
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-60 pointer-events-none z-0 mt-[-80px]">
          <div className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px]">
            <SplineErrorBoundary>
              <Spline scene={SPLINE_SCENE_URL} />
            </SplineErrorBoundary>
          </div>
        </div>
      )}

      {/* Vertical swiper-style word carousel */}
      <div
        className="relative flex items-center justify-center overflow-hidden z-10"
        style={{ height: 'clamp(3rem, 8vw, 5.5rem)' }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.h1
            key={wordIndex}
            initial={{ y: slideDistance, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -slideDistance, opacity: 0 }}
            transition={{
              duration: SLIDE_SPEED / 1000, // 0.3s — exact Swiper speed
              ease: [0.25, 0.1, 0.25, 1],  // CSS ease equivalent
            }}
            className="text-center select-none whitespace-nowrap"
            style={{
              fontFamily: "'Anton', sans-serif",
              fontWeight: 700,
              fontSize: '50px',
              lineHeight: '45px',
              letterSpacing: '0.04em',
              color: currentWord.color,
              textTransform: 'uppercase' as const,
            }}
          >
            {currentWord.text}
          </motion.h1>
        </AnimatePresence>
      </div>

      {/* Capsule loader with moving trophy */}
      <div className="absolute bottom-20 left-0 right-0 flex justify-center">
        <div className="w-[260px] h-12 rounded-full bg-emerald-950 border border-emerald-800 shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)] relative">
          {/* Track for the thumb (inset by 4px) */}
          <div className="absolute top-1 bottom-1 left-1 right-1">
            {/* Progress fill */}
            <div
              className="absolute top-0 left-0 h-full bg-emerald-900 rounded-full"
              style={{ width: `${progress}%` }}
            />
            {/* Trophy Thumb */}
            <div
              className="absolute top-0 h-full transition-all duration-75 ease-linear"
              style={{
                left: `${progress}%`,
                transform: `translateX(-${progress}%)`,
                width: '40px'
              }}
            >
              <div className="w-full h-full bg-lime-400 rounded-full flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-lime-500">
                <FifaBallIcon className="w-8 h-8 text-emerald-950" progress={progress} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
