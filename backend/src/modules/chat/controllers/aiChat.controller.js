import crypto from 'crypto';
import { VlmClientService } from '../services/vlmClient.service.js';
import { ConversationalOrderService } from '../services/conversationalOrder.service.js';

/**
 * Main Controller for POST /api/chat
 * Handles multi-modal user input (text + optional image), communicates with local VLM,
 * and processes any cart or order actions in MongoDB.
 */
export const handleAiChat = async (req, res, next) => {
  try {
    const { message = '', history } = req.body;
    const file = req.file;

    // Validate that either a text message or an image was provided
    if ((!message || message.trim().length === 0) && (!file || !file.buffer)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either a message or an image to start chatting.',
      });
    }

    // Determine user identifier (authenticated User ID or Guest Session ID)
    let userIdentifier;
    if (req.user && req.user._id) {
      userIdentifier = req.user._id.toString();
    } else {
      userIdentifier =
        req.headers['x-guest-id'] ||
        req.body.guestId ||
        req.cookies?.guestId ||
        `guest_${crypto.randomBytes(8).toString('hex')}`;
    }

    // Parse history if received as string
    let parsedHistory = [];
    if (history) {
      try {
        parsedHistory = typeof history === 'string' ? JSON.parse(history) : history;
      } catch (err) {
        parsedHistory = [];
      }
    }

    // 1. Forward request to local Python VLM engine (with graceful fallback)
    const vlmResponse = await VlmClientService.sendChatMessage({
      message: message.trim(),
      file,
      history: parsedHistory,
    });

    let actionResult = null;

    // 2. Execute any structured action detected by the VLM (ADD_TO_CART, CREATE_ORDER, etc.)
    if (vlmResponse.action_payload) {
      actionResult = await ConversationalOrderService.handleAction(
        vlmResponse.action_payload,
        userIdentifier,
        req.user || null
      );
    }

    // 3. Assemble and return clean response for Next.js chat drawer
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
    console.error('❌ Error handling AI Chat message:', error);
    next(error);
  }
};
