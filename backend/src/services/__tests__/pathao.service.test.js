import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { PathaoService } from "../pathao.service.js";

describe("PathaoService", () => {
  let pathaoService;
  let mockHttpClient;
  let mockRedis;

  const credentials = {
    baseURL: "https://courier-api-sandbox.pathao.com",
    clientId: "client-abc",
    clientSecret: "secret-xyz",
    userName: "merchant@example.com",
    password: "secretPassword",
  };

  beforeEach(() => {
    mockHttpClient = {
      post: jest.fn(),
      get: jest.fn(),
    };

    mockRedis = {
      status: "ready",
      get: jest.fn().mockResolvedValue(null),
      setex: jest.fn().mockResolvedValue("OK"),
    };

    pathaoService = new PathaoService({
      httpClient: mockHttpClient,
      redis: mockRedis,
    });
  });

  describe("getToken", () => {
    it("should issue token and cache in Redis", async () => {
      mockHttpClient.post.mockResolvedValueOnce({
        data: { access_token: "pathao-bearer-token", expires_in: 3600 },
      });

      const token = await pathaoService.getToken(credentials);
      expect(token).toBe("pathao-bearer-token");
      expect(mockRedis.setex).toHaveBeenCalledWith("pathao:token:client-abc", 3300, "pathao-bearer-token");
    });

    it("should return cached token when available in Redis", async () => {
      mockRedis.get.mockResolvedValueOnce("cached-bearer-token");

      const token = await pathaoService.getToken(credentials);
      expect(token).toBe("cached-bearer-token");
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
  });

  describe("autoResolveAddress", () => {
    it("should return geographic mapping for matched address", async () => {
      mockRedis.get.mockResolvedValueOnce("cached-token");
      mockHttpClient.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              city_id: 1,
              zone_id: 10,
              area_id: 100,
              full_address: "Dhanmondi, Dhaka",
            },
          ],
        },
      });

      const result = await pathaoService.autoResolveAddress("Dhanmondi", credentials);
      expect(result).toEqual({
        city_id: 1,
        zone_id: 10,
        area_id: 100,
        full_address: "Dhanmondi, Dhaka",
      });
    });

    it("should return null when address query yields no suggestions", async () => {
      mockRedis.get.mockResolvedValueOnce("cached-token");
      mockHttpClient.get.mockResolvedValueOnce({ data: { data: [] } });

      const result = await pathaoService.autoResolveAddress("NonExistentZone123", credentials);
      expect(result).toBeNull();
    });
  });

  describe("createOrder", () => {
    it("should submit consignment and return delivery metadata", async () => {
      mockRedis.get.mockResolvedValueOnce("cached-token");
      mockHttpClient.post.mockResolvedValueOnce({
        data: {
          data: {
            consignment_id: "CS-998877",
            order_status: "Pending",
          },
        },
      });

      const payload = {
        store_id: 1234,
        recipient_name: "Customer",
        recipient_phone: "01700000000",
        recipient_address: "Mirpur 10, Dhaka",
        item_quantity: 1,
        item_weight: 0.5,
        amount_to_collect: 1500,
      };

      const result = await pathaoService.createOrder(payload, credentials);
      expect(result.consignment_id).toBe("CS-998877");
    });
  });
});

