import chatService from "./chat.service.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { uploadImage } from "../../services/imageUploadService.js";
import { ApiError } from "../../utils/responseHandler.js";
import logger from "../../utils/logger.js";

const isUserAdmin = (user) => {
  const roleName = user.role?.name || user.role;
  return roleName === "superadmin" || (roleName !== "customer" && Boolean(roleName));
};

export const getChatHistory = asyncHandler(async (req, res) => {
  const messages = await chatService.getChatHistory(
    req.user._id,
    req.params.recipientId,
    req.query
  );
  res.json(messages);
});

export const getAllConversations = asyncHandler(async (req, res) => {
  const conversations = await chatService.getAllConversations(req.user._id);
  res.json({ success: true, conversations });
});

export const getConversationById = asyncHandler(async (req, res) => {
  const conversation = await chatService.getConversationById(req.params.id);
  res.json({ success: true, conversation });
});

export const getConversationMessages = asyncHandler(async (req, res) => {
  const messages = await chatService.getConversationMessages(
    req.params.id,
    req.user._id,
    req.query
  );
  res.json(messages);
});

export const getMyConversation = asyncHandler(async (req, res) => {
  const conversation = await chatService.getMyConversation(req.user._id);
  res.json(conversation);
});

export const startConversation = asyncHandler(async (req, res) => {
  const conversation = await chatService.startConversation(req.body.participantId);
  res.json({ success: true, conversation });
});

export const searchUsers = asyncHandler(async (req, res) => {
  const users = await chatService.searchUsers(req.query.query);
  res.json(users);
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await chatService.getUnreadCount(req.user._id, isUserAdmin(req.user));
  res.json({ success: true, count });
});

export const markMessagesAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const isAdmin = isUserAdmin(req.user);
  const result = await chatService.markMessagesAsRead(userId, isAdmin, req.body.conversationId);

  const io = req.app.get("io");
  if (io && result.conversationId) {
    if (isAdmin && result.conv) {
      const customer = result.conv.participants.find((p) => p.toString() !== userId.toString());
      if (customer) io.to(customer.toString()).emit("messages_seen", { conversationId: result.conversationId });
    } else if (!isAdmin) {
      io.to("admin_support_room").emit("messages_seen", { conversationId: result.conversationId });
    }
  }

  res.json({ success: true });
});

export const updateConversationMode = asyncHandler(async (req, res) => {
  const conversation = await chatService.updateConversationMode(req.params.id, req.body.mode);

  const io = req.app.get("io");
  if (io) {
    const payload = {
      conversationId: conversation._id.toString(),
      mode: conversation.mode,
      isHandedOver: conversation.isHandedOver,
    };
    io.to("admin_support_room").emit("chat_mode_changed", payload);
    (conversation.participants || []).forEach((p) => {
      io.to((p?._id || p).toString()).emit("chat_mode_changed", payload);
    });
  }

  res.json({ success: true, mode: conversation.mode, isHandedOver: conversation.isHandedOver });
});

export const uploadChatAttachment = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file provided for upload");
  }
  try {
    const imageUrl = await uploadImage(req.file, "chat");
    res.json({ success: true, url: imageUrl });
  } catch (error) {
    logger.error("Chat attachment upload failed:", { error: error.message });
    throw new ApiError(500, "Image upload failed");
  }
});
