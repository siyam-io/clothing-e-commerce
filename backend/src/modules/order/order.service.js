import mongoose from "mongoose";
import Order from "./order.model.js";
import Product from "../product/product.model.js";
import Coupon from "../coupon/coupon.model.js";
import { finalizeOrderProcessing } from "./order.utils.js";
import logger from "../../utils/logger.js";

/**
 * Persist new order and finalize inventory within a transactional boundary.
 *
 * @param {Object} orderPayload - Validated order creation body.
 * @param {boolean} [isCOD=false] - Whether transaction is Cash on Delivery.
 * @returns {Promise<Object>} Created and persisted order document.
 */
export const createOrderWithTransaction = async (orderPayload, isCOD = false) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = new Order(orderPayload);
    await order.save({ session });

    if (isCOD) {
      order.paymentResult = order.paymentResult || {};
      order.paymentResult.status = "COD";
      order.orderStatus = "Processing";
      await order.save({ session });

      await finalizeOrderProcessing(order, session);
    }

    await session.commitTransaction();
    session.endSession();
    return order;
  } catch (error) {
    logger.error("Order creation transaction aborted:", { error: error.message });
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Cancel existing order and replenish inventory allocations atomically.
 *
 * @param {string} orderId - Primary ID of target order.
 * @returns {Promise<Object>} Updated order document.
 */
export const cancelOrderWithTransaction = async (orderId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.orderStatus === "Cancelled") {
      throw new Error("Order is already cancelled");
    }

    const restoreStockOps = (order.orderItems || []).map((item) => ({
      updateOne: {
        filter: { _id: item.product, "sizes.size": item.size },
        update: { $inc: { "sizes.$.stock": item.quantity } },
      },
    }));

    if (restoreStockOps.length > 0) {
      await Product.bulkWrite(restoreStockOps, { session });
    }

    if (order.couponCode) {
      await Coupon.findOneAndUpdate(
        { code: order.couponCode },
        { $inc: { usedCount: -1 } },
        { session }
      );
    }

    order.orderStatus = "Cancelled";
    if (order.paymentResult) {
      order.paymentResult.status = "Cancelled";
    }
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();
    return order;
  } catch (error) {
    logger.error("Order cancellation transaction aborted:", { orderId, error: error.message });
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
