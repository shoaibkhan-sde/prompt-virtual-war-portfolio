import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2, User, Mail, Lock, X } from 'lucide-react';

/* ─────────────────────────────────────────────
   🔧  UTILITY — password strength
───────────────────────────────────────────── */
function getPasswordStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const map = [
    { label: 'Too weak', color: '#ef4444' },
    { label: 'Weak', color: '#f97316' },
    { label: 'Fair', color: '#eab308' },
    { label: 'Strong', color: '#22c55e' },
    { label: 'Very strong', color: '#06b6d4' },
  ];
  return { score, ...map[score] };
}

/* ─────────────────────────────────────────────
   🏏  LOGO — Premium Bat & Ball SVG
───────────────────────────────────────────── */
function BatBallLogo() {
  return (
    <div className="relative w-[88px] h-[88px] mx-auto mb-7 flex items-center justify-center">
      {/* Glow rings */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(26,115,232,0.35) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.35, 1], opacity: [0.7, 0.2, 0.7] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -inset-4 rounded-full border border-[#1a73e8]/15"
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.1, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      {/* Circle backdrop */}
      <div
        className="relative w-[88px] h-[88px] rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(145deg, rgba(26,115,232,0.18) 0%, rgba(6,182,212,0.08) 100%)',
          border: '1px solid rgba(26,115,232,0.25)',
          boxShadow: '0 0 32px rgba(26,115,232,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* ── Cricket Bat blade ── */}
          <rect x="22" y="6" width="11" height="26" rx="5.5" fill="url(#batGrad)" />
          {/* Bat edge highlight */}
          <rect x="22" y="6" width="3" height="26" rx="1.5" fill="rgba(255,255,255,0.15)" />
          {/* Bat spine */}
          <rect x="26.5" y="9" width="1.5" height="20" rx="0.75" fill="rgba(255,255,255,0.12)" />

          {/* ── Handle ── */}
          <rect x="24.5" y="30" width="6" height="14" rx="3" fill="url(#handleGrad)" />
          {/* Grip wrap */}
          <line x1="24.5" y1="33" x2="30.5" y2="33" stroke="rgba(255,255,255,0.22)" strokeWidth="1" strokeLinecap="round" />
          <line x1="24.5" y1="36" x2="30.5" y2="36" stroke="rgba(255,255,255,0.22)" strokeWidth="1" strokeLinecap="round" />
          <line x1="24.5" y1="39" x2="30.5" y2="39" stroke="rgba(255,255,255,0.22)" strokeWidth="1" strokeLinecap="round" />

          {/* ── Cricket Ball ── */}
          <circle cx="12" cy="38" r="9" fill="url(#ballGrad)" />
          {/* Seams */}
          <path d="M 5 38 Q 9 32, 12 31 Q 15 30, 19 38" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M 5 38 Q 9 44, 12 45 Q 15 46, 19 38" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          {/* Stitch marks */}
          <line x1="7" y1="35" x2="9" y2="33" stroke="rgba(255,255,255,0.32)" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="10" y1="33" x2="12" y2="31" stroke="rgba(255,255,255,0.32)" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="7" y1="41" x2="9" y2="43" stroke="rgba(255,255,255,0.32)" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="10" y1="43" x2="12" y2="45" stroke="rgba(255,255,255,0.32)" strokeWidth="0.8" strokeLinecap="round" />
          {/* Shine */}
          <ellipse cx="9" cy="34" rx="2.5" ry="1.5" fill="rgba(255,255,255,0.22)" />

          <defs>
            <linearGradient id="batGrad" x1="22" y1="6" x2="33" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#d4a96a" />
              <stop offset="50%" stopColor="#b8863e" />
              <stop offset="100%" stopColor="#8b5e1e" />
            </linearGradient>
            <linearGradient id="handleGrad" x1="24.5" y1="30" x2="30.5" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6b7280" />
              <stop offset="100%" stopColor="#374151" />
            </linearGradient>
            <radialGradient id="ballGrad" cx="40%" cy="35%" r="60%" gradientUnits="objectBoundingBox">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="50%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Trophy badge */}
      <div
        className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm"
        style={{
          background: 'linear-gradient(135deg, #1a73e8, #06b6d4)',
          borderColor: '#060810',
          boxShadow: '0 0 10px rgba(26,115,232,0.6)',
        }}
      >
        🏆
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   🔧  INPUT — icon never touches placeholder
   Key fix: icon column = 48 px wide, input
   paddingLeft = 48 px (same value, no gap).
───────────────────────────────────────────── */
const ICON_COL = 48; // px — must match on both icon div width and input paddingLeft

function GlowInput({
  id, label, type = 'text', placeholder, value, onChange,
  icon: Icon, required, rightSlot, autoComplete, errorMsg,
}) {
  const [focused, setFocused] = useState(false);
  const hasValue = value.length > 0;
  const ACCENT = '#1a73e8';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* Label */}
      <label
        htmlFor={id}
        style={{
          fontSize: '10px',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.22em',
          marginLeft: '2px',
          color: focused ? ACCENT : 'rgba(255,255,255,0.32)',
          transition: 'color 0.2s',
        }}
      >
        {label} <span style={{ color: ACCENT }}>*</span>
      </label>

      {/* Wrapper */}
      <div style={{ position: 'relative' }}>
        {/* Focus ring */}
        <div
          style={{
            position: 'absolute', inset: 0, borderRadius: '12px',
            pointerEvents: 'none',
            transition: 'box-shadow 0.35s',
            boxShadow: focused
              ? `0 0 0 1.5px ${ACCENT}, 0 0 16px rgba(26,115,232,0.22)`
              : '0 0 0 1px rgba(255,255,255,0.08)',
          }}
        />

        {/* Icon column — fixed width, flex-centred */}
        <div
          style={{
            position: 'absolute', top: 0, bottom: 0, left: 0,
            width: `${ICON_COL}px`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
            color: focused || hasValue ? ACCENT : 'rgba(255,255,255,0.22)',
            transition: 'color 0.25s',
          }}
        >
          <Icon size={16} strokeWidth={2} />
        </div>

        {/* Input — paddingLeft === ICON_COL so text starts after icon */}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          required={required}
          value={value}
          autoComplete={autoComplete}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            borderRadius: '12px',
            paddingTop: '14px',
            paddingBottom: '14px',
            paddingLeft: `${ICON_COL}px`,
            paddingRight: rightSlot ? `${ICON_COL}px` : '16px',
            fontSize: '13.5px',
            color: '#fff',
            background: focused ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
            border: 'none',
            outline: 'none',
            transition: 'background 0.25s',
          }}
        />

        {/* Right slot (eye toggle) */}
        {rightSlot && (
          <div
            style={{
              position: 'absolute', top: 0, bottom: 0, right: 0,
              width: `${ICON_COL}px`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {rightSlot}
          </div>
        )}
      </div>

      {/* Field error */}
      <AnimatePresence>
        {errorMsg && (
          <motion.p
            key="ferr"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9.5px', fontWeight: 600, marginLeft: '2px', color: '#fca5a5' }}
          >
            <AlertCircle size={10} /> {errorMsg}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────
   🔧  Password strength bar
───────────────────────────────────────────── */
function StrengthBar({ password }) {
  const { score, label, color } = getPasswordStrength(password);
  if (!password) return null;
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '4px' }}
    >
      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ height: '2px', flex: 1, borderRadius: '9999px', transition: 'background 0.5s', background: i < score ? color : 'rgba(255,255,255,0.08)' }} />
        ))}
      </div>
      <p style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color }}>{label}</p>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   🎯  MAIN PAGE
───────────────────────────────────────────── */
export default function LoginPage({ onClose }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const cardRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [2.5, -2.5]), { stiffness: 120, damping: 22 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-3.5, 3.5]), { stiffness: 120, damping: 22 });

  const { login, register, loginWithGoogle } = useAuth();

  const onMouseMove = e => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - r.left) / r.width - 0.5);
    mouseY.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  const validate = () => {
    const e = {};
    if (!email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Minimum 8 characters';
    if (mode === 'signup' && !displayName.trim()) e.displayName = 'Display name is required';
    if (mode === 'signup' && !agreedToTerms) e.terms = 'You must agree to the terms';
    return e;
  };

  const handleSubmit = async ev => {
    ev.preventDefault();
    setError('');
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setIsLoading(true);
    try {
      if (mode === 'signin') {
        const r = await login(email, password, rememberMe);
        if (!r.success) setError(r.error || 'Invalid credentials. Try again.');
        else {
          setSuccess(true);
          // Auto-close overlay after success animation
          if (onClose) setTimeout(onClose, 2000);
        }
      } else {
        const r = await register(email, password, displayName);
        if (r.success) { 
          setSuccess(true); 
          await login(email, password);
          // Auto-close overlay after success animation
          if (onClose) setTimeout(onClose, 2000);
        }
        else setError(r.error || 'Registration failed. Please try again.');
      }
    } catch { setError('An unexpected error occurred.'); }
    finally { setIsLoading(false); }
  };

  const switchMode = m => { setMode(m); setError(''); setFieldErrors({}); setSuccess(false); };

  const particles = [
    { w: 3, h: 3, bg: '#1a73e8', top: '12%', left: '6%', op: 0.55, dur: 5, del: 0 },
    { w: 4, h: 4, bg: '#06b6d4', top: '22%', right: '8%', op: 0.4, dur: 6.5, del: 1 },
    { w: 2, h: 2, bg: '#fff', top: '58%', left: '4%', op: 0.28, dur: 4.5, del: 2 },
    { w: 5, h: 5, bg: '#1a73e8', top: '72%', right: '6%', op: 0.22, dur: 7, del: 0.5 },
    { w: 3, h: 3, bg: '#dc2626', top: '38%', left: '2.5%', op: 0.38, dur: 5.5, del: 1.5 },
    { w: 2, h: 2, bg: '#fff', top: '82%', right: '11%', op: 0.22, dur: 6, del: 3 },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        .vf-root     { font-family: 'DM Sans', sans-serif; }
        .vf-display  { font-family: 'Syne', sans-serif; }
        ::placeholder { color: rgba(255,255,255,0.2) !important; }
        input { border: none !important; box-shadow: none !important; }
        .custom-cb { accent-color: #1a73e8; }

        @keyframes shimmer {
          0%   { transform: translateX(-120%) skewX(-12deg); }
          100% { transform: translateX(220%)  skewX(-12deg); }
        }
        .btn-shimmer::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.13), transparent);
          animation: shimmer 2.6s ease-in-out infinite;
        }
        .noise-bg {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.032'/%3E%3C/svg%3E");
          background-repeat: repeat; background-size: 180px;
        }
      `}</style>

      <div
        className="vf-root"
        style={{ position: 'relative', minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#060810' }}
      >
        {/* BG image */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <img src="/login-bg.webp" alt="" aria-hidden="true"
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.1)', filter: 'blur(3px) saturate(0.55) brightness(0.32)', userSelect: 'none', pointerEvents: 'none' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 75% 65% at 50% 50%, transparent 0%, rgba(6,8,16,0.58) 55%, rgba(6,8,16,0.97) 100%)' }} />
          <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '7rem', background: 'linear-gradient(to bottom, #060810 0%, transparent 100%)' }} />
          <div style={{ position: 'absolute', inset: 'auto 0 0 0', height: '50%', background: 'linear-gradient(to top, #060810 0%, transparent 100%)' }} />
        </div>

        {/* Noise */}
        <div className="noise-bg" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

        {/* Grid */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />

        {/* Orbs */}
        <div style={{ position: 'absolute', top: '30%', left: '28%', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,115,232,0.09) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '28%', right: '28%', width: '280px', height: '280px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Particles */}
        {particles.map((p, i) => (
          <motion.div key={i}
            style={{ position: 'absolute', width: p.w, height: p.h, borderRadius: '50%', background: p.bg, top: p.top, left: p.left, right: p.right, pointerEvents: 'none', zIndex: 1 }}
            animate={{ y: [0, -26, 0], opacity: [0, p.op, 0], scale: [0.7, 1.2, 0.7] }}
            transition={{ duration: p.dur, repeat: Infinity, delay: p.del, ease: 'easeInOut' }}
          />
        ))}

        {/* ══════════  CARD  ══════════ */}
        <motion.div
          ref={cardRef}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d', position: 'relative', zIndex: 10, width: '100%', maxWidth: '440px', margin: '0 16px' }}
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Gradient border */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '26px', padding: '1px', background: 'linear-gradient(135deg, rgba(26,115,232,0.38) 0%, rgba(6,182,212,0.12) 50%, rgba(255,255,255,0.04) 100%)', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', pointerEvents: 'none' }} />

          {/* Glass body */}
          <div style={{ position: 'relative', borderRadius: '26px', padding: '36px 32px 28px', overflow: 'hidden', background: 'rgba(8,12,26,0.9)', backdropFilter: 'blur(48px) saturate(1.6)', WebkitBackdropFilter: 'blur(48px) saturate(1.6)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 40px 80px rgba(0,0,0,0.68), 0 0 0 1px rgba(26,115,232,0.07), inset 0 1px 0 rgba(255,255,255,0.05)' }}>

            {/* Top highlight bar */}
            <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(26,115,232,0.58) 28%, rgba(6,182,212,0.58) 72%, transparent 100%)', pointerEvents: 'none' }} />

            {/* Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  position: 'absolute', top: '20px', right: '20px',
                  width: '32px', height: '32px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.3)', cursor: 'pointer', zIndex: 50,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.3)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                <X size={16} />
              </button>
            )}

            {/* ── Brand ── */}
            <motion.div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '28px' }}
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.18 }}
            >
              <BatBallLogo />
              <h1
                className="vf-display"
                style={{ fontSize: '2.1rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '0', background: 'linear-gradient(135deg, #ffffff 0%, #a8c8ff 45%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
              >
                VenueFlow AI
              </h1>
            </motion.div>

            {/* ── Tab switcher ── */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              style={{ position: 'relative', display: 'flex', padding: '6px', borderRadius: '14px', marginBottom: '24px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <motion.div
                layoutId="pill"
                style={{
                  position: 'absolute', top: '6px', bottom: '6px', borderRadius: '10px',
                  width: 'calc(50% - 6px)',
                  left: mode === 'signin' ? '6px' : 'calc(50%)',
                  background: 'linear-gradient(135deg, #1a73e8 0%, #0d5dbf 100%)',
                  boxShadow: '0 0 18px rgba(26,115,232,0.4)',
                }}
                transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              />
              {[{ id: 'signin', label: '🔑  Sign In' }, { id: 'signup', label: '✨  Create Account' }].map(t => (
                <button key={t.id} onClick={() => switchMode(t.id)}
                  style={{ position: 'relative', zIndex: 1, flex: 1, padding: '10px 0', borderRadius: '10px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', background: 'none', border: 'none', cursor: 'pointer', color: mode === t.id ? '#fff' : 'rgba(255,255,255,0.32)', transition: 'color 0.25s' }}
                >
                  {t.label}
                </button>
              ))}
            </motion.div>

            {/* ── Global error ── */}
            <AnimatePresence>
              {error && (
                <motion.div key="err"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: '16px' }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', borderRadius: '12px', background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.22)' }}>
                    <AlertCircle size={14} style={{ color: '#ef4444', marginTop: '1px', flexShrink: 0 }} />
                    <p style={{ fontSize: '11px', fontWeight: 600, lineHeight: 1.5, color: '#fca5a5', margin: 0 }}>{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Success ── */}
            <AnimatePresence>
              {success && (
                <motion.div key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '40px 0' }}
                >
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 280, delay: 0.1 }}>
                    <CheckCircle2 size={52} style={{ color: '#22c55e' }} />
                  </motion.div>
                  <p className="vf-display" style={{ color: '#fff', fontWeight: 900, fontSize: '1.15rem', margin: 0 }}>Welcome to VenueFlow!</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.38)', margin: 0 }}>Redirecting to your dashboard…</p>
                  <div style={{ width: '144px', height: '4px', borderRadius: '9999px', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', marginTop: '4px' }}>
                    <motion.div style={{ height: '100%', borderRadius: '9999px', background: 'linear-gradient(90deg, #1a73e8, #06b6d4)' }} initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.6, ease: 'easeInOut' }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Form ── */}
            <AnimatePresence mode="wait">
              {!success && (
                <motion.form
                  key={mode}
                  initial={{ opacity: 0, x: mode === 'signin' ? -16 : 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: mode === 'signin' ? 16 : -16 }}
                  transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                  onSubmit={handleSubmit}
                  style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                  {/* Display name (signup only) */}
                  <AnimatePresence>
                    {mode === 'signup' && (
                      <motion.div key="dn"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <GlowInput
                          id="displayName" label="Display Name" type="text"
                          placeholder="e.g. Shoaib"
                          value={displayName} onChange={e => setDisplayName(e.target.value)}
                          icon={User} required={mode === 'signup'}
                          autoComplete="name" errorMsg={fieldErrors.displayName}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email */}
                  <GlowInput
                    id="email" label="Email Address" type="email"
                    placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    icon={Mail} required autoComplete="email"
                    errorMsg={fieldErrors.email}
                  />

                  {/* Password */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <GlowInput
                      id="password" label="Password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'}
                      value={password} onChange={e => setPassword(e.target.value)}
                      icon={Lock} required
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      errorMsg={fieldErrors.password}
                      rightSlot={
                        <button type="button" onClick={() => setShowPassword(v => !v)}
                          aria-label={showPassword ? 'Hide' : 'Show'}
                          style={{ color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />
                    <AnimatePresence>
                      {mode === 'signup' && <StrengthBar password={password} />}
                    </AnimatePresence>
                  </div>

                  {/* Remember / Forgot (sign in) */}
                  {mode === 'signin' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '-4px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                        <input type="checkbox" className="custom-cb" style={{ width: '14px', height: '14px' }} checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                        <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'rgba(255,255,255,0.36)' }}>Remember me</span>
                      </label>
                      <button type="button"
                        style={{ fontSize: '10.5px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#1a73e8', opacity: 0.72, background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'opacity 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = 0.72}
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {/* Terms (sign up) */}
                  {mode === 'signup' && (
                    <div style={{ marginTop: '-4px' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                        <input type="checkbox" className="custom-cb" style={{ width: '14px', height: '14px', marginTop: '2px', flexShrink: 0 }} checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} />
                        <span style={{ fontSize: '10.5px', fontWeight: 500, lineHeight: 1.5, color: 'rgba(255,255,255,0.32)' }}>
                          I agree to VenueFlow's{' '}
                          <span style={{ textDecoration: 'underline', cursor: 'pointer', color: '#1a73e8' }}>Terms of Service</span>{' '}
                          and{' '}
                          <span style={{ textDecoration: 'underline', cursor: 'pointer', color: '#1a73e8' }}>Privacy Policy</span>
                        </span>
                      </label>
                      {fieldErrors.terms && (
                        <p style={{ fontSize: '9.5px', fontWeight: 600, color: '#fca5a5', marginTop: '4px', marginLeft: '24px' }}>{fieldErrors.terms}</p>
                      )}
                    </div>
                  )}

                  {/* ── Submit button ── */}
                  <div style={{ marginTop: '4px' }}>
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      className="btn-shimmer"
                      style={{
                        position: 'relative', width: '100%', padding: '16px 0', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #1a73e8 0%, #0d5dbf 100%)',
                        boxShadow: '0 0 28px rgba(26,115,232,0.38), inset 0 1px 0 rgba(255,255,255,0.14)',
                        border: 'none', cursor: 'pointer',
                        color: '#fff', fontSize: '11.5px', fontWeight: 900,
                        textTransform: 'uppercase', letterSpacing: '0.2em',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        overflow: 'hidden',
                        opacity: isLoading ? 0.55 : 1,
                        pointerEvents: isLoading ? 'none' : 'auto',
                      }}
                      whileHover={{ scale: 1.012, boxShadow: '0 0 44px rgba(26,115,232,0.52), inset 0 1px 0 rgba(255,255,255,0.14)' }}
                      whileTap={{ scale: 0.985 }}
                    >
                      <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.42), transparent)' }} />
                      {isLoading ? (
                        <>
                          <motion.div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} animate={{ rotate: 360 }} transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }} />
                          <span>Loading…</span>
                        </>
                      ) : (
                        <>
                          <span>{mode === 'signin' ? '🚀  Sign In' : '⚡  Create Account'}</span>
                          <motion.div animate={{ x: [0, 3, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
                            <ArrowRight size={15} />
                          </motion.div>
                        </>
                      )}
                    </motion.button>
                  </div>

                  {/* Divider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                    <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.2)' }}>or</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                  </div>

                  {/* Google SSO */}
                  <motion.button type="button"
                    onClick={async () => {
                      setError('');
                      setIsLoading(true);
                      const r = await loginWithGoogle();
                      if (r.success) {
                        setSuccess(true);
                        if (onClose) setTimeout(onClose, 2000);
                      } else {
                        setError(r.error || 'Google Sign-In failed');
                      }
                      setIsLoading(false);
                    }}
                    style={{ width: '100%', padding: '13px 0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'all 0.25s' }}
                    whileHover={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)' }}
                    whileTap={{ scale: 0.985 }}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.45)' }}>
                      Continue with Google
                    </span>
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* ── Footer ── */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <p style={{ fontSize: '9.5px', textAlign: 'center', color: 'rgba(255,255,255,0.18)', margin: 0 }}>
                By continuing you agree to VenueFlow's{' '}
                <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</span>.
              </p>
              <p style={{ fontSize: '8.5px', fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.1)', margin: 0 }}>
                Secured · AES-256 · Zero-Knowledge Auth
              </p>
            </div>
          </div>

          {/* Reflection */}
          <div style={{ position: 'absolute', inset: 'auto 40px -12px 40px', height: '24px', borderRadius: '0 0 26px 26px', background: 'rgba(26,115,232,0.1)', filter: 'blur(10px)', pointerEvents: 'none' }} />
        </motion.div>

        {/* Version tag */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 10, fontSize: '8.5px', fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.14)', margin: 0 }}
        >
          VenueFlow v2.1.0
        </motion.p>

        {/* Live dot */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
          style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <motion.div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
          <span style={{ fontSize: '8.5px', fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.14)' }}>Live · IPL 2025</span>
        </motion.div>
      </div>
    </>
  );
}
