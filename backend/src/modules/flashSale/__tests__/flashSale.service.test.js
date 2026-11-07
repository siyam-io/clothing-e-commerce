import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { FlashSaleService } from "../flashSale.service.js";
import { ApiError } from "../../../utils/responseHandler.js";

describe("FlashSaleService", () => {
  let service;
  let mockFlashSaleModel;
  let mockCacheClearer;

  beforeEach(() => {
    mockFlashSaleModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      countDocuments: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };
    mockCacheClearer = jest.fn();

    service = new FlashSaleService({
      flashSaleModel: mockFlashSaleModel,
      cacheClearer: mockCacheClearer,
    });
  });

  describe("formatProductsWithDiscount", () => {
    it("computes discounted price accurately from percentage", () => {
      const products = [{ _id: "p1", price: 1000 }, { _id: "p2", price: 2500 }];
      const result = service.formatProductsWithDiscount(products, 20);

      expect(result[0].discountedPrice).toBe(800);
      expect(result[1].discountedPrice).toBe(2000);
      expect(result[0].discountPercentage).toBe(20);
    });
  });

  describe("getActiveFlashSales", () => {
    it("returns formatted flash sales with populated items", async () => {
      const mockSales = [
        {
          _id: "fs1",
          name: "Midnight Blitz",
          discount: 25,
          products: [{ _id: "p1", price: 1000 }],
        },
      ];

      mockFlashSaleModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockSales),
          }),
        }),
      });

      const result = await service.getActiveFlashSales();
      expect(result.length).toBe(1);
      expect(result[0].products[0].discountedPrice).toBe(750);
    });

    it("isolates database query error and returns empty array without throwing", async () => {
      mockFlashSaleModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockRejectedValue(new Error("Database disconnected")),
          }),
        }),
      });

      const result = await service.getActiveFlashSales();
      expect(result).toEqual([]);
    });
  });

  describe("getFlashSaleBySlug", () => {
    it("returns sale details when slug exists", async () => {
      const mockSale = {
        _id: "fs2",
        slug: "eid-sale",
        discount: 10,
        products: [{ _id: "p2", price: 500 }],
      };

      mockFlashSaleModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockSale),
        }),
      });

      const result = await service.getFlashSaleBySlug("eid-sale");
      expect(result.slug).toBe("eid-sale");
      expect(result.products[0].discountedPrice).toBe(450);
    });

    it("throws 404 ApiError when slug is missing", async () => {
      mockFlashSaleModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.getFlashSaleBySlug("non-existent")).rejects.toThrow(ApiError);
    });
  });

  describe("createFlashSale", () => {
    it("throws 400 ApiError when end date precedes start date", async () => {
      await expect(
        service.createFlashSale({
          name: "Flash Sale",
          discount: 15,
          products: ["p1"],
          startDate: new Date("2026-05-10"),
          endDate: new Date("2026-05-01"),
        })
      ).rejects.toThrow("End date must be after start date");
    });

    it("creates campaign and invalidates caches", async () => {
      const mockCreated = { _id: "fs3", name: "Summer Deal" };
      mockFlashSaleModel.create.mockResolvedValue(mockCreated);

      const result = await service.createFlashSale({
        name: "Summer Deal",
        discount: 30,
        products: ["p1", "p2"],
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-05"),
      });

      expect(result).toEqual(mockCreated);
      expect(mockCacheClearer).toHaveBeenCalledWith("cache:/api/flash-sales*");
    });
  });

  describe("deleteFlashSale", () => {
    it("deletes sale and purges dependent caches", async () => {
      mockFlashSaleModel.findByIdAndDelete.mockResolvedValue({ _id: "fs4" });

      const result = await service.deleteFlashSale("fs4");
      expect(result.message).toContain("removed successfully");
      expect(mockCacheClearer).toHaveBeenCalledWith("cache:/api/flash-sales*");
    });
  });
});

