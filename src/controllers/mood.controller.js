import prisma from "../config/database.js";

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