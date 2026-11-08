import express from "express";
import { registerUser, loginUser , 
  getCurrentUser, updateProfile, verifyEmail} from "../controllers/auth.controller.js";

import { authenticateToken } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

// Register a new user
router.post("/register", authLimiter, registerUser);

router.get("/verify-email", verifyEmail);

// Login
router.post("/login", authLimiter, loginUser);

router.get("/me", authLimiter, authenticateToken, getCurrentUser);

router.put("/me", authLimiter, authenticateToken, updateProfile);


export default router;