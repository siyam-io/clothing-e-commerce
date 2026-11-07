import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { BkashService } from "../bkash.service.js";

describe("BkashService", () => {
  let bkashService;
  let mockHttpClient;

  const credentials = {
    baseURL: "https://tokenized.sandbox.bka.sh/v1.2.0-beta",
    appKey: "test-app-key-123",
    appSecret: "test-app-secret-456",
  };

  beforeEach(() => {
    mockHttpClient = {
      post: jest.fn(),
    };

    bkashService = new BkashService({ httpClient: mockHttpClient });
  });

  describe("getToken", () => {
    it("should request new token and cache subsequent calls", async () => {
      mockHttpClient.post.mockResolvedValueOnce({
        data: { id_token: "mock-jwt-token", expires_in: "3600" },
      });

      const token1 = await bkashService.getToken(credentials);
      expect(token1).toBe("mock-jwt-token");
      expect(mockHttpClient.post).toHaveBeenCalledTimes(1);

      const token2 = await bkashService.getToken(credentials);
      expect(token2).toBe("mock-jwt-token");
      expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
    });

    it("should throw error when token API rejects", async () => {
      mockHttpClient.post.mockRejectedValueOnce(new Error("Network timeout"));

      await expect(bkashService.getToken(credentials)).rejects.toThrow(
        "Failed to obtain bKash payment authorization token"
      );
    });
  });

  describe("createPayment", () => {
    it("should initialize payment and return redirect URL and payment ID", async () => {
      mockHttpClient.post
        .mockResolvedValueOnce({
          data: { id_token: "mock-auth-token", expires_in: "3600" },
        })
        .mockResolvedValueOnce({
          data: {
            bkashURL: "https://sandbox.bka.sh/checkout?paymentID=PAY-123",
            paymentID: "PAY-123",
          },
        });

      const result = await bkashService.createPayment(
        1500,
        "ORDER-999",
        "https://store.com/api/payment/callback",
        credentials
      );

      expect(result.paymentID).toBe("PAY-123");
      expect(result.bkashURL).toContain("checkout?paymentID=PAY-123");
    });
  });

  describe("executePayment", () => {
    it("should capture authorized payment successfully", async () => {
      mockHttpClient.post
        .mockResolvedValueOnce({
          data: { id_token: "mock-auth-token", expires_in: "3600" },
        })
        .mockResolvedValueOnce({
          data: {
            paymentID: "PAY-123",
            trxID: "TRX-7890",
            transactionStatus: "Completed",
          },
        });

      const result = await bkashService.executePayment("PAY-123", credentials);
      expect(result.trxID).toBe("TRX-7890");
      expect(result.transactionStatus).toBe("Completed");
    });
  });
});

