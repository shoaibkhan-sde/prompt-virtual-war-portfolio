/**
 * @fileoverview App.jsx — CivicMind AI Adventure Shell.
 * Duolingo-style top bar with streak, daily goal, hearts, and league.
 */

import React, { lazy, Suspense, useState, useCallback, useEffect } from 'react';
import { CloudUpload } from 'lucide-react';

import { NavBar, SAGEOwl, ErrorBoundary, Button } from '@/shared/ui';
import { AuthModal, useAuth } from '@/features/auth';
import { XPNotification, XPToast, HeartsBar, LeagueBadge, useXP } from '@/features/gamification';
import { TABS } from '@/shared/utils/constants';
import { DAILY_GOAL_XP } from '@/shared/utils/leagues';

const JourneyMap = lazy(() => import('@/features/learning').then(m => ({ default: m.JourneyMap })));
const CandidateSimulator = lazy(() => import('@/features/simulation').then(m => ({ default: m.CandidateSimulator })));
const SageMentor = lazy(() => import('@/features/learning').then(m => ({ default: m.SageMentor })));
const QuizView = lazy(() => import('@/features/learning').then(m => ({ default: m.QuizView })));
const SettingsView = lazy(() => import('@/features/settings').then(m => ({ default: m.SettingsView })));

function TabFallback() {
  return (
    <div className="suspense-fallback" aria-label="Loading adventure...">
      <div className="spinner" role="status" />
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('civic_active_tab') || TABS.JOURNEY;
  });
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const { xpState, notifications, removeNotification } = useXP();
  const { user, isGuest } = useAuth();
  const [lastLevel, setLastLevel] = useState(xpState.level);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [isVictory, setIsVictory] = useState(false);

  useEffect(() => {
    localStorage.setItem('civic_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (xpState.level > lastLevel) {
      setIsVictory(false);
      setShowLevelUp(true);
      setLastLevel(xpState.level);
    }
  }, [xpState.level, lastLevel, setIsVictory, setShowLevelUp, setLastLevel]);

  useEffect(() => {
    const handleVictory = () => { setIsVictory(true); setShowLevelUp(true); };
    window.addEventListener('civic_victory', handleVictory);
    return () => window.removeEventListener('civic_victory', handleVictory);
  }, []);

  const handleTabChange = useCallback((tabId) => setActiveTab(tabId), []);

  const renderTab = () => {
    switch (activeTab) {
      case TABS.JOURNEY: return <JourneyMap />;
      case TABS.SIMULATE: return <CandidateSimulator />;
      case TABS.MENTOR: return <SageMentor />;
      case TABS.QUIZ: return <QuizView />;
      case TABS.SETTINGS: return <SettingsView />;
      default: return <JourneyMap />;
    }
  };

  // Daily goal progress (capped at 100%)
  const dailyXP = xpState.dailyXP ?? 0;
  const dailyPct = Math.min(100, Math.round((dailyXP / DAILY_GOAL_XP) * 100));
  const goalMet = dailyPct >= 100;

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link sr-only">Skip to main content</a>

      <NavBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        user={user}
        isGuest={isGuest}
        onAvatarClick={() => setAuthModalOpen(true)}
      />

      <main className="main" id="main-content">
        {/* ── Duolingo-style Top Bar ── */}
        <header className="duolingo-topbar">
          {/* Left: SAGE owl + streak */}
          <div className="duolingo-topbar-left">
            <SAGEOwl
              state={xpState.isTodayActive ? 'happy' : 'idle'}
              size={32}
            />
            <div className="streak-display" title="Daily Streak">
              <span className={`streak-flame ${xpState.isTodayActive ? 'active' : ''}`}>🔥</span>
              <span className="streak-count">{xpState.streak}</span>
            </div>
          </div>

          {/* Center: Daily XP goal bar */}
          <div className="daily-goal-center">
            <div className="daily-goal-label">
              <span>{goalMet ? '✅ Daily goal complete!' : `Daily goal · ${dailyXP}/${DAILY_GOAL_XP} XP`}</span>
            </div>
            <div className="daily-goal-track">
              <div
                className={`daily-goal-fill ${goalMet ? 'complete' : ''}`}
                style={{ width: `${dailyPct}%` }}
              />
              {goalMet && <span className="daily-goal-burst">⚡</span>}
            </div>
          </div>

          {/* Right: Hearts + League + XP + Save */}
          <div className="duolingo-topbar-right">
            <HeartsBar />
            <div className="topbar-divider" />
            <LeagueBadge />
            <div className="topbar-divider" />
            <div className="xp-badge-duo" title="Total XP">
              <span className="xp-lightning">⚡</span>
              <span className="xp-value">{xpState.xp.toLocaleString()}</span>
            </div>
            {isGuest && (
              <Button
                variant="save"
                onClick={() => setAuthModalOpen(true)}
                className="badge"
                label="Save"
              >
                <CloudUpload size={14} /> Save
              </Button>
            )}
          </div>
        </header>

        <Suspense fallback={<TabFallback />}>
          <ErrorBoundary>
            <div className="page-content">
              {renderTab()}
            </div>
          </ErrorBoundary>
        </Suspense>
      </main>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />

      {showLevelUp && (
        <XPNotification
          newLevel={xpState.level}
          newTitle={xpState.title}
          isVictory={isVictory}
          onClose={() => { setShowLevelUp(false); setIsVictory(false); }}
        />
      )}

      <div className="xp-toast-container">
        {notifications.map(note => (
          <XPToast key={note.id} amount={note.amount} onComplete={() => removeNotification(note.id)} />
        ))}
      </div>
    </div>
  );
}

export default App;
