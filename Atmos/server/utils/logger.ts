/**
 * @module Logger
 * @description Structured server-side logger for the Atmos API.
 *
 * Provides a Winston-based logger with two output modes:
 * - **Development**: Colorized, human-readable console output.
 * - **Production**: JSON-structured output for log aggregation pipelines.
 *
 * All server modules must use this logger instead of `console.*` to ensure
 * consistent, machine-parseable log entries with service metadata.
 *
 * @example
 * ```typescript
 * import { logger } from '../utils/logger.js';
 * logger.info({ event: 'emission_logged', userId, co2eKg });
 * logger.error({ event: 'db_write_failed', error: err.message });
 * ```
 */

import { createLogger, format, transports } from "winston";

const { combine, timestamp, errors, json, colorize, simple } = format;

/**
 * Determines the active log level from the `LOG_LEVEL` environment variable.
 * Defaults to `'info'` if unset.
 *
 * @returns {string} The resolved log level string.
 */
function resolveLogLevel(): string {
  return process.env.LOG_LEVEL ?? "info";
}

/**
 * Builds the Winston transport array appropriate for the current environment.
 * - In development: colorized + simple text format for readability.
 * - In production/test: JSON format for structured log ingestion.
 *
 * @returns {transports.ConsoleTransportInstance[]} Array of configured transports.
 */
function buildTransports(): transports.ConsoleTransportInstance[] {
  const isDev = process.env.NODE_ENV === "development";
  return [
    new transports.Console({
      format: isDev ? combine(colorize(), simple()) : combine(timestamp(), json()),
    }),
  ];
}

/**
 * Atmos structured application logger.
 *
 * Wraps Winston with service metadata (`service: 'atmos-api'`) and
 * stack-trace capture on error objects. All log entries include an ISO
 * timestamp in production mode.
 */
export const logger = createLogger({
  level: resolveLogLevel(),
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: "atmos-api" },
  transports: buildTransports(),
});
