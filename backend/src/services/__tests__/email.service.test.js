import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { EmailService } from "../email.service.js";

describe("EmailService", () => {
  let emailService;
  let mockApiKeyModel;
  let mockPageSettingModel;
  let mockTransporter;
  let mockTransportFactory;

  beforeEach(() => {
    mockApiKeyModel = {
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          mailHost: "smtp.example.com",
          mailPort: 587,
          mailUser: "admin@example.com",
          mailPass: "mock_encrypted_pass",
          mailFrom: "Store Operations",
        }),
      }),
    };

    mockPageSettingModel = {
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          branding: { siteName: "Luxury Apparel" },
        }),
      }),
    };

    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: "msg-12345" }),
    };

    mockTransportFactory = jest.fn().mockReturnValue(mockTransporter);

    emailService = new EmailService({
      apiKeyModel: mockApiKeyModel,
      pageSettingModel: mockPageSettingModel,
      transportFactory: mockTransportFactory,
    });
  });

  describe("getConfiguration", () => {
    it("should retrieve configuration and cache results", async () => {
      const config1 = await emailService.getConfiguration();
      expect(config1.host).toBe("smtp.example.com");
      expect(config1.siteName).toBe("Luxury Apparel");

      const config2 = await emailService.getConfiguration();
      expect(mockApiKeyModel.findOne).toHaveBeenCalledTimes(1);
      expect(config2).toBe(config1);
    });

    it("should reload configuration after cache bust", async () => {
      await emailService.getConfiguration();
      emailService.bustCache();
      await emailService.getConfiguration();

      expect(mockApiKeyModel.findOne).toHaveBeenCalledTimes(2);
    });
  });

  describe("sendVerificationEmail", () => {
    it("should format and dispatch verification email", async () => {
      const result = await emailService.sendVerificationEmail(
        "customer@example.com",
        "https://store.com/verify?token=abc"
      );

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.to).toBe("customer@example.com");
      expect(callArgs.subject).toContain("Verify your email");
      expect(callArgs.html).toContain("https://store.com/verify?token=abc");
      expect(result.messageId).toBe("msg-12345");
    });
  });

  describe("sendPasswordResetEmail", () => {
    it("should format and dispatch password reset email", async () => {
      await emailService.sendPasswordResetEmail(
        "user@example.com",
        "https://store.com/reset?token=xyz"
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.to).toBe("user@example.com");
      expect(callArgs.subject).toContain("Reset your password");
      expect(callArgs.html).toContain("https://store.com/reset?token=xyz");
    });
  });

  describe("sendOrderConfirmationEmail", () => {
    it("should format invoice and line items in confirmation email", async () => {
      const sampleOrder = {
        _id: "6644f1234567890abcdef123",
        shippingAddress: {
          name: "John Doe",
          email: "john@example.com",
          address: "123 High Street, Dhaka",
          phone: "01700000000",
        },
        orderItems: [
          { name: "Cotton Crewneck", quantity: 2, price: 1200 },
        ],
        itemsPrice: 2400,
        shippingPrice: 60,
        discountAmount: 200,
        totalPrice: 2260,
      };

      await emailService.sendOrderConfirmationEmail(sampleOrder);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.to).toBe("john@example.com");
      expect(callArgs.subject).toContain("Order Confirmation #DEF123");
      expect(callArgs.html).toContain("Cotton Crewneck x 2");
      expect(callArgs.html).toContain("2260");
    });
  });
});
