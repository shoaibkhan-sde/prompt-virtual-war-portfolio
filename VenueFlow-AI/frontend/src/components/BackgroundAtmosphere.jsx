import React, { useEffect, useRef, useCallback } from 'react';
import { motion, useReducedMotion, useMotionValue, useTransform, animate } from 'framer-motion';

// ─────────────────────────────────────────────
// CONFIG — tweak once, affects the whole system
// ─────────────────────────────────────────────
const CFG = {
  bg: '#020617',
  orbs: [
    // { x%, y%, size, color, duration, delay }
    // Slow "cosmic deep" layer — reduced ~22% for subtle life without restlessness
    // { x: 15, y: 20, size: 680, color: '#312e81', dur: 22, delay: 0 },
    // { x: 75, y: 15, size: 520, color: '#1e3a8a', dur: 28, delay: 4 },
    // { x: 50, y: 70, size: 600, color: '#4338ca', dur: 25, delay: 8 },

    //  { x: 15, y: 20, size: 680, color: '#1E70F0', dur: 22, delay: 0 },
    // { x: 15, y: 20, size: 680, color: '#00A9A5', dur: 22, delay: 4 },
    // { x: 15, y: 20, size: 680, color: '#20D291', dur: 22, delay: 8 },
    // { x: 85, y: 60, size: 440, color: '#5b21b6', dur: 35, delay: 2 },
    // { x: 25, y: 80, size: 360, color: '#1d4ed8', dur: 18, delay: 14 },
    // { x: 60, y: 35, size: 300, color: '#7c3aed', dur: 40, delay: 6 },

    { x: 15, y: 20, size: 680, color: '#1E70F0', dur: 2, delay: 0 },
    { x: 15, y: 20, size: 680, color: '#00A9A5', dur: 2, delay: 0 },
    { x: 15, y: 20, size: 680, color: '#20D291', dur: 2, delay: 0 },
    { x: 85, y: 60, size: 440, color: '#5b21b6', dur: 3, delay: 0 },
    { x: 25, y: 80, size: 360, color: '#d81d20ff', dur: 1, delay: 0 },
    { x: 60, y: 35, size: 300, color: '#7c3aed', dur: 4, delay: 0 },
  ],
  aurora: [
    // Mid-atmosphere — ~36% faster: these are the "breathing" layer that makes the scene alive
    { color: 'rgba(99,102,241,0.18)', dur: 14, delay: 0 },
    { color: 'rgba(59,130,246,0.14)', dur: 20, delay: 5 },
    { color: 'rgba(139,92,246,0.12)', dur: 28, delay: 10 },
  ],
  stars: { count: 110, minR: 0.4, maxR: 1.6, twinkleDur: [1.2, 3.5] },
  noise: { baseFreq: '0.65', octaves: 4, opacity: 0.045 },
};

// ─────────────────────────────────────────────
// STAR CANVAS — requestAnimationFrame particle field
// ─────────────────────────────────────────────
function StarCanvas({ reduced }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const starsRef = useRef([]);

  const seed = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width: w, height: h } = canvas.getBoundingClientRect();
    canvas.width = w;
    canvas.height = h;
    starsRef.current = Array.from({ length: CFG.stars.count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: CFG.stars.minR + Math.random() * (CFG.stars.maxR - CFG.stars.minR),
      phase: Math.random() * Math.PI * 2,
      speed: CFG.stars.twinkleDur[0] + Math.random() *
        (CFG.stars.twinkleDur[1] - CFG.stars.twinkleDur[0]),
      baseA: 0.2 + Math.random() * 0.5,
    }));
  }, []);

  useEffect(() => {
    seed();
    const ro = new ResizeObserver(seed);
    if (canvasRef.current) ro.observe(canvasRef.current);

    if (reduced) return () => ro.disconnect();

    const draw = (ts) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      starsRef.current.forEach((s) => {
        const t = (ts / 1000) / s.speed;
        const alpha = s.baseA + Math.sin(t * Math.PI * 2 + s.phase) * (s.baseA * 0.6);
        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
        glow.addColorStop(0, `rgba(200,210,255,${alpha})`);
        glow.addColorStop(0.5, `rgba(160,180,255,${alpha * 0.5})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(230,235,255,${Math.min(1, alpha * 1.6)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [reduced, seed]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.9 }}
    />
  );
}

// ─────────────────────────────────────────────
// FLOATING ORB — individual drifting blob
// ─────────────────────────────────────────────
function FloatingOrb({ cfg, reduced }) {
  const variants = reduced
    ? {}
    : {
      animate: {
        x: [0, 28, -22, 18, 0],
        y: [0, -24, 16, -18, 0],
        scale: [1, 1.08, 0.96, 1.04, 1],
        opacity: [0.55, 0.75, 0.6, 0.7, 0.55],
      },
    };

  return (
    <motion.div
      variants={variants}
      animate="animate"
      transition={{
        duration: cfg.dur,
        delay: cfg.delay,
        repeat: Infinity,
        ease: 'easeInOut',
        times: [0, 0.25, 0.5, 0.75, 1],
      }}
      style={{
        position: 'absolute',
        left: `${cfg.x}%`,
        top: `${cfg.y}%`,
        width: cfg.size,
        height: cfg.size,
        background: cfg.color,
        borderRadius: '50%',
        filter: `blur(${Math.round(cfg.size * 0.22)}px)`,
        transform: 'translate(-50%, -50%) translateZ(0)',
        willChange: 'transform, opacity',
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }}
    />
  );
}

// ─────────────────────────────────────────────
// AURORA RIBBON — sweeping diagonal wave
// ─────────────────────────────────────────────
function AuroraRibbon({ cfg, index, reduced }) {
  const yOffset = index * 28;
  return (
    <motion.div
      animate={reduced ? {} : {
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        opacity: [0.6, 1, 0.7, 1, 0.6],
        skewY: ['-1deg', '1deg', '-1deg'],
      }}
      transition={{
        duration: cfg.dur,
        delay: cfg.delay,
        repeat: Infinity,
        ease: 'easeInOut',
        times: [0, 0.3, 0.6, 0.8, 1],
      }}
      style={{
        position: 'absolute',
        top: `${18 + yOffset}%`,
        left: '-10%',
        width: '120%',
        height: '22%',
        background: `linear-gradient(105deg, transparent 0%, ${cfg.color} 35%, transparent 65%, ${cfg.color} 85%, transparent 100%)`,
        backgroundSize: '200% 100%',
        filter: 'blur(60px)',
        mixBlendMode: 'screen',
        willChange: 'background-position, opacity',
        transformOrigin: 'center',
        pointerEvents: 'none',
      }}
    />
  );
}

// ─────────────────────────────────────────────
// SPECTRAL FLOW — the primary wide gradient wash
// ─────────────────────────────────────────────
function SpectralFlow({ reduced }) {
  return (
    <>
      <motion.div
        animate={reduced ? {} : { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 38, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(90deg,
            ${CFG.bg} 0%,
            #0f172a 8%,
            #1e1b4b 20%,
            #312e81 38%,
            #4338ca 50%,
            #3b82f6 62%,
            #8b5cf6 78%,
            #1e1b4b 90%,
            ${CFG.bg} 100%)`,
          backgroundSize: '250% 100%',
          opacity: 0.75,
          filter: 'blur(90px)',
          willChange: 'background-position',
          transform: 'translateZ(0)',
          pointerEvents: 'none',
        }}
      />
      {/* Counter-rotating secondary wash for interference pattern */}
      <motion.div
        animate={reduced ? {} : { backgroundPosition: ['100% 50%', '0% 50%', '100% 50%'] }}
        transition={{ duration: 55, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg,
            transparent 0%,
            #1e3a8a 25%,
            #4c1d95 55%,
            #2563eb 75%,
            transparent 100%)`,
          backgroundSize: '200% 200%',
          opacity: 0.35,
          filter: 'blur(110px)',
          mixBlendMode: 'screen',
          willChange: 'background-position',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

// ─────────────────────────────────────────────
// SVG NOISE FILTER — real grain, not a CSS class
// ─────────────────────────────────────────────
function NoiseLayer() {
  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id="vf-noise" x="0%" y="0%" width="100%" height="100%"
            colorInterpolationFilters="linearRGB">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={CFG.noise.baseFreq}
              numOctaves={CFG.noise.octaves}
              stitchTiles="stitch"
              result="noiseOut"
            />
            <feColorMatrix type="saturate" values="0" in="noiseOut" result="grayNoise" />
            <feBlend in="SourceGraphic" in2="grayNoise" mode="overlay" />
          </filter>
        </defs>
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: CFG.noise.opacity,
          filter: 'url(#vf-noise)',
          willChange: 'auto',
          pointerEvents: 'none',
          zIndex: 40,
          background: '#fff',
        }}
      />
    </>
  );
}

// ─────────────────────────────────────────────
// EDGE VIGNETTE — all-four-sides depth frame
// ─────────────────────────────────────────────
function Vignette() {
  const base = `rgba(2,6,23,`;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 35 }}>
      {/* Radial center punch-out */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 70% 65% at 50% 50%, transparent 0%, ${base}0.5) 60%, ${base}0.9) 100%)`,
      }} />
      {/* Top edge */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '30%',
        background: `linear-gradient(to bottom, ${base}0.7) 0%, transparent 100%)`,
      }} />
      {/* Bottom edge */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '25%',
        background: `linear-gradient(to top, ${base}0.6) 0%, transparent 100%)`,
      }} />
      {/* Left edge */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0, width: '20%',
        background: `linear-gradient(to right, ${base}0.5) 0%, transparent 100%)`,
      }} />
      {/* Right edge */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, right: 0, width: '20%',
        background: `linear-gradient(to left, ${base}0.5) 0%, transparent 100%)`,
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────
// IRIDESCENT CAUSTIC — top-layer shimmer detail
// ─────────────────────────────────────────────
function CausticShimmer({ reduced }) {
  const shimmers = [
    { top: '0%', left: '0%', w: '60%', h: '40%', from: 'rgba(34,211,238,0.07)', to: 'transparent', angle: 135, dur: 6, delay: 0 },
    { top: '60%', left: '40%', w: '70%', h: '45%', from: 'rgba(99,102,241,0.06)', to: 'transparent', angle: 315, dur: 9, delay: 2 },
    { top: '20%', left: '55%', w: '50%', h: '35%', from: 'rgba(59,130,246,0.08)', to: 'transparent', angle: 210, dur: 12, delay: 5 },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none' }}>
      {shimmers.map((s, i) => (
        <motion.div
          key={i}
          animate={reduced ? {} : {
            opacity: [0, 0.8, 0.2, 1, 0],
            scale: [0.95, 1.05, 0.98, 1.02, 0.95],
          }}
          transition={{
            duration: s.dur,
            delay: s.delay,
            repeat: Infinity,
            ease: 'easeInOut',
            times: [0, 0.25, 0.5, 0.75, 1],
          }}
          style={{
            position: 'absolute',
            top: s.top,
            left: s.left,
            width: s.w,
            height: s.h,
            background: `linear-gradient(${s.angle}deg, ${s.from} 0%, ${s.to} 100%)`,
            mixBlendMode: 'screen',
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────
export default function BackgroundAtmosphere() {
  const reduced = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        zIndex: 0,
        background: CFG.bg,
        pointerEvents: 'none',
      }}
    >
      {/* Layer 0 — Star field canvas */}
      <StarCanvas reduced={reduced} />

      {/* Layer 1 — Spectral gradient flows */}
      <SpectralFlow reduced={reduced} />

      {/* Layer 2 — Aurora ribbons */}
      {CFG.aurora.map((a, i) => (
        <AuroraRibbon key={i} cfg={a} index={i} reduced={reduced} />
      ))}

      {/* Layer 3 — Floating orbs */}
      {CFG.orbs.map((o, i) => (
        <FloatingOrb key={i} cfg={o} reduced={reduced} />
      ))}

      {/* Layer 4 — Caustic shimmer */}
      <CausticShimmer reduced={reduced} />

      {/* Layer 5 — SVG grain noise */}
      <NoiseLayer />

      {/* Layer 6 — Multi-edge vignette */}
      <Vignette />
    </div>
  );
}