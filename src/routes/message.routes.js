import express from "express";

import {
  createMessage,
} from "../controllers/message.controller.js";

import {
  authenticateToken,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/:conversationId/messages",
  authenticateToken,
  createMessage
);

export default router;