import crypto from "crypto";
import { VlmClientService } from "../services/vlmClient.service.js";
import { ConversationalOrderService } from "../services/conversationalOrder.service.js";
import logger from "../../../utils/logger.js";

/**
 * Controller for POST /api/chat.
 * Processes multimodal customer queries, interfaces with vision-language engine,
 * and executes conversational cart/order actions.
 */
export const handleAiChat = async (req, res, next) => {
  try {
    const { message = "", history } = req.body;
    const file = req.file;

    if ((!message || message.trim().length === 0) && (!file || !file.buffer)) {
      return res.status(400).json({
        success: false,
        message: "Please provide either a message or an image to start chatting.",
      });
    }

    const userIdentifier =
      req.user?._id?.toString() ||
      req.headers["x-guest-id"] ||
      req.body.guestId ||
      req.cookies?.guestId ||
      `guest_${crypto.randomBytes(8).toString("hex")}`;

    let parsedHistory = [];
    if (history) {
      try {
        parsedHistory = typeof history === "string" ? JSON.parse(history) : history;
      } catch (err) {
        parsedHistory = [];
      }
    }

    const vlmResponse = await VlmClientService.sendChatMessage({
      message: message.trim(),
      file,
      history: parsedHistory,
    });

    let actionResult = null;
    if (vlmResponse.action_payload) {
      actionResult = await ConversationalOrderService.handleAction(
        vlmResponse.action_payload,
        userIdentifier,
        req.user || null
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        reply: vlmResponse.reply,
        hasImage: vlmResponse.has_image || false,
        isFallback: vlmResponse.isFallback || false,
        actionPayload: vlmResponse.action_payload || null,
        actionResult: actionResult || null,
        guestId: req.user ? undefined : userIdentifier,
        matchedProducts: vlmResponse.matchedProducts || undefined,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("AI Chat message processing failed:", { error: error.message });
    next(error);
  }
};
