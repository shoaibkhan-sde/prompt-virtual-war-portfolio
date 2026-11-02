/**
 * AI Configuration, Ordered Model Failover, and Cooldown Tracker.
 * Under 100 lines, pure and fully testable.
 */

export interface ModelFailoverConfig {
  models: string[];
  cooldownMs: number;
}

export const DEFAULT_AI_CONFIG: ModelFailoverConfig = {
  models: [
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ],
  cooldownMs: 60 * 1000, // 60 seconds cooldown on failure
};

export class ModelFailoverManager {
  private cooldowns: Map<string, number> = new Map();
  private models: string[];
  private cooldownMs: number;

  constructor(config: ModelFailoverConfig = DEFAULT_AI_CONFIG) {
    this.models = [...config.models];
    this.cooldownMs = config.cooldownMs;
  }

  public getAvailableModels(now = Date.now()): string[] {
    return this.models.filter((model) => {
      const cooldownUntil = this.cooldowns.get(model);
      if (!cooldownUntil) return true;
      if (now >= cooldownUntil) {
        this.cooldowns.delete(model);
        return true;
      }
      return false;
    });
  }

  public markCooldown(model: string, now = Date.now()): void {
    this.cooldowns.set(model, now + this.cooldownMs);
  }

  public isModelInCooldown(model: string, now = Date.now()): boolean {
    const until = this.cooldowns.get(model);
    return until !== undefined && now < until;
  }

  public resetCooldowns(): void {
    this.cooldowns.clear();
  }
}
