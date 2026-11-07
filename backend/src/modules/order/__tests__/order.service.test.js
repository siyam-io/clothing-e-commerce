import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import mongoose from "mongoose";
import { cancelOrderWithTransaction } from "../order.service.js";
import Order from "../order.model.js";
import Product from "../../product/product.model.js";
import Coupon from "../../coupon/coupon.model.js";

describe("OrderService - cancelOrderWithTransaction", () => {
  let mockSession;

  beforeEach(() => {
    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    jest.spyOn(mongoose, "startSession").mockResolvedValue(mockSession);
    jest.spyOn(Product, "bulkWrite").mockResolvedValue({ modifiedCount: 1 });
    jest.spyOn(Coupon, "findOneAndUpdate").mockResolvedValue({});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("throws error if order is not found", async () => {
    jest.spyOn(Order, "findById").mockReturnValue({
      session: jest.fn().mockResolvedValue(null),
    });

    await expect(cancelOrderWithTransaction("non_existent")).rejects.toThrow("Order not found");
    expect(mockSession.abortTransaction).toHaveBeenCalled();
  });

  it("throws error if order is already cancelled", async () => {
    const mockOrder = {
      _id: "ord_1",
      orderStatus: "Cancelled",
    };
    jest.spyOn(Order, "findById").mockReturnValue({
      session: jest.fn().mockResolvedValue(mockOrder),
    });

    await expect(cancelOrderWithTransaction("ord_1")).rejects.toThrow("Order is already cancelled");
    expect(mockSession.abortTransaction).toHaveBeenCalled();
  });

  it("cancels order, restores inventory, and decrements coupon usage atomically", async () => {
    const mockOrder = {
      _id: "ord_2",
      orderStatus: "Processing",
      couponCode: "SAVE20",
      orderItems: [
        { product: "p1", size: "s1", quantity: 2 },
      ],
      paymentResult: { status: "Completed" },
      save: jest.fn().mockResolvedValue(true),
    };

    jest.spyOn(Order, "findById").mockReturnValue({
      session: jest.fn().mockResolvedValue(mockOrder),
    });

    const result = await cancelOrderWithTransaction("ord_2");

    expect(result.orderStatus).toBe("Cancelled");
    expect(result.paymentResult.status).toBe("Cancelled");
    expect(Product.bulkWrite).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          updateOne: expect.objectContaining({
            filter: { _id: "p1", "sizes.size": "s1" },
            update: { $inc: { "sizes.$.stock": 2 } },
          }),
        }),
      ]),
      { session: mockSession }
    );
    expect(Coupon.findOneAndUpdate).toHaveBeenCalledWith(
      { code: "SAVE20" },
      { $inc: { usedCount: -1 } },
      { session: mockSession }
    );
    expect(mockSession.commitTransaction).toHaveBeenCalled();
  });
});

