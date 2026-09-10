/**
 * @module ActivitiesRoutes
 * @description Express router binding HTTP methods to the ActivitiesController handlers.
 *
 * All business logic has been extracted to {@link ActivitiesController}.
 * This file is a pure routing declaration: method → middleware → controller.
 *
 * Routes:
 * - `GET  /api/activities`     → List full carbon emission ledger
 * - `POST /api/activities`     → Log a new emission entry (validated)
 * - `PUT  /api/activities/:id` → Update an emission entry by ID (validated)
 * - `DELETE /api/activities/:id` → Delete an emission entry by ID
 */

import { Router } from "express";
import { validate, activitySchema } from "../middleware/validate.js";
import * as ActivitiesController from "../controllers/activities.controller.js";

const router = Router();

router.get("/", ActivitiesController.list);
router.post("/", validate(activitySchema), ActivitiesController.create);
router.put("/:id", validate(activitySchema), ActivitiesController.update);
router.delete("/:id", ActivitiesController.remove);

export default router;
