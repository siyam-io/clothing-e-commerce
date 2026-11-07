import { describe, it, expect } from "@jest/globals";
import {
  validateOrderItem,
  resolveShippingPrice,
  normalizeShippingAddress,
} from "../order.utils.js";

describe("Order Utilities", () => {
  describe("validateOrderItem", () => {
    const activeProduct = {
      _id: "prod-1",
      name: "Oxford Shirt",
      price: 1500,
      discount: 10,
      isActive: true,
      sizes: [
        { size: "size-m", stock: 10 },
        { size: "size-l", stock: 2 },
      ],
      images: ["shirt.jpg"],
    };

    it("should validate and compute discounted line price", () => {
      const item = { product: "prod-1", size: "size-m", quantity: 2 };
      const validated = validateOrderItem(item, activeProduct);

      expect(validated.name).toBe("Oxford Shirt");
      expect(validated.price).toBe(1350); // 1500 - 10%
      expect(validated.quantity).toBe(2);
    });

    it("should throw error if product is inactive", () => {
      const inactive = { ...activeProduct, isActive: false };
      const item = { product: "prod-1", size: "size-m", quantity: 1 };

      expect(() => validateOrderItem(item, inactive)).toThrow(
        "Product unavailable or inactive"
      );
    });

    it("should throw error if stock is insufficient", () => {
      const item = { product: "prod-1", size: "size-l", quantity: 5 };

      expect(() => validateOrderItem(item, activeProduct)).toThrow(
        "Insufficient inventory for Oxford Shirt"
      );
    });
  });

  describe("resolveShippingPrice", () => {
    const settings = {
      shipping: {
        insideDhaka: 60,
        outsideDhaka: 120,
        couriers: [
          { _id: "courier-express", name: "Express Air", charge: 250, isActive: true },
        ],
      },
    };

    it("should return inside Dhaka rate when zone is dhaka", () => {
      const charge = resolveShippingPrice(settings, "dhaka");
      expect(charge).toBe(60);
    });

    it("should return outside Dhaka rate for other locations", () => {
      const charge = resolveShippingPrice(settings, "chittagong");
      expect(charge).toBe(120);
    });

    it("should return custom courier rate when matched", () => {
      const charge = resolveShippingPrice(settings, "courier-express");
      expect(charge).toBe(250);
    });

    it("should return 0 rate when zone is pos or instore", () => {
      expect(resolveShippingPrice(settings, "pos")).toBe(0);
      expect(resolveShippingPrice(settings, "instore")).toBe(0);
    });

    it("should return fallback price when provided", () => {
      expect(resolveShippingPrice(settings, undefined, 0)).toBe(0);
      expect(resolveShippingPrice(settings, undefined, 80)).toBe(80);
    });
  });

  describe("normalizeShippingAddress", () => {
    it("should structure address payload correctly", () => {
      const raw = {
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "01711111111",
        street: "Road 12, House 4",
        city: "Dhaka",
      };

      const normalized = normalizeShippingAddress(raw);
      expect(normalized.name).toBe("Jane Doe");
      expect(normalized.address).toBe("Road 12, House 4, Dhaka");
    });
  });
});

