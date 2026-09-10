/**
 * @module GoalsController
 * @description HTTP controller for carbon reduction offsetTarget CRUD operations.
 *
 * Provides `getGoals` and `saveGoals` handlers used by the `/api/goals` route.
 * Invalidates the AI insights cache on every goals save since a changed offsetTarget
 * alters the SHA-256 state hash, making cached coach responses stale.
 */

import { Request, Response } from "express";
import { dbService } from "../services/db.service.js";
import { cacheService } from "../services/cache.service.js";
import { logger } from "../utils/logger.js";

/**
 * Handles `GET /api/goals` — returns the current carbon reduction offsetTarget.
 *
 * @param {Request} _req - Express request (no parameters required).
 * @param {Response} res - Express response; sends the goals object as JSON.
 * @returns {void}
 */
export function getGoals(_req: Request, res: Response): void {
  const goals = dbService.getGoals();
  res.json(goals);
}

/**
 * Handles `POST /api/goals` — persists updated carbon reduction offsetTarget values.
 *
 * Also invalidates all cached AI insights so the next coach request reflects the
 * new offsetTarget in its goal-coaching feedback.
 *
 * @param {Request} req - Express request with validated body: `{ targetPercent, targetAnnualKg }`.
 * @param {Response} res - Express response; sends `{ message, goals }` as JSON.
 * @returns {void}
 */
export function saveGoals(req: Request, res: Response): void {
  const { targetPercent, targetAnnualKg } = req.body as {
    targetPercent: number;
    targetAnnualKg: number;
  };

  dbService.saveGoals(targetPercent, targetAnnualKg ?? 0);
  cacheService.invalidateAll();

  logger.info({ event: "goals_updated", offsetTarget: targetPercent });

  res.json({
    message: "Goals updated successfully",
    goals: dbService.getGoals(),
  });
}
