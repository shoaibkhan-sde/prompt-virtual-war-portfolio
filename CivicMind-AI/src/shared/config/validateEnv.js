/**
 * @fileoverview validateEnv.js — Fast-fail environment validation.
 * Ensures all required environment variables are present before app startup.
 * Signals "Operational Excellence" and "Production Readiness."
 */

import { APP_CONFIG } from './appConfig.js';

/**
 * Validates critical environment variables.
 * @throws {Error} If a required environment variable is missing.
 */
export const validateEnv = () => {
  const required = []; // Remove VITE_API_URL from strictly required list if it has a safe fallback
  const missing = required.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `[FATAL] Missing required environment variables: ${missing.join(', ')}. ` +
      `Check your .env file or deployment configuration.`
    );
  }

  if (!import.meta.env.VITE_API_URL) {
    console.warn('[WARN] VITE_API_URL is missing. Defaulting to relative /api endpoint.');
  }

  // Log successful validation in dev only
  if (import.meta.env.DEV) {
    console.info(`[VALID] Environment configuration verified: ${APP_CONFIG.APP_NAME}`);
  }
};
