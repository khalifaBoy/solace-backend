import express from "express";

import {
  getMoodInsights, 
  getMoodActivities,
} from "../controllers/insights.controller.js";

import {
  authenticateToken,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// All insights routes require authentication
router.use(authenticateToken);
// Generate personalized mood insights
router.get("/mood", getMoodInsights);

// Generate personalized activity suggestions
router.get("/activities", getMoodActivities);


export default router;