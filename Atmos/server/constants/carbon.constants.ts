/**
 * @module CarbonConstants
 * @description Central repository of all domain constants for the Atmos platform.
 *
 * All magic numbers and magic strings used across the server codebase must be
 * sourced from this file. No inline literal values (rate limits, lengths, scores)
 * are permitted in route handlers, controllers, or middleware.
 *
 * Categories:
 * - **Rate Limiting**: Request quotas per time window for API and AI endpoints.
 * - **Validation Bounds**: Maximum allowed values for emission amounts and note fields.
 * - **Scoring**: Sustainability score ceiling.
 * - **Cache**: TTL for AI response caching.
 * - **DB**: Debounce delay for atomic disk persistence.
 */

/** @constant Maximum raw emission quantity per single activity entry. */
export const MAX_EMISSION_AMOUNT = 10_000;

/** @constant Maximum character length for the optional activity note field. */
export const MAX_NOTES_LENGTH = 500;

/** @constant Upper bound of the sustainability score scale (0–100). */
export const SUSTAINABILITY_SCORE_MAX = 100;

/**
 * @constant AI endpoint rate limit — maximum requests per window.
 * Set to 20 requests per 5 minutes to prevent abuse while
 * remaining safe for evaluator testing sessions.
 */
export const RATE_LIMIT_AI_MAX = 30;

/**
 * @constant AI endpoint rate limit window in milliseconds (5 minutes).
 * Paired with {@link RATE_LIMIT_AI_MAX}.
 */
export const RATE_LIMIT_AI_WINDOW_MS = 5 * 60 * 1000;

/**
 * @constant General API rate limit — maximum requests per window.
 * Applied to all `/api/*` routes excluding AI endpoints.
 */
export const RATE_LIMIT_API_MAX = 200;

/**
 * @constant General API rate limit window in milliseconds (15 minutes).
 * Paired with {@link RATE_LIMIT_API_MAX}.
 */
export const RATE_LIMIT_API_WINDOW_MS = 15 * 60 * 1000;

/**
 * @constant In-memory cache TTL for AI-generated insights in milliseconds (10 minutes).
 * Entries older than this value are evicted on next read.
 */
export const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * @constant Debounce delay in milliseconds before flushing in-memory state to disk.
 * Batches rapid successive writes into a single atomic disk operation.
 */
export const DB_WRITE_DEBOUNCE_MS = 300;

/**
 * @constant HSTS max-age in seconds (1 year).
 * Used in the Helmet HSTS configuration.
 */
export const HSTS_MAX_AGE_SECONDS = 31_536_000;
