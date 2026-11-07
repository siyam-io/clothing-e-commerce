import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ChatService } from "../chat.service.js";
import { ApiError } from "../../../utils/responseHandler.js";

describe("ChatService", () => {
  let service;
  let mockConversationModel;
  let mockMessageModel;
  let mockUserModel;

  beforeEach(() => {
    mockConversationModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
    };
    mockMessageModel = {
      find: jest.fn(),
      aggregate: jest.fn(),
      updateMany: jest.fn(),
      countDocuments: jest.fn(),
    };
    mockUserModel = {
      find: jest.fn(),
    };

    service = new ChatService({
      conversationModel: mockConversationModel,
      messageModel: mockMessageModel,
      userModel: mockUserModel,
    });
  });

  describe("getChatHistory", () => {
    it("returns empty array if no conversation exists", async () => {
      mockConversationModel.findOne.mockResolvedValue(null);

      const result = await service.getChatHistory("usr_1", "usr_2");
      expect(result).toEqual([]);
    });

    it("returns messages in chronological order when conversation exists", async () => {
      mockConversationModel.findOne.mockResolvedValue({ _id: "conv_1" });
      const mockMessages = [{ _id: "msg_2", text: "second" }, { _id: "msg_1", text: "first" }];

      mockMessageModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([...mockMessages]),
              }),
            }),
          }),
        }),
      });

      const result = await service.getChatHistory("usr_1", "usr_2");
      // Expect reversed back to chronological [msg_1, msg_2]
      expect(result[0]._id).toBe("msg_1");
      expect(result[1]._id).toBe("msg_2");
    });
  });

  describe("aggregateUnreadCounts", () => {
    it("aggregates unread counts into lookup map", async () => {
      mockMessageModel.aggregate.mockResolvedValue([
        { _id: "conv_1", count: 3 },
        { _id: "conv_2", count: 1 },
      ]);

      const map = await service.aggregateUnreadCounts(["conv_1", "conv_2"], "admin_1");
      expect(map["conv_1"]).toBe(3);
      expect(map["conv_2"]).toBe(1);
    });

    it("isolates aggregation failure and returns empty map without throwing", async () => {
      mockMessageModel.aggregate.mockRejectedValue(new Error("Aggregation pipeline error"));

      const map = await service.aggregateUnreadCounts(["conv_1"], "admin_1");
      expect(map).toEqual({});
    });
  });

  describe("getConversationById", () => {
    it("returns populated conversation when found", async () => {
      const mockConv = { _id: "conv_3", type: "support" };
      mockConversationModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockConv),
        }),
      });

      const result = await service.getConversationById("conv_3");
      expect(result).toEqual(mockConv);
    });

    it("throws 404 ApiError when conversation is missing", async () => {
      mockConversationModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.getConversationById("non_existent")).rejects.toThrow(ApiError);
    });
  });

  describe("startConversation", () => {
    it("throws 400 ApiError when participantId is omitted", async () => {
      await expect(service.startConversation(null)).rejects.toThrow(ApiError);
    });

    it("returns existing conversation if already active", async () => {
      const existingConv = { _id: "conv_4", participants: ["usr_5"] };
      mockConversationModel.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(existingConv),
      });

      const result = await service.startConversation("usr_5");
      expect(result).toEqual(existingConv);
    });
  });

  describe("getUnreadCount", () => {
    it("queries all unread messages for admin users", async () => {
      mockMessageModel.countDocuments.mockResolvedValue(7);

      const count = await service.getUnreadCount("admin_usr", true);
      expect(count).toBe(7);
      expect(mockMessageModel.countDocuments).toHaveBeenCalledWith({
        isRead: false,
        sender: { $ne: "admin_usr" },
      });
    });

    it("returns 0 for customer when no support conversation exists", async () => {
      mockConversationModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const count = await service.getUnreadCount("cust_usr", false);
      expect(count).toBe(0);
    });
  });

  describe("updateConversationMode", () => {
    it("throws 400 ApiError for invalid mode", async () => {
      await expect(service.updateConversationMode("conv_5", "unknown_mode")).rejects.toThrow(
        ApiError
      );
    });

    it("updates mode and handed over flag to human agent", async () => {
      const mockConv = {
        _id: "conv_5",
        mode: "ai",
        isHandedOver: false,
        save: jest.fn().mockResolvedValue(true),
      };
      mockConversationModel.findById.mockResolvedValue(mockConv);

      const updated = await service.updateConversationMode("conv_5", "agent");
      expect(updated.mode).toBe("agent");
      expect(updated.isHandedOver).toBe(true);
      expect(mockConv.save).toHaveBeenCalled();
    });
  });

  describe("searchUsers", () => {
    it("returns empty array when search query is blank", async () => {
      const result = await service.searchUsers("");
      expect(result).toEqual([]);
    });

    it("performs case-insensitive regex query on name, email, and phone", async () => {
      const mockUsers = [{ _id: "u1", name: "Rahim Ahmed" }];
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockUsers),
            }),
          }),
        }),
      });

      const result = await service.searchUsers("rahim");
      expect(result).toEqual(mockUsers);
    });
  });
});

