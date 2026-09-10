/**
 * @module InsightsRoutes
 * @description Express router binding the GET insights endpoint to the InsightsController.
 *
 * Routes:
 * - `GET /api/insights` → Generate/retrieve personalised AI carbon coaching response
 */

import { Router } from "express";
import { aiRateLimiter } from "../middleware/rateLimiters.js";
import { noStoreCache } from "../middleware/cacheControl.js";
import * as InsightsController from "../controllers/insights.controller.js";

const router = Router();

router.get("/", noStoreCache, aiRateLimiter, InsightsController.getInsights);

export default router;
