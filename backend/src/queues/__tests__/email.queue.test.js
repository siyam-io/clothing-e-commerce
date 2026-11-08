import { jest } from "@jest/globals";

// Mock email service methods
const mockSendOrderConfirmationEmail = jest.fn().mockResolvedValue({ messageId: "1" });
const mockSendOrderStatusUpdateEmail = jest.fn().mockResolvedValue({ messageId: "2" });
const mockSendVerificationEmail = jest.fn().mockResolvedValue({ messageId: "3" });
const mockSendPasswordResetEmail = jest.fn().mockResolvedValue({ messageId: "4" });

jest.unstable_mockModule("../../services/email.service.js", () => ({
  sendOrderConfirmationEmail: mockSendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail: mockSendOrderStatusUpdateEmail,
  sendVerificationEmail: mockSendVerificationEmail,
  sendPasswordResetEmail: mockSendPasswordResetEmail,
}));

// Mock logger
jest.unstable_mockModule("../../utils/logger.js", () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("BullMQ Email Queue & Worker Processor", () => {
  let processEmailJob;
  let queueOrderConfirmationEmail;
  let queueOrderStatusUpdateEmail;
  let queueVerificationEmail;
  let queuePasswordResetEmail;

  beforeAll(async () => {
    const queueModule = await import("../email.queue.js");
    processEmailJob = queueModule.processEmailJob;
    queueOrderConfirmationEmail = queueModule.queueOrderConfirmationEmail;
    queueOrderStatusUpdateEmail = queueModule.queueOrderStatusUpdateEmail;
    queueVerificationEmail = queueModule.queueVerificationEmail;
    queuePasswordResetEmail = queueModule.queuePasswordResetEmail;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("processEmailJob", () => {
    test("processes order_confirmation job successfully", async () => {
      const mockOrder = { _id: "order_123", totalPrice: 1500 };
      const job = {
        id: "job_1",
        name: "order_confirmation",
        data: { order: mockOrder },
      };

      const result = await processEmailJob(job);
      expect(result).toEqual({ success: true });
      expect(mockSendOrderConfirmationEmail).toHaveBeenCalledWith(mockOrder);
    });

    test("processes order_status_update job successfully", async () => {
      const mockOrder = { _id: "order_123", orderStatus: "Shipped" };
      const job = {
        id: "job_2",
        name: "order_status_update",
        data: { order: mockOrder },
      };

      const result = await processEmailJob(job);
      expect(result).toEqual({ success: true });
      expect(mockSendOrderStatusUpdateEmail).toHaveBeenCalledWith(mockOrder);
    });

    test("processes verification_email job successfully", async () => {
      const job = {
        id: "job_3",
        name: "verification_email",
        data: { email: "user@test.com", url: "https://example.com/verify" },
      };

      const result = await processEmailJob(job);
      expect(result).toEqual({ success: true });
      expect(mockSendVerificationEmail).toHaveBeenCalledWith(
        "user@test.com",
        "https://example.com/verify"
      );
    });

    test("processes password_reset job successfully", async () => {
      const job = {
        id: "job_4",
        name: "password_reset",
        data: { email: "user@test.com", url: "https://example.com/reset" },
      };

      const result = await processEmailJob(job);
      expect(result).toEqual({ success: true });
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        "user@test.com",
        "https://example.com/reset"
      );
    });

    test("throws error for unknown job name", async () => {
      const job = {
        id: "job_5",
        name: "unknown_event",
        data: {},
      };

      await expect(processEmailJob(job)).rejects.toThrow("Unknown email job type: unknown_event");
    });
  });

  describe("Queue helper fallback execution", () => {
    test("queueOrderConfirmationEmail falls back to direct call in test mode", async () => {
      const mockOrder = { _id: "order_test", shippingAddress: { email: "test@example.com" } };
      await queueOrderConfirmationEmail(mockOrder);
      expect(mockSendOrderConfirmationEmail).toHaveBeenCalledWith(mockOrder);
    });

    test("queueOrderStatusUpdateEmail falls back to direct call in test mode", async () => {
      const mockOrder = { _id: "order_test", shippingAddress: { email: "test@example.com" } };
      await queueOrderStatusUpdateEmail(mockOrder);
      expect(mockSendOrderStatusUpdateEmail).toHaveBeenCalledWith(mockOrder);
    });

    test("queueVerificationEmail falls back to direct call in test mode", async () => {
      await queueVerificationEmail("user@test.com", "http://test.com");
      expect(mockSendVerificationEmail).toHaveBeenCalledWith("user@test.com", "http://test.com");
    });

    test("queuePasswordResetEmail falls back to direct call in test mode", async () => {
      await queuePasswordResetEmail("user@test.com", "http://test.com");
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith("user@test.com", "http://test.com");
    });
  });
});

