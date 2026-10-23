import express from "express";
import { getChatHistory, getAllConversations, getConversationById, getConversationMessages, getMyConversation, searchUsers, startConversation, markMessagesAsRead, getUnreadCount, updateConversationMode } from "./chat.controller.js";
import { requireAuth, admin, extractUser } from "../../middleware/auth.js";
import upload from "../../middleware/upload.js";
import { uploadImage } from "../../services/imageUploadService.js";
import { handleAiChat } from "./controllers/aiChat.controller.js";

const router = express.Router();

// 🤖 AI Shopping Assistant & Multimodal VLM Chat (POST /api/chat)
router.post("/", extractUser, upload.single("image"), handleAiChat);
router.post("/message", extractUser, upload.single("image"), handleAiChat);

// 🛒 কাস্টমার এবং অ্যাডমিন দুজনেই চ্যাট হিস্টোরি দেখতে পারবে
router.get("/history/:recipientId", requireAuth, getChatHistory);

// 🛡️ শুধুমাত্র অ্যাডমিনরা সব কাস্টমারের চ্যাট লিস্ট দেখতে পারবে
router.get("/conversations", requireAuth, admin, getAllConversations);
router.get("/conversations/:id", requireAuth, admin, getConversationById);
router.get("/conversations/:id/messages", requireAuth, admin, getConversationMessages);
router.patch("/conversations/:id/mode", requireAuth, updateConversationMode);
router.post("/conversations/start", requireAuth, admin, startConversation);
router.get("/search-users", requireAuth, admin, searchUsers);

// 🛡️ কাস্টমার এবং অ্যাডমিনরা চ্যাটে ইমেজ আপলোড করতে পারবে (গেস্ট ইউজারও ইমেজ পাঠাতে পারবে)
router.post("/upload", extractUser, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file provided" });
    const imageUrl = await uploadImage(req.file, "chat");
    res.json({ success: true, url: imageUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Image upload failed" });
  }
});

// 🛒 কাস্টমার নিজের সাপোর্ট কনভারসেশন দেখতে পারবে
router.get("/my-conversation", requireAuth, getMyConversation);
router.get("/unread-count", requireAuth, getUnreadCount);
router.post("/mark-read", requireAuth, markMessagesAsRead);

export default router;