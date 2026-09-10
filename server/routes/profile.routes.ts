/**
 * @module ProfileRoutes
 * @description Express router binding profile endpoints to the ProfileController.
 *
 * Routes:
 * - `GET  /api/profile` → Retrieve the current user's onboarding carbon profile
 * - `POST /api/profile` → Save/update the user's onboarding carbon profile (validated)
 */

import { Router } from "express";
import { validate, profileSchema } from "../middleware/validate.js";
import * as ProfileController from "../controllers/profile.controller.js";

const router = Router();

router.get("/", ProfileController.getProfile);
router.post("/", validate(profileSchema), ProfileController.saveProfile);

export default router;
