import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";

import chatRoutes from "./routes/chat.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import messageRoutes from "./routes/message.routes.js";
import authRoutes from "./routes/auth.routes.js";
import prisma from "./config/database.js";
import moodRoutes from "./routes/mood.routes.js";
import insightsRoutes from "./routes/insights.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import journalRoutes from "./routes/journal.routes.js";

import { globalLimiter } from "./middleware/rateLimit.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use("/api", globalLimiter);

app.use(helmet());

// Middleware
app.use(cors());


app.use(express.json({
  limit: "20kb",
}));

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Solace AI Backend is running.",
  });
});

// API routes
app.use("/api/chat", chatRoutes); //chat Route

app.use("/api/conversations", conversationRoutes);
app.use("/api/conversations", messageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/moods", moodRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/journal", journalRoutes);



//Database
app.get("/api/health/db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      message: "PostgreSQL connected successfully!",
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});


// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Solace backend running on port ${PORT}`);
});