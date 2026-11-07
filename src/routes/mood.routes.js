import express from "express";

import {
  createMood,
  getMoods,
  updateMood,
  deleteMood,
  createDailyMoodAssessment,
  getTodayMoodAssessment,
} from "../controllers/mood.controller.js";

import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// All mood routes require authentication
router.use(authenticateToken);

// Create mood
router.post("/", createMood);

// Get mood history
router.get("/", getMoods);

// Update mood
router.put("/:id", updateMood);

// Delete mood
router.delete("/:id", deleteMood);

// Daily mood assessment
router.post("/assessment", createDailyMoodAssessment);
router.get("/assessment/today", getTodayMoodAssessment);

export default router;