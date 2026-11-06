import express from "express";

import {
  chatController,
} from "../controllers/chat.controller.js";
import { chatLimiter } from "../middleware/rateLimit.js";

import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", chatLimiter, authenticateToken, chatController);

export default router;