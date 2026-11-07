import { Conversation, Message } from "./chat.model.js";
import User from "../user/user.model.js";
import { ApiError } from "../../utils/responseHandler.js";
import logger from "../../utils/logger.js";

/**
 * Service managing real-time support conversations, customer messaging, and unread counters.
 */
export class ChatService {
  /**
   * @param {Object} [dependencies]
   * @param {typeof Conversation} [dependencies.conversationModel]
   * @param {typeof Message} [dependencies.messageModel]
   * @param {typeof User} [dependencies.userModel]
   */
  constructor(dependencies = {}) {
    this.conversationModel = dependencies.conversationModel || Conversation;
    this.messageModel = dependencies.messageModel || Message;
    this.userModel = dependencies.userModel || User;
  }

  /**
   * Retrieve paginated chat history between two participants.
   */
  async getChatHistory(userId, recipientId, { page = 1, limit = 20 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);

    const conversation = await this.conversationModel.findOne({
      participants: { $all: [userId, recipientId] },
      type: "support",
    });

    if (!conversation) return [];

    const messages = await this.messageModel
      .find({ conversationId: conversation._id })
      .sort("-createdAt")
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate("sender", "name avatar role")
      .lean();

    return messages.reverse();
  }

  /**
   * Aggregates unread message counts across multiple conversations.
   */
  async aggregateUnreadCounts(conversationIds, currentUserId) {
    try {
      const results = await this.messageModel.aggregate([
        {
          $match: {
            conversationId: { $in: conversationIds },
            isRead: false,
            sender: { $ne: currentUserId },
          },
        },
        {
          $group: {
            _id: "$conversationId",
            count: { $sum: 1 },
          },
        },
      ]);

      return results.reduce((acc, curr) => {
        acc[curr._id.toString()] = curr.count;
        return acc;
      }, {});
    } catch (error) {
      logger.error("Unread counts aggregation failed, fallback to zero:", { error: error.message });
      return {};
    }
  }

  /**
   * Retrieve active conversations for administration with unread count badges.
   */
  async getAllConversations(adminUserId) {
    const rawConversations = await this.conversationModel
      .find({
        type: "support",
        lastMessage: { $exists: true, $ne: null },
      })
      .populate({
        path: "participants",
        select: "name email avatar role",
        populate: { path: "role" },
      })
      .sort("-updatedAt")
      .lean();

    const convIds = rawConversations.map((c) => c._id);
    const unreadMap = await this.aggregateUnreadCounts(convIds, adminUserId);

    return rawConversations.map((conv) => ({
      ...conv,
      unreadCount: unreadMap[conv._id.toString()] || 0,
    }));
  }

  /**
   * Retrieve conversation record by ID.
   */
  async getConversationById(id) {
    const conversation = await this.conversationModel
      .findById(id)
      .populate({
        path: "participants",
        select: "name email avatar role",
        populate: { path: "role" },
      })
      .lean();

    if (!conversation) {
      throw new ApiError(404, "Conversation not found");
    }
    return conversation;
  }

  /**
   * Retrieve paginated messages for a conversation and mark incoming messages as read.
   */
  async getConversationMessages(conversationId, currentUserId, { page = 1, limit = 20 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);

    const messages = await this.messageModel
      .find({ conversationId })
      .sort("-createdAt")
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate({
        path: "sender",
        select: "name avatar role",
        populate: { path: "role" },
      })
      .lean();

    await this.messageModel.updateMany(
      { conversationId, isRead: false, sender: { $ne: currentUserId } },
      { $set: { isRead: true } }
    );

    return messages.reverse();
  }

  /**
   * Retrieve current customer's support conversation with latest 20 messages.
   */
  async getMyConversation(userId) {
    const conversation = await this.conversationModel
      .findOne({
        participants: userId,
        type: "support",
      })
      .lean();

    if (!conversation) return null;

    const messages = await this.messageModel
      .find({ conversationId: conversation._id })
      .sort("-createdAt")
      .limit(20)
      .populate({
        path: "sender",
        select: "name avatar role",
        populate: { path: "role" },
      })
      .lean();

    return { ...conversation, messages: messages.reverse() };
  }

  /**
   * Find or initialize a support conversation with a participant.
   */
  async startConversation(participantId) {
    if (!participantId) {
      throw new ApiError(400, "Participant ID required");
    }

    let conversation = await this.conversationModel
      .findOne({ participants: participantId, type: "support" })
      .populate({
        path: "participants",
        select: "name email avatar role",
        populate: { path: "role" },
      });

    if (!conversation) {
      conversation = await this.conversationModel.create({
        participants: [participantId],
        type: "support",
      });
      conversation = await conversation.populate({
        path: "participants",
        select: "name email avatar role",
        populate: { path: "role" },
      });
    }

    return conversation;
  }

  /**
   * Mark messages as read across conversation context.
   */
  async markMessagesAsRead(userId, isAdmin, conversationId = null) {
    const query = { isRead: false, sender: { $ne: userId } };
    if (conversationId) query.conversationId = conversationId;

    if (isAdmin) {
      await this.messageModel.updateMany(query, { $set: { isRead: true } });
      const conv = conversationId ? await this.conversationModel.findById(conversationId) : null;
      return { conversationId, conv, isCustomer: false };
    }

    const conversation = await this.conversationModel.findOne({
      participants: userId,
      type: "support",
      ...(conversationId ? { _id: conversationId } : {}),
    });

    if (conversation) {
      await this.messageModel.updateMany(
        { conversationId: conversation._id, isRead: false, sender: { $ne: userId } },
        { $set: { isRead: true } }
      );
      return { conversationId: conversation._id.toString(), conv: conversation, isCustomer: true };
    }

    return { conversationId: null, conv: null, isCustomer: true };
  }

  /**
   * Count unread messages for user based on admin or customer scope.
   */
  async getUnreadCount(userId, isAdmin) {
    if (isAdmin) {
      return await this.messageModel.countDocuments({
        isRead: false,
        sender: { $ne: userId },
      });
    }

    const conversation = await this.conversationModel
      .findOne({ participants: userId, type: "support" })
      .lean();

    if (!conversation) return 0;

    return await this.messageModel.countDocuments({
      conversationId: conversation._id,
      isRead: false,
      sender: { $ne: userId },
    });
  }

  /**
   * Switch conversation handling mode between automated assistant and human agent.
   */
  async updateConversationMode(id, mode) {
    if (!["ai", "agent"].includes(mode)) {
      throw new ApiError(400, "Mode must be 'ai' or 'agent'");
    }

    const conversation = await this.conversationModel.findById(id);
    if (!conversation) {
      throw new ApiError(404, "Conversation not found");
    }

    conversation.mode = mode;
    conversation.isHandedOver = mode === "agent";
    await conversation.save();

    return conversation;
  }

  /**
   * Search users by name, email, or phone.
   */
  async searchUsers(query) {
    if (!query || !query.trim()) return [];

    const searchRegex = { $regex: query.trim(), $options: "i" };
    return await this.userModel
      .find({
        $or: [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }],
      })
      .select("name email avatar role")
      .populate("role")
      .limit(10)
      .lean();
  }
}

export default new ChatService();

