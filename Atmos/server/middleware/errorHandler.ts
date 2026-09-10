/**
 * @module ErrorHandler
 * @description Global Express error-handling middleware for the Atmos API server.
 *
 * Intercepts all errors passed via `next(err)` and returns a sanitized, structured
 * JSON envelope to the client. In production, stack traces and internal messages
 * are suppressed to prevent information leakage to potential attackers.
 *
 * All caught errors are logged via the structured logger with full context
 * (timestamp, route, HTTP method, stack trace) for observability.
 *
 * Response envelope:
 * ```json
 * { "success": false, "error": { "code": "ERROR_CODE", "message": "..." } }
 * ```
 */

import { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

/**
 * Application error with optional HTTP status code and machine-readable error code.
 * Throw this (or a subclass) from route handlers and controllers to produce
 * structured HTTP error responses.
 *
 * @example
 * ```typescript
 * const err: AppError = new Error('Activity not found') as AppError;
 * err.status = 404;
 * err.code = 'NOT_FOUND';
 * next(err);
 * ```
 */
export interface AppError extends Error {
  /** HTTP status code to send in the response. Defaults to 500 if absent. */
  status?: number;
  /** Machine-readable error code string (e.g., `'VALIDATION_ERROR'`, `'NOT_FOUND'`). */
  code?: string;
}

/**
 * Global Express error-handling middleware.
 *
 * Must be registered as the **last** `app.use()` call in `server.ts` to catch
 * all errors forwarded by route handlers and middleware via `next(err)`.
 *
 * @param {AppError} err - The error object forwarded from the failing middleware or route.
 * @param {Request} req - The Express request object (used for logging route context).
 * @param {Response} res - The Express response object used to send the error envelope.
 * @param {NextFunction} _next - Unused; required by Express's 4-argument error-handler signature.
 * @returns {void}
 * @throws Never — this function is a terminal error handler and must not re-throw.
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const route = req.originalUrl;
  const method = req.method;

  logger.error({
    event: "unhandled_request_error",
    method,
    route,
    status: err.status || 500,
    code: err.code || "INTERNAL_ERROR",
    message: err.message,
    stack: err.stack,
  });

  const status = err.status || 500;
  const errorCode = err.code || "INTERNAL_ERROR";

  // In production, suppress internal error messages to prevent information leakage
  const isProduction = env.NODE_ENV === "production";
  const errorMessage =
    isProduction && status >= 500
      ? "An internal server error occurred. Details have been logged."
      : err.message || "An internal server error occurred.";

  res.status(status).json({
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
    },
  });
};
