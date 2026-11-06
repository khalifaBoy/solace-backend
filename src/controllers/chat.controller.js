import { generateAIResponse } from "../services/ai.service.js";

export async function chatController(req, res) {
  try {
    const { messages } = req.body;

    // Validate request
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Messages are required.",
      });
    }

    // Limit conversation history
    if (messages.length > 12) {
      return res.status(400).json({
        success: false,
        message: "Too many messages.",
      });
    }

    // Validate individual messages
    const validMessages = messages.every((message) => {
      return (
        message &&
        ["user", "assistant"].includes(message.role) &&
        typeof message.content === "string" &&
        message.content.trim().length > 0 &&
        message.content.length <= 2000
      );
    });

    if (!validMessages) {
      return res.status(400).json({
        success: false,
        message: "Invalid message format.",
      });
    }

    // Generate AI response
    const aiResponse = await generateAIResponse(messages);

    return res.status(200).json({
      success: true,
      reply: aiResponse,
    });

  } catch (error) {
    console.error("Chat Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate a response right now.",
    });
  }
}