import { jest } from "@jest/globals";

const mockRecordLog = jest.fn().mockResolvedValue({ _id: "log_mock" });

jest.unstable_mockModule("../auditLog.service.js", () => ({
  default: {
    recordLog: mockRecordLog,
  },
  auditLogService: {
    recordLog: mockRecordLog,
  },
}));

jest.unstable_mockModule("../../../utils/logger.js", () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("AuditLog Middleware", () => {
  let auditLogMiddleware;

  beforeAll(async () => {
    const mod = await import("../../../middleware/auditLogMiddleware.js");
    auditLogMiddleware = mod.auditLogMiddleware;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("skips logging when req._auditLogged is true", () => {
    const req = {
      _auditLogged: true,
      originalUrl: "/api/orders",
      method: "POST",
    };
    const finishCallbacks = [];
    const res = {
      statusCode: 201,
      on: (event, cb) => {
        if (event === "finish") finishCallbacks.push(cb);
      },
    };
    const next = jest.fn();

    auditLogMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();

    // Trigger finish
    finishCallbacks.forEach((cb) => cb());
    expect(mockRecordLog).not.toHaveBeenCalled();
  });

  test("skips logging for audit-logs route to prevent infinite loop", () => {
    const req = {
      originalUrl: "/api/admin/audit-logs?page=1",
      method: "GET",
    };
    const finishCallbacks = [];
    const res = {
      statusCode: 200,
      on: (event, cb) => {
        if (event === "finish") finishCallbacks.push(cb);
      },
    };
    const next = jest.fn();

    auditLogMiddleware(req, res, next);
    finishCallbacks.forEach((cb) => cb());

    expect(mockRecordLog).not.toHaveBeenCalled();
  });

  test("skips passive GET requests on non-export routes", () => {
    const req = {
      originalUrl: "/api/products?category=shirt",
      method: "GET",
    };
    const finishCallbacks = [];
    const res = {
      statusCode: 200,
      on: (event, cb) => {
        if (event === "finish") finishCallbacks.push(cb);
      },
    };
    const next = jest.fn();

    auditLogMiddleware(req, res, next);
    finishCallbacks.forEach((cb) => cb());

    expect(mockRecordLog).not.toHaveBeenCalled();
  });

  test("records mutating POST request and masks sensitive fields", async () => {
    const req = {
      originalUrl: "/api/coupons",
      method: "POST",
      user: {
        _id: "admin_123",
        name: "Store Admin",
        email: "admin@store.com",
        role: { name: "admin" },
      },
      body: {
        code: "SALE50",
        discountAmount: 50,
        password: "secretpassword123",
      },
      ip: "10.0.0.1",
    };
    const finishCallbacks = [];
    const res = {
      statusCode: 201,
      on: (event, cb) => {
        if (event === "finish") finishCallbacks.push(cb);
      },
    };
    const next = jest.fn();

    auditLogMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();

    // Trigger finish
    await Promise.all(finishCallbacks.map((cb) => cb()));

    expect(mockRecordLog).toHaveBeenCalled();
    const callArgs = mockRecordLog.mock.calls[0][0];
    expect(callArgs.action).toBe("CREATE");
    expect(callArgs.module).toBe("Coupon");
    expect(callArgs.status).toBe("SUCCESS");
    expect(callArgs.details.body.password).toBe("***MASKED***");
    expect(callArgs.details.body.code).toBe("SALE50");
  });

  test("records security warning on 401/403 unauthorized access attempts", async () => {
    const req = {
      originalUrl: "/api/admin/orders",
      method: "GET",
      ip: "192.168.1.50",
      body: {},
    };
    const finishCallbacks = [];
    const res = {
      statusCode: 403,
      on: (event, cb) => {
        if (event === "finish") finishCallbacks.push(cb);
      },
    };
    const next = jest.fn();

    auditLogMiddleware(req, res, next);
    await Promise.all(finishCallbacks.map((cb) => cb()));

    expect(mockRecordLog).toHaveBeenCalled();
    const callArgs = mockRecordLog.mock.calls[0][0];
    expect(callArgs.status).toBe("WARNING");
    expect(callArgs.description).toContain("Unauthorized access attempt");
  });
});
