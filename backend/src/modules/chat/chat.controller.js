import mongoose from "mongoose";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { Conversation, Message } from "./chat.model.js";
import User from "../user/user.model.js";

/**
 * @desc    Get chat history between two users (Paginated)
 * @route   GET /api/chat/history/:recipientId?page=1&limit=20
 */
export const getChatHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { recipientId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  // 1. Find conversation
  const conversation = await Conversation.findOne({
    participants: { $all: [userId, recipientId] },
    type: "support"
  });

  if (!conversation) return res.json([]);

  // 2. Fetch paginated messages
  const messages = await Message.find({ conversationId: conversation._id })
    .sort("-createdAt")
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("sender", "name avatar role")
    .lean();

  res.json(messages.reverse());
});

/**
 * @desc    Get all active conversations for Admin (Optimized)
 * @filter  Only show conversations with message history
 */
export const getAllConversations = asyncHandler(async (req, res) => {
  const rawConversations = await Conversation.find({ 
      type: "support",
      lastMessage: { $exists: true, $ne: null } // Only chats with history
    })
    .populate({
      path: "participants",
      select: "name email avatar role",
      populate: { path: "role" }
    })
    .sort("-updatedAt")
    .lean();

  // 🚀 Single Aggregation Query for Unread Counts (Eliminates N+1 queries)
  const convIds = rawConversations.map(c => c._id);
  const unreadAggregation = await Message.aggregate([
    {
      $match: {
        conversationId: { $in: convIds },
        isRead: false,
        sender: { $ne: req.user._id }
      }
    },
    {
      $group: {
        _id: "$conversationId",
        count: { $sum: 1 }
      }
    }
  ]);

  const unreadMap = unreadAggregation.reduce((acc, curr) => {
    acc[curr._id.toString()] = curr.count;
    return acc;
  }, {});

  const conversations = rawConversations.map(conv => ({
    ...conv,
    unreadCount: unreadMap[conv._id.toString()] || 0
  }));

  res.json({ success: true, conversations });
});

/**
 * @desc    Get single conversation by ID (Admin only)
 * @route   GET /api/chat/conversations/:id
 */
export const getConversationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const conversation = await Conversation.findById(id)
    .populate({
      path: "participants",
      select: "name email avatar role",
      populate: { path: "role" }
    })
    .lean();

  if (!conversation) {
    return res.status(404).json({ success: false, message: "Conversation not found" });
  }

  res.json({ success: true, conversation });
});

/**
 * @desc    Mark all messages in user's support conversation as read
 * @route   POST /api/chat/mark-read
 */
export const markMessagesAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRoleName = req.user.role?.name || req.user.role;
  const isAdmin = userRoleName === "superadmin" || (userRoleName !== "customer" && userRoleName);
  const { conversationId } = req.body;
  const io = req.app.get("io");

  const query = { isRead: false, sender: { $ne: userId } };
  if (conversationId) {
    query.conversationId = conversationId;
  }

  if (isAdmin) {
    // 🛡️ Admin marks messages as read (either all or specific conversation)
    await Message.updateMany(query, { $set: { isRead: true } });
    
    if (conversationId && io) {
      const conv = await Conversation.findById(conversationId);
      if (conv) {
         const customer = conv.participants.find(p => p.toString() !== userId.toString());
         if (customer) io.to(customer.toString()).emit("messages_seen", { conversationId: conversationId.toString() });
      }
    }
  } else {
    // 🛒 Customer marks messages as read
    const conversation = await Conversation.findOne({
      participants: userId,
      type: "support",
      ...(conversationId ? { _id: conversationId } : {})
    });

    if (conversation) {
      await Message.updateMany(
        { conversationId: conversation._id, isRead: false, sender: { $ne: userId } },
        { $set: { isRead: true } }
      );
      
      if (io) {
        io.to("admin_support_room").emit("messages_seen", { conversationId: conversation._id.toString() });
      }
    }
  }

  res.json({ success: true });
});

/**
 * @desc    Search for users to start new conversation (Admin only)
 */
export const searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query) return res.json([]);

  // Search by name, email or phone
  const users = await User.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
      { phone: { $regex: query, $options: "i" } }
    ],
  })
  .select("name email avatar role")
  .populate("role")
  .limit(10)
  .lean();

  res.json(users);
});

/**
 * @desc    Get messages for a specific conversation (Paginated)
 */
export const getConversationMessages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const messages = await Message.find({ conversationId: id })
    .sort("-createdAt")
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({
      path: "sender",
      select: "name avatar role",
      populate: { path: "role" }
    })
    .lean();

  // 📝 Optimized Mark as Read: Bulk update only for messages not sent by req.user
  await Message.updateMany(
    { conversationId: id, isRead: false, sender: { $ne: req.user._id } },
    { $set: { isRead: true } }
  );

  res.json(messages.reverse());
});

/**
 * @desc    Get customer's own support conversation
 */
export const getMyConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({
    participants: req.user._id,
    type: "support",
  }).lean();

  if (!conversation) {
    return res.json(null);
  }

  // Load latest 20 messages for initial view
  const messages = await Message.find({ conversationId: conversation._id })
    .sort("-createdAt")
    .limit(20)
    .populate({
      path: "sender",
      select: "name avatar role",
      populate: { path: "role" }
    })
    .lean();

  res.json({ ...conversation, messages: messages.reverse() });
});

/**
 * @desc    Find or create conversation with a participant (Admin only)
 */
export const startConversation = asyncHandler(async (req, res) => {
  const { participantId } = req.body;
  if (!participantId) return res.status(400).json({ success: false, message: "Participant ID required" });

  let conversation = await Conversation.findOne({
    participants: participantId,
    type: "support"
  }).populate({
    path: "participants",
    select: "name email avatar role",
    populate: { path: "role" }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [participantId],
      type: "support"
    });
    conversation = await conversation.populate({
      path: "participants",
      select: "name email avatar role",
      populate: { path: "role" }
    });
  }

  res.json({ success: true, conversation });
});

/**
 * @desc    Get unread message count for the logged-in user
 * @route   GET /api/chat/unread-count
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRoleName = req.user.role?.name || req.user.role;
  const isAdmin = userRoleName === "superadmin" || (userRoleName !== "customer" && userRoleName);

  console.log(`[ChatDebug] Fetching unread for user: ${userId} (${userRoleName}), isAdmin: ${isAdmin}`);

  let count = 0;

  if (isAdmin) {
    count = await Message.countDocuments({
      isRead: false,
      sender: { $ne: userId } 
    });
  } else {
    const conversation = await Conversation.findOne({
      participants: userId,
      type: "support"
    }).lean();

    if (conversation) {
      count = await Message.countDocuments({
        conversationId: conversation._id,
        isRead: false,
        sender: { $ne: userId }
      });
    }
  }

  res.json({ success: true, count });
});

/**
 * @desc    Update conversation mode (AI vs Agent Takeover)
 * @route   PATCH /api/chat/conversations/:id/mode
 */
export const updateConversationMode = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { mode } = req.body;
  if (!["ai", "agent"].includes(mode)) {
    return res.status(400).json({ success: false, message: "Mode must be 'ai' or 'agent'" });
  }

  const conversation = await Conversation.findById(id);
  if (!conversation) {
    return res.status(404).json({ success: false, message: "Conversation not found" });
  }

  conversation.mode = mode;
  conversation.isHandedOver = mode === "agent";
  await conversation.save();

  const io = req.app.get("io");
  if (io) {
    const payload = {
      conversationId: conversation._id.toString(),
      mode: conversation.mode,
      isHandedOver: conversation.isHandedOver,
    };
    io.to("admin_support_room").emit("chat_mode_changed", payload);
    if (Array.isArray(conversation.participants)) {
      conversation.participants.forEach((p) => {
        io.to((p?._id || p).toString()).emit("chat_mode_changed", payload);
      });
    }
  }

  res.json({ success: true, mode: conversation.mode, isHandedOver: conversation.isHandedOver });
});