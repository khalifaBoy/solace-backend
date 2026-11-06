import express from "express";

import {
  createJournalEntry,
  getJournalEntries,
  updateJournalEntry,
  deleteJournalEntry,
} from "../controllers/journal.controller.js";

import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken);

router.post("/", createJournalEntry);
router.get("/", getJournalEntries);
router.put("/:id", updateJournalEntry);
router.delete("/:id", deleteJournalEntry);

export default router;