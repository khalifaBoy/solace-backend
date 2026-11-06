import prisma from "../config/database.js";

// Create journal entry
export const createJournalEntry = async (req, res) => {
  try {
    const { title, content, mood } = req.body;
    const userId = req.user.userId;

    if (
      !title?.trim() ||
      !content?.trim() ||
      !mood?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Title, content, and mood are required.",
      });
    }

    const entry = await prisma.journalEntry.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        mood: mood.trim(),
        userId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Journal entry created successfully.",
      entry,
    });
  } catch (error) {
    console.error("Create Journal Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create journal entry.",
    });
  }
};

// Get all journal entries for logged-in user
export const getJournalEntries = async (req, res) => {
  try {
    const userId = req.user.userId;

    const entries = await prisma.journalEntry.findMany({
      where: { userId },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: entries.length,
      entries,
    });
  } catch (error) {
    console.error("Get Journal Entries Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve journal entries.",
    });
  }
};

// Update journal entry
export const updateJournalEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, mood } = req.body;
    const userId = req.user.userId;

    const existingEntry = await prisma.journalEntry.findFirst({
      where: { id, userId },
    });

    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: "Journal entry not found.",
      });
    }

    const updatedEntry = await prisma.journalEntry.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content: content.trim() }),
        ...(mood !== undefined && { mood: mood.trim() }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Journal entry updated successfully.",
      entry: updatedEntry,
    });
  } catch (error) {
    console.error("Update Journal Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update journal entry.",
    });
  }
};

// Delete journal entry
export const deleteJournalEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const existingEntry = await prisma.journalEntry.findFirst({
      where: { id, userId },
    });

    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: "Journal entry not found.",
      });
    }

    await prisma.journalEntry.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Journal entry deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Journal Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete journal entry.",
    });
  }
};