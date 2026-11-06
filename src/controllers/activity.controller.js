import prisma from "../config/database.js";

// Save completed activity
export const completeActivity = async (req, res) => {
  try {
    const { activity, duration } = req.body;
    const userId = req.user.userId;

    if (
      !activity ||
      typeof activity !== "string" ||
      !duration ||
      typeof duration !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Activity name and duration are required.",
      });
    }

    const completion = await prisma.activityCompletion.create({
      data: {
        activity: activity.trim(),
        duration: duration.trim(),
        userId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Activity completed successfully.",
      completion,
    });
  } catch (error) {
    console.error("Complete Activity Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save activity completion.",
    });
  }
};

// Get user's completed activities
export const getActivityHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const activities = await prisma.activityCompletion.findMany({
      where: { userId },
      orderBy: {
        completedAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error("Activity History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve activity history.",
    });
  }
};