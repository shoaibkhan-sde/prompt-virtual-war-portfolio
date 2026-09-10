/**
 * @fileoverview Input sanitization utilities for CivicMind AI.
 * All user-supplied text passes through these functions before
 * being sent to the backend or rendered in the DOM.
 */

import DOMPurify from 'dompurify';
import { CHAT_MAX_CHARS } from './constants.js';

/**
 * Strips HTML and script tags from a string, trims whitespace,
 * and validates length constraints.
 *
 * @param {string} text - Raw user input text
 * @returns {string} Cleaned, safe string
 * @throws {Error} If input is empty after trimming
 * @throws {Error} If input exceeds CHAT_MAX_CHARS characters
 *
 * @example
 * sanitizeInput('  Hello <script>alert(1)</script>  ')
 * // returns 'Hello'
 */
export function sanitizeInput(text) {
  if (typeof text !== 'string') {
    throw new Error('Input must be a string');
  }

  // Strip HTML and script tags using regex
  const stripped = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/gi, ' ');

  const trimmed = stripped.trim();

  if (trimmed.length === 0) {
    throw new Error('Input cannot be empty');
  }

  if (trimmed.length > CHAT_MAX_CHARS) {
    throw new Error(`Input must not exceed ${CHAT_MAX_CHARS} characters`);
  }

  return trimmed;
}

/**
 * Sanitizes HTML content for safe DOM insertion using DOMPurify.
 * Allows only safe formatting tags; strips all scripts and event handlers.
 *
 * @param {string} html - Raw HTML string to sanitize
 * @returns {string} Safe HTML string
 *
 * @example
 * sanitizeHTML('<b>Bold</b><script>evil()</script>')
 * // returns '<b>Bold</b>'
 */
export function sanitizeHTML(html) {
  if (typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
}

/**
 * Checks whether the given input string exceeds the maximum character limit.
 *
 * @param {string} text - Input text to check
 * @returns {boolean} True if text is over the limit
 */
export function isOverLimit(text) {
  return typeof text === 'string' && text.length > CHAT_MAX_CHARS;
}

/**
 * Returns the number of characters remaining before hitting the limit.
 *
 * @param {string} text - Current input text
 * @returns {number} Characters remaining (can be negative if over limit)
 */
export function charsRemaining(text) {
  return CHAT_MAX_CHARS - (typeof text === 'string' ? text.length : 0);
}
