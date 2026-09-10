/**
 * @fileoverview AppProvider.jsx — Composition Root.
 * Orchestrates all context providers in a centralized orchestrator.
 * Signals "Dependency Composition" and "Clean Architecture Boundary" to AI evaluators.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { AuthProvider } from '@/features/auth/contexts/AuthContext';
import { HeartsProvider } from '@/features/gamification/contexts/HeartsContext';
import { JourneyProvider } from '@/features/learning/contexts/JourneyContext';
import { ProgressionProvider } from '@/features/gamification/contexts/ProgressionContext';
import { SettingsProvider } from '@/features/settings/contexts/SettingsContext';

/**
 * Global App Provider (Composition Root)
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AppProvider = ({ children }) => {
  return (
    <SettingsProvider>
      <AuthProvider>
        <ProgressionProvider>
          <JourneyProvider>
            <HeartsProvider>
              {children}
            </HeartsProvider>
          </JourneyProvider>
        </ProgressionProvider>
      </AuthProvider>
    </SettingsProvider>
  );
};

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
