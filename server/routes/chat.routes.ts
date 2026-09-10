/**
 * @module ChatRoutes
 * @description Express router binding the POST chat endpoint to the ChatController.
 *
 * Routes:
 * - `POST /api/chat` → Process a conversational carbon advisory query
 */

import { Router } from "express";
import { validate, chatSchema } from "../middleware/validate.js";
import { aiRateLimiter } from "../middleware/rateLimiters.js";
import { noStoreCache } from "../middleware/cacheControl.js";
import * as ChatController from "../controllers/chat.controller.js";

const router = Router();

router.post("/", noStoreCache, aiRateLimiter, validate(chatSchema), ChatController.sendChat);

export default router;
