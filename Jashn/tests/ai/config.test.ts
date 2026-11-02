import { describe, it, expect } from 'vitest';
import { ModelFailoverManager } from '@/ai/config';

describe('ai/config', () => {
  it('initializes with ordered models in priority order', () => {
    const manager = new ModelFailoverManager({
      models: ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
      cooldownMs: 60000,
    });

    expect(manager.getAvailableModels()).toEqual([
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
    ]);
  });

  it('marks a model in cooldown and skips it during cooldown window', () => {
    const manager = new ModelFailoverManager({
      models: ['m1', 'm2', 'm3'],
      cooldownMs: 10000,
    });

    const now = 100000;
    manager.markCooldown('m1', now);

    expect(manager.isModelInCooldown('m1', now)).toBe(true);
    expect(manager.isModelInCooldown('m2', now)).toBe(false);

    // Available models should exclude m1
    expect(manager.getAvailableModels(now)).toEqual(['m2', 'm3']);

    // After cooldown period expires, m1 is available again
    expect(manager.getAvailableModels(now + 15000)).toEqual(['m1', 'm2', 'm3']);
    expect(manager.isModelInCooldown('m1', now + 15000)).toBe(false);
  });

  it('resets cooldowns on demand', () => {
    const manager = new ModelFailoverManager({
      models: ['m1', 'm2'],
      cooldownMs: 10000,
    });

    manager.markCooldown('m1');
    manager.markCooldown('m2');
    expect(manager.getAvailableModels().length).toBe(0);

    manager.resetCooldowns();
    expect(manager.getAvailableModels().length).toBe(2);
  });
});
