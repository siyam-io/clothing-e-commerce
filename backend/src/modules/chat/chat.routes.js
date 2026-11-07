import express from "express";
import {
  getChatHistory,
  getAllConversations,
  getConversationById,
  getConversationMessages,
  getMyConversation,
  searchUsers,
  startConversation,
  markMessagesAsRead,
  getUnreadCount,
  updateConversationMode,
  uploadChatAttachment,
} from "./chat.controller.js";
import { requireAuth, admin, extractUser } from "../../middleware/auth.js";
import upload from "../../middleware/upload.js";
import { handleAiChat } from "./controllers/aiChat.controller.js";

const router = express.Router();

// Multimodal AI assistant endpoints
router.post("/", extractUser, upload.single("image"), handleAiChat);
router.post("/message", extractUser, upload.single("image"), handleAiChat);

// Conversation history and customer support
router.get("/history/:recipientId", requireAuth, getChatHistory);
router.get("/my-conversation", requireAuth, getMyConversation);
router.get("/unread-count", requireAuth, getUnreadCount);
router.post("/mark-read", requireAuth, markMessagesAsRead);
router.post("/upload", extractUser, upload.single("image"), uploadChatAttachment);

// Administrative conversation management
router.get("/conversations", requireAuth, admin, getAllConversations);
router.get("/conversations/:id", requireAuth, admin, getConversationById);
router.get("/conversations/:id/messages", requireAuth, admin, getConversationMessages);
router.patch("/conversations/:id/mode", requireAuth, updateConversationMode);
router.post("/conversations/start", requireAuth, admin, startConversation);
router.get("/search-users", requireAuth, admin, searchUsers);

export default router;
