import express from "express";

import {
  completeActivity,
  getActivityHistory,
} from "../controllers/activity.controller.js";

import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken);

router.post("/complete", completeActivity);
router.get("/history", getActivityHistory);

export default router;