import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AdminAiMessage, AdminAiSession } from "../admin-ai-chat.model.js";
import {
  getAdminAiChatHistory,
  clearAdminAiChatHistory,
  getAdminAiChatSessions,
  createAdminAiChatSession,
  getAdminAiChatSessionMessages,
  deleteAdminAiChatSession,
  renameAdminAiChatSession,
} from "../ai-chat.controller.js";

describe("Admin AI Chat History & Sessions Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: {
        _id: "507f1f77bcf86cd799439011",
        name: "Admin User",
        role: { name: "admin", permissions: ["ai-chat:view"] },
      },
      params: {},
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getAdminAiChatSessions", () => {
    it("should return list of sessions for authenticated user", async () => {
      const mockSessions = [
        {
          _id: "sess_1",
          title: "Product Search",
          lastMessage: "Here are 5 items",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const findSpy = jest.spyOn(AdminAiSession, "find").mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockSessions),
        }),
      });

      await getAdminAiChatSessions(req, res, next);

      expect(findSpy).toHaveBeenCalledWith({ user: "507f1f77bcf86cd799439011" });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        sessions: [
          {
            id: "sess_1",
            title: "Product Search",
            lastMessage: "Here are 5 items",
            createdAt: mockSessions[0].createdAt,
            updatedAt: mockSessions[0].updatedAt,
          },
        ],
      });

      findSpy.mockRestore();
    });
  });

  describe("createAdminAiChatSession", () => {
    it("should create a new session", async () => {
      req.body = { title: "Order Analytics" };
      const mockSession = {
        _id: "sess_new",
        title: "Order Analytics",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createSpy = jest.spyOn(AdminAiSession, "create").mockResolvedValue(mockSession);

      await createAdminAiChatSession(req, res, next);

      expect(createSpy).toHaveBeenCalledWith({
        user: "507f1f77bcf86cd799439011",
        title: "Order Analytics",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        session: {
          id: "sess_new",
          title: "Order Analytics",
          createdAt: mockSession.createdAt,
          updatedAt: mockSession.updatedAt,
        },
      });

      createSpy.mockRestore();
    });
  });

  describe("getAdminAiChatSessionMessages", () => {
    it("should return messages for given session", async () => {
      req.params = { sessionId: "sess_1" };
      const mockSession = {
        _id: "sess_1",
        title: "Product Search",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockMessages = [
        {
          _id: "msg_1",
          role: "user",
          content: "Search shoes",
          image: null,
          toolExecutions: [],
          createdAt: new Date(),
        },
      ];

      const findOneSpy = jest.spyOn(AdminAiSession, "findOne").mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockSession),
      });

      const findSpy = jest.spyOn(AdminAiMessage, "find").mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockMessages),
          }),
        }),
      });

      await getAdminAiChatSessionMessages(req, res, next);
      if (next.mock.calls.length) console.error("NEXT ERR:", next.mock.calls[0][0]);

      expect(findOneSpy).toHaveBeenCalledWith({ _id: "sess_1", user: "507f1f77bcf86cd799439011" });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        session: {
          id: "sess_1",
          title: "Product Search",
          createdAt: mockSession.createdAt,
          updatedAt: mockSession.updatedAt,
        },
        messages: [
          {
            id: "msg_1",
            role: "user",
            content: "Search shoes",
            image: null,
            toolExecutions: [],
            createdAt: mockMessages[0].createdAt,
          },
        ],
      });

      findOneSpy.mockRestore();
      findSpy.mockRestore();
    });
  });

  describe("deleteAdminAiChatSession", () => {
    it("should delete session and its messages", async () => {
      req.params = { sessionId: "sess_1" };

      const deleteSessionSpy = jest
        .spyOn(AdminAiSession, "findOneAndDelete")
        .mockResolvedValue({ _id: "sess_1" });
      const deleteMessagesSpy = jest
        .spyOn(AdminAiMessage, "deleteMany")
        .mockResolvedValue({ deletedCount: 3 });

      await deleteAdminAiChatSession(req, res, next);

      expect(deleteSessionSpy).toHaveBeenCalledWith({ _id: "sess_1", user: "507f1f77bcf86cd799439011" });
      expect(deleteMessagesSpy).toHaveBeenCalledWith({ session: "sess_1", user: "507f1f77bcf86cd799439011" });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Session and conversation deleted successfully.",
      });

      deleteSessionSpy.mockRestore();
      deleteMessagesSpy.mockRestore();
    });
  });

  describe("getAdminAiChatHistory", () => {
    it("should return formatted chat history for the authenticated user", async () => {
      const mockMessages = [
        {
          _id: "msg_1",
          role: "user",
          content: "Hello AI",
          image: null,
          toolExecutions: [],
          createdAt: new Date("2026-01-01T10:00:00Z"),
        },
      ];

      const findSpy = jest.spyOn(AdminAiMessage, "find").mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockMessages),
          }),
        }),
      });

      await getAdminAiChatHistory(req, res, next);

      expect(findSpy).toHaveBeenCalledWith({ user: "507f1f77bcf86cd799439011" });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        messages: [
          {
            id: "msg_1",
            role: "user",
            content: "Hello AI",
            image: null,
            toolExecutions: [],
            createdAt: mockMessages[0].createdAt,
          },
        ],
      });

      findSpy.mockRestore();
    });
  });

  describe("clearAdminAiChatHistory", () => {
    it("should delete all chat messages and sessions for authenticated user", async () => {
      const deleteManyMessagesSpy = jest
        .spyOn(AdminAiMessage, "deleteMany")
        .mockResolvedValue({ deletedCount: 5 });
      const deleteManySessionsSpy = jest
        .spyOn(AdminAiSession, "deleteMany")
        .mockResolvedValue({ deletedCount: 2 });

      await clearAdminAiChatHistory(req, res, next);

      expect(deleteManyMessagesSpy).toHaveBeenCalledWith({ user: "507f1f77bcf86cd799439011" });
      expect(deleteManySessionsSpy).toHaveBeenCalledWith({ user: "507f1f77bcf86cd799439011" });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Chat history cleared successfully.",
      });

      deleteManyMessagesSpy.mockRestore();
      deleteManySessionsSpy.mockRestore();
    });
  });
});
