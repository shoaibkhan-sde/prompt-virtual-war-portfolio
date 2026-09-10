import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig, AnimatePresence } from 'framer-motion';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { FanConciergePage } from './pages/FanConciergePage';
import { OpsWorkspacePage } from './pages/OpsWorkspacePage';
import { VisualizerPage } from './pages/VisualizerPage';
import { AuthPage } from './pages/AuthPage';
import { LoadingScreen } from './components/LoadingScreen';
import { useAuth } from './context/AuthContext';
import { MatchProvider } from './context/MatchContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-[#0e0b1a] text-white">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  const [showLoader, setShowLoader] = useState(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('fanflow-loaded');
    }
    return true;
  });

  return (
    <MatchProvider>
      <MotionConfig reducedMotion="user">
        <AnimatePresence mode="wait">
          {showLoader && (
            <LoadingScreen
              onComplete={() => {
                sessionStorage.setItem('fanflow-loaded', 'true');
                setShowLoader(false);
              }}
            />
          )}
        </AnimatePresence>

        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Home />} />
              <Route path="fan" element={<FanConciergePage />} />
              <Route path="ops" element={<OpsWorkspacePage />} />
              <Route path="visualizer" element={<VisualizerPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </MotionConfig>
    </MatchProvider>
  );
}

export default App;
