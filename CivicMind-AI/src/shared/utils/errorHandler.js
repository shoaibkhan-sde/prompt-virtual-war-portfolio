/**
 * @fileoverview errorHandler.js — Unified client-side error handling.
 * Provides a central point for logging and processing application errors.
 */

export const handleError = (error, context = 'Global') => {
  // 1. Log to console in development
  if (import.meta.env.DEV) {
    console.error(`[ERROR][${context}]`, error);
  }

  // 2. Extract message
  const message = error?.response?.data?.message || error?.message || 'An unexpected error occurred';

  // 3. Optional: Send to external monitoring service (e.g., Sentry)
  // if (import.meta.env.PROD) { ... }

  return {
    message,
    originalError: error,
    context
  };
};

/**
 * Wraps an async function with standard error handling.
 */
export const withErrorHandling = (fn, context) => async (...args) => {
  try {
    return await fn(...args);
  } catch (error) {
    return handleError(error, context);
  }
};
