'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PartyPopper, X } from 'lucide-react';

interface PartyPopperCelebrationProps {
  show: boolean;
  eventName: string;
  onClose: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

const FESTIVE_COLORS = ['#F5A524', '#2E2A7A', '#B83280', '#0E6B6A', '#FFD98A', '#10B981', '#EC4899', '#6366F1'];

export const PartyPopperCelebration: React.FC<PartyPopperCelebrationProps> = ({
  show,
  eventName,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    if (!show) {
      setBannerVisible(false);
      return;
    }

    setBannerVisible(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Generate confetti particles
    const particles: Particle[] = [];
    const count = 75;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: canvas.width * 0.5 + (Math.random() - 0.5) * 120,
        y: canvas.height * 0.35 + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 12 - 4,
        size: Math.random() * 8 + 4,
        color: FESTIVE_COLORS[Math.floor(Math.random() * FESTIVE_COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
      });
    }

    let animationFrameId: number;
    const startTime = performance.now();

    const render = (time: number) => {
      const elapsed = (time - startTime) / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.28; // gravity
        p.vx *= 0.985; // friction
        p.rotation += p.rotationSpeed;
        if (elapsed > 2.5) {
          p.opacity = Math.max(0, p.opacity - 0.02);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      if (elapsed < 4.5 && particles.some((p) => p.opacity > 0)) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    const timer = setTimeout(() => {
      setBannerVisible(false);
      onClose();
    }, 5000);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timer);
    };
  }, [show, onClose]);

  if (!show && !bannerVisible) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-50 w-full h-full print:hidden"
      />

      {bannerVisible && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 sm:top-24 right-4 sm:right-8 z-50 max-w-sm sm:max-w-md w-[calc(100vw-32px)] p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1C1F2B] text-slate-900 dark:text-white border-2 border-[#F5A524] shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 print:hidden"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#F5A524]/20 text-[#D78B13] dark:text-[#F5A524] flex items-center justify-center shrink-0">
              <PartyPopper size={22} className="animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Event Created Successfully! 🎉</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Your blueprint for <strong className="text-[#2E2A7A] dark:text-[#FFD98A]">&ldquo;{eventName}&rdquo;</strong> is now ready to review and track.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setBannerVisible(false);
                onClose();
              }}
              aria-label="Dismiss celebration"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PartyPopperCelebration;
