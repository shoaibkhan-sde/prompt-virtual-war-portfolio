/**
 * @module ActivitiesController
 * @description HTTP controller for carbon emission ledger entry (activity) operations.
 *
 * Acts as a thin adapter between the Express route layer and the underlying
 * services (`DbService`, `CacheService`). All business logic (co2eKg calculation,
 * ID generation, date normalisation) resides here, keeping routes as pure
 * routing declarations.
 *
 * Supported operations:
 * - `list` — Retrieve the full carbon ledger (sorted newest-first).
 * - `create` — Log a new emission entry; recalculates co2eKg from canonical factors.
 * - `update` — Edit an existing ledger entry by ID; recalculates co2eKg.
 * - `remove` — Delete an emission entry from the carbon ledger by ID.
 */

import { Request, Response, NextFunction } from "express";
import { dbService } from "../services/db.service.js";
import { cacheService } from "../services/cache.service.js";
import { calculateEmissions } from "../../src/lib/emissionFactors.js";
import { ActivityLog } from "../types/index.js";
import { AppError } from "../middleware/errorHandler.js";
import { logger } from "../utils/logger.js";

/**
 * Retrieves the complete carbon emission ledger sorted newest-first.
 *
 * @param {Request} _req - Express request (unused).
 * @param {Response} res - Express response; sends the full activity array as JSON.
 * @returns {void}
 */
export function list(_req: Request, res: Response): void {
  const activities = dbService.getActivities();
  res.json(activities);
}

/**
 * Creates and persists a new carbon emission ledger entry.
 *
 * Reads the validated request body, resolves the user's country for grid-intensity
 * co2eKg calculations, computes the emission amount, and stores the entry. Also
 * invalidates the AI insights cache since the carbon ledger has changed.
 *
 * @param {Request} req - Express request with validated body: `{ category, type, value, note, date }`.
 * @param {Response} res - Express response; sends the created entry with HTTP 201.
 * @returns {void}
 */
export function create(req: Request, res: Response): void {
  const { category, type, value, note, date } = req.body as {
    category: ActivityLog["category"];
    type: string;
    value: number;
    note: string;
    date?: string;
  };

  const profile = dbService.getProfile();
  const countryCode = profile?.country ?? "US";

  // Calculate co2eKg using the canonical emission factors library
  const emissions = calculateEmissions(category, type, value, countryCode);

  const newActivity: ActivityLog = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    date: date ?? new Date().toISOString().split("T")[0],
    category,
    type,
    value,
    emissions,
    note: note ?? "",
  };

  dbService.saveActivity(newActivity);
  cacheService.invalidateAll();

  logger.info({ event: "emission_logged", category, co2eKg: emissions });

  res.status(201).json({
    message: "Activity added successfully",
    activity: newActivity,
  });
}

/**
 * Updates an existing carbon emission ledger entry by ID.
 *
 * Finds the existing entry to preserve its creation date if not provided,
 * recalculates the co2eKg amount with the updated fields, and persists the result.
 * Invalidates the AI insights cache.
 *
 * @param {Request} req - Express request with `params.id` and validated body fields.
 * @param {Response} res - Express response; sends the updated entry as JSON.
 * @param {NextFunction} next - Express next; called with a 404 `AppError` if the entry is not found.
 * @returns {void}
 */
export function update(req: Request, res: Response, next: NextFunction): void {
  const { id } = req.params;
  const activities = dbService.getActivities();
  const existing = activities.find((a) => a.id === id);

  if (!existing) {
    const err: AppError = new Error("Activity transaction not found.") as AppError;
    err.status = 404;
    err.code = "NOT_FOUND";
    return next(err);
  }

  const { category, type, value, note, date } = req.body as {
    category: ActivityLog["category"];
    type: string;
    value: number;
    note: string;
    date?: string;
  };

  const profile = dbService.getProfile();
  const countryCode = profile?.country ?? "US";
  const emissions = calculateEmissions(category, type, value, countryCode);

  const updatedActivity: ActivityLog = {
    id,
    date: date ?? existing.date,
    category,
    type,
    value,
    emissions,
    note: note ?? "",
  };

  dbService.saveActivity(updatedActivity);
  cacheService.invalidateAll();

  logger.info({ event: "emission_updated", id, category, co2eKg: emissions });

  res.json({
    message: "Activity updated successfully",
    activity: updatedActivity,
  });
}

/**
 * Deletes a carbon emission ledger entry by ID.
 *
 * Removes the entry from the persistent store and invalidates the AI insights cache.
 * Returns 404 if no entry with the given ID exists in the carbon ledger.
 *
 * @param {Request} req - Express request with `params.id`.
 * @param {Response} res - Express response; sends a success message as JSON.
 * @param {NextFunction} next - Express next; called with a 404 `AppError` if not found.
 * @returns {void}
 */
export function remove(req: Request, res: Response, next: NextFunction): void {
  const { id } = req.params;
  const success = dbService.deleteActivity(id);

  if (!success) {
    const err: AppError = new Error("Activity transaction not found.") as AppError;
    err.status = 404;
    err.code = "NOT_FOUND";
    return next(err);
  }

  cacheService.invalidateAll();
  logger.info({ event: "emission_deleted", id });

  res.json({ message: "Activity transaction deleted successfully." });
}
