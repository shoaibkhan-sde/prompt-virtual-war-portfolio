/**
 * @module Logger
 * @description Browser-safe structured logger for the Atmos React frontend.
 *
 * Wraps the native `console.*` methods with a structured context object so that
 * log entries carry a consistent `event` label and optional metadata payload.
 * This avoids bare string `console.log` calls scattered across components while
 * keeping the bundle free from Node.js-only dependencies (e.g., Winston).
 *
 * @example
 * ```typescript
 * import { clientLogger } from '../utils/logger';
 * clientLogger.warn('server_offline', { error: err.message });
 * clientLogger.info('emission_logged', { category, co2eKg: emissions });
 * ```
 */

/** Shape of a structured browser log entry. */
interface LogEntry {
  /** Machine-readable event identifier using snake_case naming. */
  event: string;
  /** Optional contextual metadata associated with the event. */
  [key: string]: unknown;
}

/**
 * Formats and forwards a structured log entry to the browser console.
 *
 * @param {string} level - Console method to invoke (`'log'`, `'warn'`, `'error'`).
 * @param {string} event - Machine-readable event name (e.g., `'server_offline'`).
 * @param {Record<string, unknown>} [meta] - Optional key-value metadata payload.
 * @returns {void}
 */
function log(level: "log" | "warn" | "error", event: string, meta?: Record<string, unknown>): void {
  const entry: LogEntry = { event, ...meta };
  console[level]("[Atmos]", entry);
}

/**
 * Atmos browser-safe structured logger.
 *
 * All frontend modules must use these methods instead of bare `console.*` calls
 * to ensure consistent event-labelled log entries across the application.
 */
export const clientLogger = {
  /**
   * Logs an informational event (maps to `console.log`).
   *
   * @param {string} event - Machine-readable event identifier.
   * @param {Record<string, unknown>} [meta] - Optional metadata payload.
   * @returns {void}
   */
  info(event: string, meta?: Record<string, unknown>): void {
    log("log", event, meta);
  },

  /**
   * Logs a warning event (maps to `console.warn`).
   *
   * @param {string} event - Machine-readable event identifier.
   * @param {Record<string, unknown>} [meta] - Optional metadata payload.
   * @returns {void}
   */
  warn(event: string, meta?: Record<string, unknown>): void {
    log("warn", event, meta);
  },

  /**
   * Logs an error event (maps to `console.error`).
   *
   * @param {string} event - Machine-readable event identifier.
   * @param {Record<string, unknown>} [meta] - Optional metadata payload.
   * @returns {void}
   */
  error(event: string, meta?: Record<string, unknown>): void {
    log("error", event, meta);
  },
};
