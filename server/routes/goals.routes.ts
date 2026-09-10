/**
 * @module GoalsRoutes
 * @description Express router binding goals endpoints to the GoalsController.
 *
 * Routes:
 * - `GET  /api/goals` → Retrieve the current carbon reduction offsetTarget
 * - `POST /api/goals` → Save updated offsetTarget values (validated)
 */

import { Router } from "express";
import { validate, goalsSchema } from "../middleware/validate.js";
import * as GoalsController from "../controllers/goals.controller.js";

const router = Router();

router.get("/", GoalsController.getGoals);
router.post("/", validate(goalsSchema), GoalsController.saveGoals);

export default router;
