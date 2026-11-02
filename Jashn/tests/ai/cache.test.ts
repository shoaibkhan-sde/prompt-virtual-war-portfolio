import { describe, it, expect } from 'vitest';
import { ResponseCache } from '@/ai/cache';
import { AssistantResponse } from '@/ai/schemas';

describe('ai/cache', () => {
  const sampleResponse: AssistantResponse = {
    reply: 'Sample reply',
    intent: 'general_advice',
    source: 'gemini',
    modelUsed: 'gemini-2.5-flash',
    timestamp: '2026-10-25T00:00:00.000Z',
  };

  it('stores and retrieves cached assistant responses', () => {
    const cache = new ResponseCache(10, 5000);
    const key = cache.generateKey('cut 10%', 'plan-1', 1000000);

    cache.set(key, sampleResponse);
    const retrieved = cache.get(key);
    expect(retrieved).toEqual(sampleResponse);
  });

  it('evicts entries when TTL expires', () => {
    const cache = new ResponseCache(10, 5000);
    const now = 10000;
    cache.set('key-1', sampleResponse, 2000, now);

    // Before expiration
    expect(cache.get('key-1', now + 1000)).toEqual(sampleResponse);
    // After expiration
    expect(cache.get('key-1', now + 3000)).toBeNull();
  });

  it('evicts oldest entry when reaching max capacity', () => {
    const cache = new ResponseCache(2, 60000);
    cache.set('k1', sampleResponse);
    cache.set('k2', sampleResponse);
    cache.set('k3', sampleResponse);

    expect(cache.size()).toBe(2);
    expect(cache.get('k1')).toBeNull(); // Evicted
    expect(cache.get('k3')).toEqual(sampleResponse);
  });

  it('clears all entries', () => {
    const cache = new ResponseCache();
    cache.set('k1', sampleResponse);
    cache.clear();
    expect(cache.size()).toBe(0);
  });
});
