import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'lucide-react';

// Components
import ThemeToggle from './components/ThemeToggle';
import TabNav from './components/TabNav';
import VenueSearchModal from './components/VenueSearchModal';
import DestinationModal from './components/DestinationModal';

// Pages
import OverviewPage from './pages/OverviewPage';
import CrowdPage from './pages/CrowdPage';
import GatesPage from './pages/GatesPage';
import AlertsPage from './pages/AlertsPage';
import AssistantPage from './pages/AssistantPage';
import MapPage from './pages/MapPage';
import LoginPage from './pages/LoginPage';
import BackgroundAtmosphere from './components/BackgroundAtmosphere';

// Context & Hooks
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OnboardingProvider, useOnboarding } from './context/OnboardingContext';
import { socket } from './socket';
import { useAlerts } from './hooks/useAlerts';
import { useWaitTimes } from './hooks/useWaitTimes';

/**
 * HEADER COMPONENT
 */
function Header({ connected, onLoginClick }) {
  const { token, logout } = useAuth();
  
  return (
    <header className="relative z-50 shrink-0 backdrop-blur-xl bg-theme-card/70 border-b border-theme-main transition-colors duration-500" role="banner">
      <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-blue flex items-center justify-center text-white font-black text-base">
            V
          </div>
          <div>
            <h1 className="text-base font-bold text-theme-primary leading-tight font-display tracking-tight">VenueFlow AI</h1>
            <p className="text-[10px] text-theme-secondary font-bold uppercase tracking-widest opacity-60">Venue Intelligence System</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div 
            className="hidden sm:flex items-center gap-2.5 text-[12px] font-bold text-theme-secondary opacity-80 uppercase tracking-widest"
            role="status"
            aria-live="polite"
          >
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
            <span>{connected ? 'Live' : 'Offline'}</span>
          </div>
          <div className="w-px h-6 bg-theme-main/50" />
          <ThemeToggle />
          <button 
            onClick={token ? logout : onLoginClick}
            className={`flex items-center justify-center p-2 rounded-xl bg-theme-main/5 hover:bg-theme-main/10 transition-all cursor-pointer shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-accent-blue
              ${token ? 'text-theme-secondary hover:text-red-500' : 'text-accent-blue bg-accent-blue/5 border border-accent-blue/20 hover:bg-accent-blue/10'}`}
            title={token ? "Logout" : "Sign In"}
          >
            <User size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-theme-main py-6 text-center transition-colors">
      <p className="text-[10px] text-theme-secondary font-mono tracking-widest opacity-60 uppercase">
        VenueFlow AI · Google Build with AI · {new Date().getFullYear()}
      </p>
    </footer>
  );
}

/**
 * COMPONENT ERROR BOUNDARY
 */
class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("Page Error:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
          </div>
          <h2 className="text-xl font-black text-theme-primary mb-2">Component Crashed</h2>
          <p className="text-sm text-theme-secondary max-w-md">The view encountered a runtime error. This has been logged, and the rest of the application remains functional.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-8 px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
          >
            Refresh Interface
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp({ onLoginClick }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [messages, setMessages] = useState([]); // Persistent chat history session
  const [connected, setConnected] = useState(socket?.connected || false);
  const { resetOnboarding } = useOnboarding();

  const alerts = useAlerts(10) || [];
  const { zones } = useWaitTimes() || { zones: [] };

  const alertCount = alerts.length;
  const hasCriticalZone = useMemo(() => zones?.some(z => z.status === 'critical') || false, [zones]);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    const tabNames = {
      overview: 'Home',
      crowd: 'Crowd',
      gates: 'Best Gate',
      alerts: 'Live Updates',
      assistant: 'Ask AI',
      map: 'Map'
    };
    document.title = `VenueFlow AI | ${tabNames[activeTab] || 'Intelligence'}`;

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [activeTab]);

  useEffect(() => {
    const handleAction = (e) => {
      const { tab, message, zoneId } = e.detail;
      if (tab) setActiveTab(tab);
      if (message) localStorage.setItem('venueflow_queued_message', message);
      if (tab === 'map' && zoneId) localStorage.setItem('venueflow_focus_zone', zoneId);
    };
    window.addEventListener('venueflow:action', handleAction);
    return () => window.removeEventListener('venueflow:action', handleAction);
  }, []);

  useEffect(() => {
    const handleReset = () => resetOnboarding();
    window.addEventListener('venueflow:reset', handleReset);
    return () => window.removeEventListener('venueflow:reset', handleReset);
  }, [resetOnboarding]);

  return (
    // FIX: overflow-hidden on root prevents any child from leaking outside viewport width
    <div className="h-screen flex flex-col bg-theme-page text-theme-primary selection:bg-accent-blue/20 overflow-hidden font-sans">
      <Header connected={connected} onLoginClick={onLoginClick} />
      <TabNav activeTab={activeTab} setActiveTab={setActiveTab} alertCount={alertCount} hasCriticalZone={hasCriticalZone} />
      {/*
        FIX: Added overflow-x-hidden explicitly.
        CSS spec: setting overflow-y:auto implicitly computes overflow-x as 'auto'
        when overflow-x was 'visible', which creates a horizontal scrollbar on
        any overflowing child. overflow-x-hidden eliminates this entirely.
      */}
      <main className="flex-1 w-full mx-auto relative overflow-y-auto overflow-x-hidden flex flex-col md:px-4 md:pt-4 md:pb-4">
        <PageErrorBoundary>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.01 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="w-full h-full flex-1 flex flex-col"
            >
              {activeTab === 'overview' && <OverviewPage />}
              {activeTab === 'crowd' && <CrowdPage />}
              {activeTab === 'gates' && <GatesPage />}
              {activeTab === 'alerts' && <AlertsPage alerts={alerts} />}
              {activeTab === 'assistant' && <AssistantPage messages={messages} setMessages={setMessages} />}
              {activeTab === 'map' && <MapPage />}
            </motion.div>
          </AnimatePresence>
        </PageErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}

function AppShell() {
  const { step, setStep, setSelectedVenue, setSelectedDestination, resetOnboarding } = useOnboarding();
  const { token } = useAuth();
  const [showLogin, setShowLogin] = useState(false);


  return (
    <>
      {step === 'venue' && <BackgroundAtmosphere />}
      {/* FIX: overflow-hidden here also prevents the modals from
          accidentally creating horizontal bleed during animations */}
      <div className="relative w-full h-screen bg-transparent overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 'venue' && (
            <motion.div key="venue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="w-full h-full absolute inset-0 z-50">
              <VenueSearchModal onSelect={(venue) => {
                setSelectedVenue(venue);
                setStep('destination');
              }} />
            </motion.div>
          )}
          {step === 'destination' && (
            <motion.div key="destination" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="w-full h-full absolute inset-0 z-50">
              <DestinationModal onSelect={(dest) => {
                setSelectedDestination(dest);
                setStep('done');
              }} />
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          key="mainapp"
          initial={{ opacity: 0 }} 
          animate={{ opacity: step === 'done' ? 1 : 0 }} 
          transition={{ duration: 0.8 }} 
          className="w-full h-full relative z-10"
          style={{ pointerEvents: step === 'done' ? 'auto' : 'none' }}>
          {step === 'done' && <MainApp onLoginClick={() => setShowLogin(true)} />}
        </motion.div>

        {/* Login Overlay */}
        <AnimatePresence>
          {showLogin && (
            <motion.div 
              style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              <LoginPage onClose={() => setShowLogin(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

function RootRouter() {
  return (
    <OnboardingProvider>
      <AppShell />
    </OnboardingProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}