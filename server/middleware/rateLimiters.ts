/**
 * @module RateLimiters
 * @description Express rate-limiting middleware instances for the Atmos API.
 *
 * Two distinct rate limiters are defined, providing a tiered approach to
 * request throttling:
 *
 * 1. **`aiRateLimiter`** — Applied exclusively to AI endpoints (`/api/insights`,
 *    `/api/chat`). These calls are computationally expensive and may incur Gemini
 *    API costs, so they are throttled more aggressively.
 *
 * 2. **`globalRateLimiter`** — Applied to all other `/api/*` endpoints. Allows
 *    higher throughput for lightweight CRUD operations.
 *
 * All limits are sourced from {@link CarbonConstants} to eliminate magic numbers.
 */

import rateLimit from "express-rate-limit";
import {
  RATE_LIMIT_AI_MAX,
  RATE_LIMIT_AI_WINDOW_MS,
  RATE_LIMIT_API_MAX,
  RATE_LIMIT_API_WINDOW_MS,
} from "../constants/carbon.constants.js";

/**
 * Strict rate limiter for AI-powered Atmos Coach endpoints.
 *
 * Limits each IP to {@link RATE_LIMIT_AI_MAX} requests per
 * {@link RATE_LIMIT_AI_WINDOW_MS} (20 requests / 5 minutes).
 *
 * Applied to: `GET /api/insights`, `POST /api/chat`.
 *
 * Responds with HTTP 429 and a structured error envelope on violation:
 * ```json
 * { "success": false, "error": { "code": "RATE_LIMITED", "message": "..." } }
 * ```
 */
export const aiRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_AI_WINDOW_MS,
  max: RATE_LIMIT_AI_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests to Atmos Coach. Please wait 5 minutes before trying again.",
    },
  },
});

/**
 * General rate limiter applied to all non-AI Atmos API endpoints.
 *
 * Limits each IP to {@link RATE_LIMIT_API_MAX} requests per
 * {@link RATE_LIMIT_API_WINDOW_MS} (200 requests / 15 minutes).
 *
 * Applied to: all routes via `app.use('/api', globalRateLimiter)` in `server.ts`.
 *
 * Responds with HTTP 429 and a structured error envelope on violation:
 * ```json
 * { "success": false, "error": { "code": "RATE_LIMITED", "message": "..." } }
 * ```
 */
export const globalRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_API_WINDOW_MS,
  max: RATE_LIMIT_API_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many general requests. Please wait a moment and try again.",
    },
  },
});
