/**
 * @fileoverview useAuth hook — single source of truth for authentication state.
 * Manages Firebase Anonymous Auth, Google Sign-In, Email/Password auth,
 * and sign-out. Any component needing auth state uses this hook.
 */

import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext.jsx';

/**
 * Custom hook that provides the AuthContext values.
 * Must be used within an <AuthProvider>.
 *
 * @returns {AuthState}
 */
function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;
