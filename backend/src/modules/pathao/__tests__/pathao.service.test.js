import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { PathaoModuleService } from "../pathao.service.js";

describe("PathaoModuleService", () => {
  let service;
  let mockCourierService;
  let mockCreds;

  beforeEach(() => {
    mockCourierService = {
      getCities: jest.fn(),
      getZones: jest.fn(),
      getAreas: jest.fn(),
      getStores: jest.fn(),
    };
    mockCreds = {
      clientId: "test_client",
      clientSecret: "test_secret",
      isActive: true,
    };

    service = new PathaoModuleService({
      courierService: mockCourierService,
      credentialProvider: () => mockCreds,
    });
  });

  describe("getCities", () => {
    it("returns cities list on successful courier API call", async () => {
      const mockCities = [{ city_id: 1, city_name: "Dhaka" }];
      mockCourierService.getCities.mockResolvedValue(mockCities);

      const result = await service.getCities();
      expect(result).toEqual(mockCities);
    });

    it("returns empty array when credentials are not active", async () => {
      mockCreds.isActive = false;

      const result = await service.getCities();
      expect(result).toEqual([]);
      expect(mockCourierService.getCities).not.toHaveBeenCalled();
    });

    it("isolates API failure and returns empty array without throwing", async () => {
      mockCourierService.getCities.mockRejectedValue(new Error("Pathao 503 Service Unavailable"));

      const result = await service.getCities();
      expect(result).toEqual([]);
    });
  });

  describe("getZones", () => {
    it("returns zones for valid city ID", async () => {
      const mockZones = [{ zone_id: 10, zone_name: "Gulshan" }];
      mockCourierService.getZones.mockResolvedValue(mockZones);

      const result = await service.getZones("1");
      expect(result).toEqual(mockZones);
      expect(mockCourierService.getZones).toHaveBeenCalledWith("1", mockCreds);
    });

    it("returns empty array when city ID is missing", async () => {
      const result = await service.getZones(null);
      expect(result).toEqual([]);
    });
  });

  describe("getAreas", () => {
    it("returns areas for valid zone ID", async () => {
      const mockAreas = [{ area_id: 101, area_name: "Niketan" }];
      mockCourierService.getAreas.mockResolvedValue(mockAreas);

      const result = await service.getAreas("10");
      expect(result).toEqual(mockAreas);
    });

    it("isolates area lookup errors and returns empty array", async () => {
      mockCourierService.getAreas.mockRejectedValue(new Error("Timeout"));

      const result = await service.getAreas("10");
      expect(result).toEqual([]);
    });
  });
});

