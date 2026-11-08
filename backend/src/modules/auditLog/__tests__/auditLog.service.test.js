import { jest } from "@jest/globals";

// Mock AuditLog model
const mockSave = jest.fn().mockResolvedValue(true);
const mockFind = jest.fn();
const mockCountDocuments = jest.fn();
const mockAggregate = jest.fn();
const mockFindById = jest.fn();

function MockAuditLog(data) {
  Object.assign(this, data);
  this.save = mockSave;
}

MockAuditLog.find = mockFind;
MockAuditLog.countDocuments = mockCountDocuments;
MockAuditLog.aggregate = mockAggregate;
MockAuditLog.findById = mockFindById;

jest.unstable_mockModule("../auditLog.model.js", () => ({
  default: MockAuditLog,
}));

jest.unstable_mockModule("../../../utils/logger.js", () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("AuditLogService", () => {
  let auditLogService;

  beforeAll(async () => {
    const module = await import("../auditLog.service.js");
    auditLogService = module.auditLogService;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("recordLog", () => {
    test("successfully creates and saves an audit log entry", async () => {
      const mockReq = {
        ip: "192.168.1.1",
        headers: { "user-agent": "Mozilla/5.0" },
        user: {
          _id: "user_123",
          name: "Admin User",
          email: "admin@example.com",
          role: { name: "SuperAdmin" },
        },
      };

      const result = await auditLogService.recordLog({
        req: mockReq,
        action: "STATUS_CHANGE",
        module: "Order",
        resourceId: "order_456",
        description: "Changed order status to Shipped",
        details: { oldStatus: "Processing", newStatus: "Shipped" },
      });

      expect(result).toBeDefined();
      expect(result.action).toBe("STATUS_CHANGE");
      expect(result.module).toBe("Order");
      expect(result.userName).toBe("Admin User");
      expect(result.ipAddress).toBe("192.168.1.1");
      expect(mockSave).toHaveBeenCalled();
    });

    test("handles errors gracefully without throwing to preserve caller stability", async () => {
      mockSave.mockRejectedValueOnce(new Error("DB connection failure"));

      const result = await auditLogService.recordLog({
        action: "UPDATE",
        module: "Product",
        description: "Failed save attempt",
      });

      expect(result).toBeNull();
    });
  });

  describe("getAuditLogs", () => {
    test("queries paginated audit logs with search and filters", async () => {
      const sampleLogs = [
        { _id: "log_1", action: "CREATE", module: "Product", description: "Created item" },
        { _id: "log_2", action: "DELETE", module: "Order", description: "Deleted order" },
      ];

      const chainable = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(sampleLogs),
      };

      mockFind.mockReturnValue(chainable);
      mockCountDocuments.mockResolvedValue(2);

      const result = await auditLogService.getAuditLogs({
        page: 1,
        limit: 10,
        module: "Product",
        action: "create",
        search: "shirt",
      });

      expect(result.success).toBe(true);
      expect(result.logs).toEqual(sampleLogs);
      expect(result.total).toBe(2);
      expect(result.pages).toBe(1);
      expect(mockFind).toHaveBeenCalled();
    });
  });

  describe("getAuditLogStats", () => {
    test("aggregates audit statistics accurately", async () => {
      mockCountDocuments
        .mockResolvedValueOnce(150) // totalLogs
        .mockResolvedValueOnce(25)  // todayLogs
        .mockResolvedValueOnce(3);  // failedCount

      mockAggregate
        .mockResolvedValueOnce([{ _id: "UPDATE", count: 80 }])
        .mockResolvedValueOnce([{ _id: "Order", count: 90 }]);

      const stats = await auditLogService.getAuditLogStats();

      expect(stats.totalLogs).toBe(150);
      expect(stats.todayLogs).toBe(25);
      expect(stats.failedCount).toBe(3);
      expect(stats.topActions).toEqual([{ action: "UPDATE", count: 80 }]);
      expect(stats.topModules).toEqual([{ module: "Order", count: 90 }]);
    });
  });
});
