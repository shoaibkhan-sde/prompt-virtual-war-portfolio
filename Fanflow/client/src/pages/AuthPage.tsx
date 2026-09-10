import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export function AuthPage() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }
      const userData = await res.json();
      setUser(userData);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, fullName })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Registration failed');
      }
      const userData = await res.json();
      setUser(userData);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    }
  };

  const handleGuest = async () => {
    setError('');
    try {
      const res = await fetch('/api/auth/guest', { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to create guest session');
      const userData = await res.json();
      setUser(userData);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    }
  };

  const checkStrength = (val: string) => {
    if (val.length === 0) return { text: 'Use 8+ characters with a number and symbol.', color: '#6f688d' };
    const strong = val.length >= 8 && /\d/.test(val) && /[^A-Za-z0-9]/.test(val);
    if (strong) return { text: 'Strong password.', color: '#2fbf9f' };
    return { text: 'Needs 8+ characters, a number, and a symbol.', color: '#e5533d' };
  };

  const pwStrength = checkStrength(password);

  return (
    <div className="auth-page-wrapper">
      {/* LEFT VISUAL PANEL */}
      <div className="visual-panel">
        <div className="glow amber"></div>
        <div className="glow teal"></div>
        <div className="pitch-arc"></div>

        <div className="brand">
          <span className="logo">F</span>
          <span className="name">Fanflow</span>
          <span className="tag">FAN</span>
        </div>

        <div className="visual-copy">
          <h1>Your matchday, <span>sorted.</span></h1>
          <p>Live crowd density, gate wait times, and accessible routes for every stadium on your World Cup 2026 journey.</p>

          <div className="feature-list">
            <div className="feature-item"><span className="ico">🧭</span>Real-time navigation around the stadium</div>
            <div className="feature-item"><span className="ico">👥</span>Live crowd &amp; gate density alerts</div>
            <div className="feature-item"><span className="ico">♿</span>ADA-accessible route planning</div>
          </div>
        </div>

        <div className="visual-foot">
          MetLife Stadium <span className="live-dot">LIVE</span> &middot; 81,240 fans connected
        </div>
      </div>

      {/* RIGHT AUTH FORM PANEL */}
      <div className="form-panel">
        <div className="auth-card">

          <div className="tabs">
            <button className={`tab-btn ${isSignIn ? 'active' : ''}`} onClick={() => { setIsSignIn(true); setError(''); }}>Sign In</button>
            <button className={`tab-btn ${!isSignIn ? 'active' : ''}`} onClick={() => { setIsSignIn(false); setError(''); }}>Sign Up</button>
          </div>

          {/* SIGN IN VIEW */}
          {isSignIn ? (
            <form onSubmit={handleSignIn}>
              <h2>Welcome back</h2>
              <p className="sub">Sign in to pick up where you left off.</p>

              {error && <div style={{ color: '#e5533d', fontSize: '13px', marginBottom: '15px' }}>{error}</div>}

              <div className="field">
                <label>Email</label>
                <input type="email" placeholder="you@email.com" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="field">
                <label>Password</label>
                <div className="pw-wrap">
                  <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" required value={password} onChange={e => setPassword(e.target.value)} />
                  <button type="button" className="pw-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button>
                </div>
              </div>

              <div className="row-between">
                <label className="remember"><input type="checkbox" /> Remember me</label>
                <a href="#" className="forgot">Forgot password?</a>
              </div>

              <button type="submit" className="btn-primary">Sign In</button>

              <div className="divider">or continue with</div>
              <div className="social-row">
                <button type="button" className="btn-social">🟢 Google</button>
                <button type="button" className="btn-social"> Apple</button>
              </div>

              <button type="button" className="btn-guest" onClick={handleGuest}><span className="dot"></span>Continue as Guest</button>

              <p className="switch-line">Don't have an account? <a onClick={() => { setIsSignIn(false); setError(''); }}>Sign up</a></p>
            </form>
          ) : (
            <form onSubmit={handleSignUp}>
              <h2>Create your account</h2>
              <p className="sub">Join Fanflow to track your matches and stadiums.</p>

              {error && <div style={{ color: '#e5533d', fontSize: '13px', marginBottom: '15px' }}>{error}</div>}

              <div className="field">
                <label>Full name</label>
                <input type="text" placeholder="Alex Rivera" required value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" placeholder="you@email.com" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="field">
                <label>Password</label>
                <div className="pw-wrap">
                  <input type={showPassword ? 'text' : 'password'} placeholder="Create a password" required value={password} onChange={e => setPassword(e.target.value)} />
                  <button type="button" className="pw-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button>
                </div>
                <div className="hint" style={{ color: pwStrength.color }}>{pwStrength.text}</div>
              </div>

              <div className="field" style={{ marginBottom: '6px' }}>
                <label className="remember" style={{ fontSize: '12.5px' }}>
                  <input type="checkbox" required />
                  I agree to the <a href="#" style={{ color: 'var(--accent)' }}>Terms</a> &amp; <a href="#" style={{ color: 'var(--accent)' }}>Privacy Policy</a>
                </label>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '14px' }}>Create Account</button>

              <div className="divider">or continue with</div>
              <div className="social-row">
                <button type="button" className="btn-social">🟢 Google</button>
                <button type="button" className="btn-social"> Apple</button>
              </div>

              <button type="button" className="btn-guest" onClick={handleGuest}><span className="dot"></span>Continue as Guest</button>

              <p className="switch-line">Already have an account? <a onClick={() => { setIsSignIn(true); setError(''); }}>Sign in</a></p>
            </form>
          )}

          <p className="terms">By continuing, you agree to Fanflow's <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.</p>
        </div>
      </div>
    </div>
  );
}
