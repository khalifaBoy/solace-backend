import prisma from "../config/database.js";
import { openai } from "../config/openai.js";

// Create mood entry
export async function createMood(req, res) {
    
  try {
    const userId = req.user.userId;
    const { mood, emotion, note } = req.body;

    if (!Number.isInteger(mood) || mood < 1 || mood > 5) {
      return res.status(400).json({
        success: false,
        message: "Mood must be an integer between 1 and 5",
      });
    }

    if (!emotion || typeof emotion !== "string" || !emotion.trim()) {
      return res.status(400).json({
        success: false,
        message: "Emotion is required",
      });
    }

    if (note !== undefined && note !== null && typeof note !== "string") {
      return res.status(400).json({
        success: false,
        message: "Note must be a string",
      });
    }

    const moodEntry = await prisma.moodEntry.create({
      data: {
        mood,
        emotion: emotion.trim(),
        note: note?.trim() || null,
        userId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Mood entry created successfully",
      mood: moodEntry,
    });
  } catch (error) {
    console.error("Create Mood Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save mood entry",
    });
  }
}

// Get all mood entries for the logged-in user
export async function getMoods(req, res) {
  try {
    const userId = req.user.userId;

    const moods = await prisma.moodEntry.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: moods.length,
      moods,
    });
  } catch (error) {
    console.error("Get Moods Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve mood history",
    });
  }
}

// Update a mood entry
export async function updateMood(req, res) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { mood, emotion, note } = req.body;

    if (
      mood !== undefined &&
      (!Number.isInteger(mood) || mood < 1 || mood > 5)
    ) {
      return res.status(400).json({
        success: false,
        message: "Mood must be an integer between 1 and 5",
      });
    }

    if (
      emotion !== undefined &&
      (typeof emotion !== "string" || !emotion.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Emotion must be a non-empty string",
      });
    }

    if (
      note !== undefined &&
      note !== null &&
      typeof note !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Note must be a string",
      });
    }

    const existingMood = await prisma.moodEntry.findFirst({
      where: { id, userId },
    });

    if (!existingMood) {
      return res.status(404).json({
        success: false,
        message: "Mood entry not found",
      });
    }

    const updatedMood = await prisma.moodEntry.update({
      where: { id },
      data: {
        ...(mood !== undefined && { mood }),
        ...(emotion !== undefined && { emotion: emotion.trim() }),
        ...(note !== undefined && { note: note?.trim() || null }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Mood entry updated successfully",
      mood: updatedMood,
    });
  } catch (error) {
    console.error("Update Mood Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update mood entry",
    });
  }
}

// Delete a mood entry
export async function deleteMood(req, res) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const existingMood = await prisma.moodEntry.findFirst({
      where: { id, userId },
    });

    if (!existingMood) {
      return res.status(404).json({
        success: false,
        message: "Mood entry not found",
      });
    }

    await prisma.moodEntry.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Mood entry deleted successfully",
    });
  } catch (error) {
    console.error("Delete Mood Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete mood entry",
    });
  }
}


// Submit daily mood assessment
export async function createDailyMoodAssessment(req, res) {
  try {
    const userId = req.user.userId;
    const { answers } = req.body;

    // Validate five answers
    if (!Array.isArray(answers) || answers.length !== 5) {
      return res.status(400).json({
        success: false,
        message: "Exactly five answers are required",
      });
    }

    if (
      answers.some(
        (answer) =>
          typeof answer !== "string" ||
          !answer.trim() ||
          answer.length > 300
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Each answer must be a non-empty string",
      });
    }

    // Use UTC date for consistent daily uniqueness
    const now = new Date();
    const assessmentDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    // Check whether today's assessment already exists
    const existingAssessment =
      await prisma.dailyMoodAssessment.findUnique({
        where: {
          userId_assessmentDate: {
            userId,
            assessmentDate,
          },
        },
      });

    if (existingAssessment) {
      return res.status(409).json({
        success: false,
        message: "You have already completed today's assessment",
        assessment: existingAssessment,
      });
    }

    // Generate mood assessment using AI
    const aiResponse = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `
You are Solace, a compassionate emotional wellness assistant.

Analyze the user's five daily wellness answers.
Return ONLY valid JSON with these fields:

{
  "mood": 1,
  "emotion": "string",
  "explanation": "string",
  "recommendation": "string"
}

Mood scale:
1 = Very low
2 = Low
3 = Neutral
4 = Good
5 = Very good

Be empathetic, non-judgmental, and avoid medical diagnoses.
Do not assume a mental health disorder.
Recommendations should be practical and gentle.
          `,
        },
        {
          role: "user",
          content: JSON.stringify(answers),
        },
      ],
      response_format: { type: "json_object" },
      // temperature: 0.5,
    });

    const result = JSON.parse(
      aiResponse.choices[0].message.content
    );

    if (
      !Number.isInteger(result.mood) ||
      result.mood < 1 ||
      result.mood > 5 ||
      typeof result.emotion !== "string" ||
      typeof result.explanation !== "string" ||
      typeof result.recommendation !== "string"
    ) {
      throw new Error("Invalid AI assessment response");
    }

    // Save assessment
    const assessment = await prisma.dailyMoodAssessment.create({
      data: {
        userId,
        assessmentDate,
        answers,
        mood: result.mood,
        emotion: result.emotion,
        explanation: result.explanation,
        recommendation: result.recommendation,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Daily mood assessment completed",
      assessment,
    });
  } catch (error) {
    // Handle simultaneous submissions safely
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "You have already completed today's assessment",
      });
    }

    console.error("Daily Mood Assessment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete mood assessment",
    });
  }
}

// Get today's mood assessment
export async function getTodayMoodAssessment(req, res) {
  try {
    const userId = req.user.userId;

    const now = new Date();
    const assessmentDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    const assessment = await prisma.dailyMoodAssessment.findUnique({
      where: {
        userId_assessmentDate: {
          userId,
          assessmentDate,
        },
      },
    });

    return res.status(200).json({
      success: true,
      completed: Boolean(assessment),
      assessment: assessment || null,
    });
  } catch (error) {
    console.error("Get Today's Assessment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve today's assessment",
    });
  }
}