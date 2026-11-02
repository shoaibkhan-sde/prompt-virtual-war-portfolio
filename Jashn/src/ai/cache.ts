/**
 * In-memory response cache with TTL for celebration assistant queries.
 * Zero external dependencies.
 */

import { AssistantResponse } from './schemas';

interface CacheEntry {
  response: AssistantResponse;
  expiresAt: number;
}

export class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxEntries: number;
  private defaultTtlMs: number;

  constructor(maxEntries = 100, defaultTtlMs = 10 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.defaultTtlMs = defaultTtlMs;
  }

  public get(key: string, now = Date.now()): AssistantResponse | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.response;
  }

  public set(
    key: string,
    response: AssistantResponse,
    ttlMs = this.defaultTtlMs,
    now = Date.now()
  ): void {
    if (this.cache.size >= this.maxEntries) {
      // Evict oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      response,
      expiresAt: now + ttlMs,
    });
  }

  public generateKey(query: string, planId: string, budget: number): string {
    const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ');
    return `${planId}:${budget}:${normalized}`;
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }
}

export const globalAssistantCache = new ResponseCache();
