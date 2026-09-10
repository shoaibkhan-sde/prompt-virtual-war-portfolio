/**
 * @fileoverview Application entry point for CivicMind AI.
 * Mounts the React app using React 18 createRoot API.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AppProvider } from './shared/providers/AppProvider.jsx';
import { validateEnv } from './shared/config/validateEnv.js';

// Fast-fail environment validation
validateEnv();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Make sure index.html contains <div id="root"></div>');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
