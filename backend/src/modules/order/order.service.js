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
export const createOrderWithTransaction = async (orderPayload, isCOD = false, maxRetries = 8) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const initialPayload = { ...orderPayload };
      if (isCOD) {
        initialPayload.orderStatus = "Processing";
        initialPayload.paymentResult = {
          ...(initialPayload.paymentResult || {}),
          status: "COD",
        };
      }

      const order = new Order(initialPayload);
      await order.save({ session });

      if (isCOD) {
        await finalizeOrderProcessing(order, session);
      }

      await session.commitTransaction();
      session.endSession();
      return order;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      const isTransient =
        (typeof error.hasErrorLabel === "function" && error.hasErrorLabel("TransientTransactionError")) ||
        error.code === 112 ||
        error.codeName === "WriteConflict" ||
        error?.errorResponse?.code === 112 ||
        (Array.isArray(error.errorLabels) && error.errorLabels.includes("TransientTransactionError")) ||
        (error.errorLabelSet && (error.errorLabelSet.has("TransientTransactionError") || error.errorLabelSet.has("UnknownTransactionCommitResult"))) ||
        (error.errorResponse?.errmsg && error.errorResponse.errmsg.toLowerCase().includes("write conflict")) ||
        (error.message && (error.message.toLowerCase().includes("write conflict") || error.message.includes("TransientTransactionError")));

      if (isTransient && attempt < maxRetries) {
        const jitter = Math.floor(Math.random() * 100) + Math.min(attempt * 60, 600);
        logger.warn(
          `MongoDB WriteConflict on order transaction. Retrying attempt ${attempt}/${maxRetries} after ${jitter}ms...`
        );
        await new Promise((res) => setTimeout(res, jitter));
        continue;
      }

      logger.error("Order creation transaction aborted:", { error: error.message });
      throw error;
    }
  }
};

/**
 * Cancel existing order and replenish inventory allocations atomically.
 *
 * @param {string} orderId - Primary ID of target order.
 * @returns {Promise<Object>} Updated order document.
 */
export const cancelOrderWithTransaction = async (orderId, maxRetries = 8) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
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

      restoreStockOps.sort((a, b) => {
        const idA = String(a.updateOne.filter._id);
        const idB = String(b.updateOne.filter._id);
        if (idA !== idB) return idA.localeCompare(idB);
        return String(a.updateOne.filter["sizes.size"]).localeCompare(String(b.updateOne.filter["sizes.size"]));
      });

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
      await session.abortTransaction();
      session.endSession();

      const isTransient =
        (typeof error.hasErrorLabel === "function" && error.hasErrorLabel("TransientTransactionError")) ||
        error.code === 112 ||
        error.codeName === "WriteConflict" ||
        error?.errorResponse?.code === 112 ||
        (Array.isArray(error.errorLabels) && error.errorLabels.includes("TransientTransactionError")) ||
        (error.errorLabelSet && (error.errorLabelSet.has("TransientTransactionError") || error.errorLabelSet.has("UnknownTransactionCommitResult"))) ||
        (error.errorResponse?.errmsg && error.errorResponse.errmsg.toLowerCase().includes("write conflict")) ||
        (error.message && (error.message.toLowerCase().includes("write conflict") || error.message.includes("TransientTransactionError")));

      if (isTransient && attempt < maxRetries) {
        const jitter = Math.floor(Math.random() * 100) + Math.min(attempt * 60, 600);
        logger.warn(
          `MongoDB WriteConflict on order cancellation. Retrying attempt ${attempt}/${maxRetries} after ${jitter}ms...`
        );
        await new Promise((res) => setTimeout(res, jitter));
        continue;
      }

      logger.error("Order cancellation transaction aborted:", { orderId, error: error.message });
      throw error;
    }
  }
};
