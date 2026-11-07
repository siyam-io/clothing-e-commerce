import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { CouponService } from "../coupon.service.js";
import { ApiError } from "../../../utils/responseHandler.js";

describe("CouponService", () => {
  let service;
  let mockCouponModel;
  let mockOrderModel;
  let mockCacheClearer;

  beforeEach(() => {
    mockCouponModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      countDocuments: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };
    mockOrderModel = {
      find: jest.fn(),
      countDocuments: jest.fn(),
      distinct: jest.fn(),
    };
    mockCacheClearer = jest.fn();

    service = new CouponService({
      couponModel: mockCouponModel,
      orderModel: mockOrderModel,
      cacheClearer: mockCacheClearer,
    });
  });

  describe("calculateDiscount", () => {
    it("calculates percentage discount accurately without exceeding maxDiscount", () => {
      const coupon = {
        discountType: "percentage",
        discountValue: 20,
        maxDiscount: 200,
      };

      // 20% of 1500 = 300, capped at 200
      const discount = service.calculateDiscount(coupon, 1500);
      expect(discount).toBe(200);
    });

    it("calculates fixed discount without exceeding cartTotal", () => {
      const coupon = {
        discountType: "fixed",
        discountValue: 500,
      };

      // Cart total 300, discount 500 capped at 300
      const discount = service.calculateDiscount(coupon, 300);
      expect(discount).toBe(300);
    });
  });

  describe("validateCoupon", () => {
    it("throws 404 when coupon is not found or inactive", async () => {
      mockCouponModel.findOne.mockResolvedValue(null);

      await expect(
        service.validateCoupon({ code: "DISCOUNT50", cartTotal: 1000 })
      ).rejects.toThrow(ApiError);
    });

    it("throws 400 when coupon is expired", async () => {
      mockCouponModel.findOne.mockResolvedValue({
        code: "EXPIRED10",
        isActive: true,
        endDate: new Date(Date.now() - 10000), // past date
      });

      await expect(
        service.validateCoupon({ code: "EXPIRED10", cartTotal: 1000 })
      ).rejects.toThrow("Coupon has expired");
    });

    it("throws 400 when order total is below minOrderAmount", async () => {
      mockCouponModel.findOne.mockResolvedValue({
        code: "MIN1000",
        isActive: true,
        minOrderAmount: 1000,
      });

      await expect(
        service.validateCoupon({ code: "MIN1000", cartTotal: 500 })
      ).rejects.toThrow("Minimum order amount");
    });

    it("returns valid discount payload on successful validation", async () => {
      const mockCoupon = {
        code: "SUMMER10",
        isActive: true,
        discountType: "percentage",
        discountValue: 10,
        minOrderAmount: 500,
      };
      mockCouponModel.findOne.mockResolvedValue(mockCoupon);

      const result = await service.validateCoupon({ code: "summer10", cartTotal: 2000 });
      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(200);
      expect(result.coupon).toEqual(mockCoupon);
    });
  });

  describe("createCoupon", () => {
    it("creates coupon with uppercase code and clears dashboard cache", async () => {
      const mockCreated = { _id: "cp1", code: "VIP20" };
      mockCouponModel.create.mockResolvedValue(mockCreated);

      const result = await service.createCoupon({ code: "vip20", discountValue: 20 });
      expect(result).toEqual(mockCreated);
      expect(mockCouponModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ code: "VIP20" })
      );
      expect(mockCacheClearer).toHaveBeenCalledWith("cache:/api/admin/dashboard*");
    });
  });
});

