import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, isFirebaseEnabled } from '../services/firebase';
import { signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('venueflow_token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety Force-Render: If Firebase listener hangs (CSP or network issue), 
    // we force render after 3s to allow Guest access.
    const safetyTimer = setTimeout(() => {
      if (loading) {
        console.warn("[AUTH] Production safety timeout (5s) reached - Rendering Guest UI.");
        setLoading(false);
      }
    }, 5000);

    if (!isFirebaseEnabled || !auth) {
      setLoading(false);
      clearTimeout(safetyTimer);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setToken(firebaseUser.uid);
      }
      setLoading(false);
      clearTimeout(safetyTimer);
    });
    return () => {
      unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  const loginWithGoogle = async () => {
    if (!isFirebaseEnabled || !auth) {
      return { success: false, error: 'Google Login is currently unavailable (Firebase not initialized).' };
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return { success: true, user: result.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const login = async (username, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('venueflow_token', data.token);
        setToken(data.token);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: 'Connection failed' };
    }
  };

  const register = async (username, password) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: 'Connection failed' };
    }
  };

  const logout = async () => {
    localStorage.removeItem('venueflow_token');
    setToken('');
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, loginWithGoogle, register, logout, isFirebaseEnabled }}>
      {(!loading || !isFirebaseEnabled) && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
