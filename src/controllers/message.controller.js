import prisma from "../config/database.js";

export async function createMessage(req, res) {
  try {
    const { conversationId } = req.params;
    const { role, content } = req.body;

    // Get authenticated user ID from JWT
    const userId = req.user.userId;

    // Validate input
    if (!role || !content) {
      return res.status(400).json({
        success: false,
        message: "Role and content are required",
      });
    }

    if (!["user", "assistant"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message role",
      });
    }

    // Verify conversation ownership
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Save message and update conversation timestamp
    const savedMessage = await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId,
          role,
          content,
        },
      });

      await tx.conversation.update({
        where: {
          id: conversationId,
        },
        data: {
          updatedAt: new Date(),
        },
      });

      return message;
    });

    // Automatically generate conversation title
    if (role === "user" && conversation.title === "New Conversation") {
      await prisma.conversation.update({
        where: {
          id: conversationId,
        },
        data: {
          title:
            content.length > 40
              ? content.substring(0, 40) + "..."
              : content,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: savedMessage,
    });

  } catch (error) {
    console.error("Create Message Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save message",
    });
  }
}