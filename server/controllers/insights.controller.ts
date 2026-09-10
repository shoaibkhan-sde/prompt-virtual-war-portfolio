/**
 * @module InsightsController
 * @description HTTP controller for the AI-powered Atmos Coach insights endpoint.
 *
 * Coordinates the SHA-256 state-hash cache check, Gemini AI call, local fallback,
 * and cache population for the GET `/api/insights` endpoint. All orchestration
 * logic resides here; the route file only binds middleware and calls this handler.
 */

import { Request, Response } from "express";
import { dbService } from "../services/db.service.js";
import { cacheService } from "../services/cache.service.js";
import { geminiService } from "../services/gemini.service.js";
import { generateLocalCoachData } from "../../src/lib/localInsights.js";
import { logger } from "../utils/logger.js";

/**
 * Handles `GET /api/insights` — returns a personalised Atmos Coach advisory response.
 *
 * Execution flow:
 * 1. Returns a setup prompt if no profile exists.
 * 2. Generates a SHA-256 state hash from the current profile + carbon ledger + offsetTarget.
 * 3. Returns the cached response if the state hash matches a non-expired cache entry.
 * 4. Otherwise, calls `geminiService.generateInsights` (or local fallback if Gemini is down).
 * 5. Caches the fresh response before returning it.
 *
 * @param {Request} _req - Express request (no query or body parameters required).
 * @param {Response} res - Express response; sends the `AtmosCoachResponse` as JSON.
 * @returns {Promise<void>}
 */
export async function getInsights(_req: Request, res: Response): Promise<void> {
  const profile = dbService.getProfile();
  const activities = dbService.getActivities();
  const goals = dbService.getGoals();

  if (!profile) {
    res.json({
      insight: "Set up your onboarding profile to generate customized carbon recommendations.",
      actionPlan: [],
      goalCoaching: "Awaiting profile setup.",
      usingFallback: true,
    });
    return;
  }

  const targetPercent = goals?.targetPercent ?? 15;
  const stateHash = cacheService.generateStateHash(profile, activities, targetPercent);

  const cachedResponse = cacheService.get(stateHash);
  if (cachedResponse) {
    logger.info({ event: "insights_cache_hit", stateHash: stateHash.slice(0, 8) });
    res.json(cachedResponse);
    return;
  }

  let insights;
  try {
    insights = await geminiService.generateInsights(profile, activities, targetPercent);
  } catch (error) {
    logger.error({
      event: "insights_generation_failed",
      error: error instanceof Error ? error.message : String(error),
    });
    const fallback = generateLocalCoachData(activities, profile, targetPercent);
    insights = { ...fallback, meta: { source: "local" } };
  }

  cacheService.set(stateHash, insights);
  logger.info({ event: "insights_generated", source: insights.usingFallback ? "local" : "gemini" });

  res.json(insights);
}
