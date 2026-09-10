/**
 * @fileoverview Custom logger utility for CivicMind AI.
 * Provides structured logging that is suppressed in production
 * to eliminate console.log statements from production builds.
 */

// Use process.env.NODE_ENV — works in both Vite (via define) and Jest (built-in)
// Jest sets NODE_ENV='test'; Vite sets it to 'development' or 'production'
const isDev = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';

/**
 * @typedef {Object} Logger
 * @property {Function} info - Log informational messages (dev only)
 * @property {Function} warn - Log warnings (dev only)
 * @property {Function} error - Log errors (always shown, prefixed)
 * @property {Function} debug - Log debug data (dev only)
 */

/** @type {Logger} Application logger */
const logger = {
  /**
   * Logs an informational message. No-op in production.
   * @param {string} message - Log message
   * @param {...*} args - Additional arguments
   */
  info(message, ...args) {
    if (isDev) {
      console.info(`[CivicMind] ${message}`, ...args);
    }
  },

  /**
   * Logs a warning. No-op in production.
   * @param {string} message - Warning message
   * @param {...*} args - Additional arguments
   */
  warn(message, ...args) {
    if (isDev) {
      console.warn(`[CivicMind] ⚠ ${message}`, ...args);
    }
  },

  /**
   * Logs an error. Always shown, even in production, as errors are critical.
   * @param {string} message - Error message
   * @param {Error|*} [error] - Error object or additional context
   */
  error(message, error) {
    console.error(`[CivicMind] ✖ ${message}`, error ?? '');
  },

  /**
   * Logs debug data. No-op in production.
   * @param {string} label - Data label
   * @param {*} data - Data to inspect
   */
  debug(label, data) {
    if (isDev) {
      console.debug(`[CivicMind:debug] ${label}`, data);
    }
  },
};

export default logger;
