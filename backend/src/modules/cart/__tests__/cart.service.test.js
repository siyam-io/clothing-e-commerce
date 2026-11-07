import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { CartService } from "../cart.service.js";
import { ApiError } from "../../../utils/responseHandler.js";

describe("CartService", () => {
  let service;
  let mockCartModel;
  let mockProductModel;
  let mockSizeModel;

  beforeEach(() => {
    mockCartModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    };
    mockProductModel = {
      findById: jest.fn(),
    };
    mockSizeModel = {
      findById: jest.fn(),
    };

    service = new CartService({
      cartModel: mockCartModel,
      productModel: mockProductModel,
      sizeModel: mockSizeModel,
    });
  });

  describe("calculateTotals", () => {
    it("returns zero counts for empty cart", () => {
      const totals = service.calculateTotals({ items: [] });
      expect(totals).toEqual({ totalItems: 0, totalPrice: 0 });
    });

    it("applies discounts and skips inactive products", () => {
      const cart = {
        items: [
          {
            product: { price: 1000, discount: 20, isActive: true },
            quantity: 2,
          },
          {
            product: { price: 500, discount: 0, isActive: true },
            quantity: 1,
          },
          {
            product: { price: 2000, discount: 50, isActive: false },
            quantity: 3,
          },
        ],
      };

      const totals = service.calculateTotals(cart);
      // Item 1: (1000 * 0.8) * 2 = 1600
      // Item 2: 500 * 1 = 500
      // Item 3: inactive, skipped
      // Total: 2100, count: 3
      expect(totals.totalItems).toBe(3);
      expect(totals.totalPrice).toBe(2100);
    });
  });

  describe("getCart", () => {
    it("returns empty cart payload when userId is falsy", async () => {
      const result = await service.getCart(null);
      expect(result).toEqual({ items: [], totalItems: 0, totalPrice: 0 });
    });

    it("creates empty cart when no cart exists for user", async () => {
      mockCartModel.findOne.mockResolvedValue(null);
      mockCartModel.create.mockResolvedValue({
        toObject: () => ({ user: "usr_1", items: [] }),
      });

      const result = await service.getCart("usr_1");
      expect(result.totalItems).toBe(0);
      expect(result.totalPrice).toBe(0);
    });
  });

  describe("addToCart", () => {
    it("throws 404 when product is inactive or missing", async () => {
      mockProductModel.findById.mockResolvedValue(null);
      mockSizeModel.findById.mockResolvedValue({ _id: "size_m" });

      await expect(
        service.addToCart("usr_1", { productId: "prod_1", sizeId: "size_m", quantity: 1 })
      ).rejects.toThrow(ApiError);
    });

    it("throws 400 when quantity exceeds available stock", async () => {
      mockProductModel.findById.mockResolvedValue({
        _id: "prod_1",
        isActive: true,
        sizes: [{ size: "size_m", stock: 2 }],
      });
      mockSizeModel.findById.mockResolvedValue({ _id: "size_m" });

      await expect(
        service.addToCart("usr_1", { productId: "prod_1", sizeId: "size_m", quantity: 5 })
      ).rejects.toThrow(ApiError);
    });

    it("adds item variation and calculates total", async () => {
      mockProductModel.findById.mockResolvedValue({
        _id: "prod_1",
        isActive: true,
        price: 1200,
        discount: 0,
        sizes: [{ size: "size_m", stock: 10 }],
      });
      mockSizeModel.findById.mockResolvedValue({ _id: "size_m" });

      const mockCartDoc = {
        user: "usr_1",
        items: [],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue(true),
        toObject: function () {
          return { user: this.user, items: this.items };
        },
      };

      mockCartModel.findOne.mockResolvedValue(mockCartDoc);

      const result = await service.addToCart("usr_1", {
        productId: "prod_1",
        sizeId: "size_m",
        quantity: 2,
      });

      expect(mockCartDoc.items.length).toBe(1);
      expect(mockCartDoc.items[0]).toEqual({
        product: "prod_1",
        size: "size_m",
        quantity: 2,
      });
      expect(mockCartDoc.save).toHaveBeenCalled();
    });
  });

  describe("sanitizeCart", () => {
    it("purges orphaned items without active products or sizes", async () => {
      const mockCart = {
        items: [
          { product: { _id: "p1", isActive: true }, size: { _id: "s1" }, quantity: 1 },
          { product: null, size: { _id: "s2" }, quantity: 1 },
          { product: { _id: "p3", isActive: false }, size: { _id: "s3" }, quantity: 1 },
        ],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue(true),
      };

      await service.sanitizeCart(mockCart);

      expect(mockCart.items.length).toBe(1);
      expect(mockCart.items[0].product).toBe("p1");
      expect(mockCart.save).toHaveBeenCalled();
    });
  });
});

