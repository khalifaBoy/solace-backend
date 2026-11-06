import prisma from "../config/database.js";
import { generateMoodInsights,
  generateMoodActivities, } from "../services/ai.service.js";

export async function getMoodInsights(req, res) {
  try {
    const userId = req.user.userId;

    // Retrieve the user's latest 30 mood entries
    const moodEntries = await prisma.moodEntry.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
      select: {
        mood: true,
        emotion: true,
        note: true,
        createdAt: true,
      },
    });

    // Handle users without mood history
    if (moodEntries.length === 0) {
      return res.status(200).json({
        success: true,
        insights: null,
        message: "Record some moods to receive personalized insights.",
      });
    }

    // Generate AI insights
    const insights = await generateMoodInsights(moodEntries);

    return res.status(200).json({
      success: true,
      insights,
      entriesAnalyzed: moodEntries.length,
    });

  } catch (error) {
    console.error("Mood Insights Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate mood insights.",
    });
  }
}


export async function getMoodActivities(req, res) {
  try {
    const userId = req.user.userId;

    // Retrieve the user's recent mood entries
    const moodEntries = await prisma.moodEntry.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
      select: {
        mood: true,
        emotion: true,
        note: true,
        createdAt: true,
      },
    });

    if (moodEntries.length === 0) {
      return res.status(200).json({
        success: true,
        activities: null,
        message: "Record some moods to receive suggested activities.",
      });
    }

    // Generate personalized activities
    const activities = await generateMoodActivities(moodEntries);

    return res.status(200).json({
      success: true,
      activities,
      entriesAnalyzed: moodEntries.length,
    });

  } catch (error) {
    console.error("Mood Activities Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate suggested activities.",
    });
  }
}