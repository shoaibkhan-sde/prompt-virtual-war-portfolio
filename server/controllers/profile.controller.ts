/**
 * @module ProfileController
 * @description HTTP controller for user carbon profile CRUD operations.
 *
 * Provides `getProfile` and `saveProfile` handlers used by the `/api/profile` route.
 * Invalidates the AI insights cache on every profile save since a changed profile
 * alters the SHA-256 state hash, making cached insights stale.
 */

import { Request, Response } from "express";
import { dbService } from "../services/db.service.js";
import { cacheService } from "../services/cache.service.js";
import { UserProfile } from "../types/index.js";
import { logger } from "../utils/logger.js";

/**
 * Handles `GET /api/profile` — returns the current user's carbon profile.
 *
 * Returns `null` if onboarding has not been completed.
 *
 * @param {Request} _req - Express request (no parameters required).
 * @param {Response} res - Express response; sends the profile object (or `null`) as JSON.
 * @returns {void}
 */
export function getProfile(_req: Request, res: Response): void {
  const profile = dbService.getProfile();
  res.json(profile);
}

/**
 * Handles `POST /api/profile` — persists the user's validated onboarding carbon profile.
 *
 * Also invalidates all cached AI insights because a new profile changes the SHA-256
 * state hash, ensuring the next insights request generates fresh recommendations.
 *
 * @param {Request} req - Express request with validated body matching `UserProfile`.
 * @param {Response} res - Express response; sends `{ message, profile }` as JSON.
 * @returns {void}
 */
export function saveProfile(req: Request, res: Response): void {
  const updatedProfile = dbService.saveProfile(req.body as UserProfile);
  cacheService.invalidateAll();

  logger.info({ event: "profile_saved", country: updatedProfile.country });

  res.json({
    message: "Profile saved successfully",
    profile: updatedProfile,
  });
}
