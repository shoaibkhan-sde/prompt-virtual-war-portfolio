/**
 * firebase.js
 * Frontend Firebase Initialization
 */
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// --- Hardened Initialization ---
let app;
let auth = null;
let googleProvider = null;
let isFirebaseEnabled = false;

// Basic validation to detect placeholders and prevent auth/invalid-api-key crash
const isConfigValid = 
  firebaseConfig.apiKey && 
  !firebaseConfig.apiKey.includes('YOUR_') && 
  firebaseConfig.appId && 
  !firebaseConfig.appId.includes('abcdef');

if (isConfigValid) {
  try {
    console.log("[FIREBASE] Initializing with Project:", firebaseConfig.projectId);
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    isFirebaseEnabled = true;
    console.log("[OK] Firebase Initialized successfully.");
  } catch (err) {
    console.error("[CRITICAL] Firebase Initialization Failed:", err.message);
  }
} else {
  console.warn("[WARN] Firebase Config is missing or contains placeholders. Google Authentication will be disabled.");
  console.debug("Config Check:", { 
    hasApiKey: !!firebaseConfig.apiKey, 
    hasAppId: !!firebaseConfig.appId,
    env: import.meta.env.MODE 
  });
}

export { auth, googleProvider, isFirebaseEnabled };
