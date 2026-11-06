import express from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";

import {
  createConversation, getConversations, getConversationById, deleteConversation
} from "../controllers/conversation.controller.js";

const router = express.Router();

router.post("/", authenticateToken, createConversation);
router.get("/", authenticateToken, getConversations);
router.get("/:id",authenticateToken ,getConversationById);
router.delete("/:id", authenticateToken, deleteConversation);

export default router;  