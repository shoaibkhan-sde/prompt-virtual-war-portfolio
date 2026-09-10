/**
 * @fileoverview apiService.js — Unified API interaction layer.
 * Handles base configuration, error processing, and request consistency.
 */

import { handleError } from '../utils/errorHandler';

const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

/**
 * Standard fetch wrapper with timeout and error handling.
 */
async function request(endpoint, options = {}) {
  const { timeout = 10000, ...customConfig } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const config = {
    method: 'GET',
    ...customConfig,
    headers: {
      'Content-Type': 'application/json',
      ...customConfig.headers,
    },
    signal: controller.signal,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    clearTimeout(id);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

export const apiService = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, data, options) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data, options) => request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};
