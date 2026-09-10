/**
 * @module ChatController
 * @description HTTP controller for the Atmos Coach conversational chat endpoint.
 *
 * Delegates chat message processing to `geminiService.sendChatMessage`, providing
 * a thin adapter between the Express route layer and the AI/fallback service.
 */

import { Request, Response, NextFunction } from "express";
import { dbService } from "../services/db.service.js";
import { geminiService } from "../services/gemini.service.js";
import { logger } from "../utils/logger.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * Handles `POST /api/chat` — processes a user's conversational carbon advisory query.
 *
 * Passes the sanitized user message along with the current carbon profile and ledger
 * to `geminiService.sendChatMessage`. If Gemini is unavailable or fails, the service
 * automatically falls back to the local keyword-based response engine.
 *
 * @param {Request} req - Express request with validated body: `{ message: string }`.
 * @param {Response} res - Express response; sends `{ reply, usingFallback }` as JSON.
 * @param {NextFunction} next - Express next; called with an `AppError` on unexpected failure.
 * @returns {Promise<void>}
 */
export async function sendChat(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { message } = req.body as { message: string };
  const profile = dbService.getProfile();
  const activities = dbService.getActivities();

  try {
    const result = await geminiService.sendChatMessage(message, profile, activities);
    logger.info({ event: "chat_response_sent", usingFallback: result.usingFallback });
    res.json(result);
  } catch (error) {
    logger.error({
      event: "chat_handler_failed",
      error: error instanceof Error ? error.message : String(error),
    });
    const err: AppError = new Error("Failed to process chat message.") as AppError;
    err.status = 500;
    err.code = "CHAT_ERROR";
    next(err);
  }
}
