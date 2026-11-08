import Order from "../order.model.js";
import User from "../../user/user.model.js";
import Product from "../../product/product.model.js";
import mongoose from "mongoose";
import { asyncHandler } from "../../../middleware/asyncHandler.js";
import { clearCache } from "../../../middleware/cacheMiddleware.js";
import {
  calculateValidatedOrder,
  normalizeShippingAddress,
  finalizeOrderProcessing
} from "../order.utils.js";
import pathaoService from '../../../services/pathao.service.js';
import { queueOrderStatusUpdateEmail, queuePathaoDispatch } from '../../../queues/index.js';
import { cancelOrderWithTransaction } from '../order.service.js';
import auditLogService from '../../auditLog/auditLog.service.js';
import logger from '../../../utils/logger.js';

export const getOrders = asyncHandler(async (req, res) => {
  const { search, status, user, sort, page = 1, limit = 30 } = req.query;
  const filter = {};

  if (status && status !== "all") {
    filter.orderStatus = status;
  }

  if (user) {
    filter.user = user;
  }

  if (search && search.trim()) {
    const safeSearch = search.trim();
    if (mongoose.Types.ObjectId.isValid(safeSearch)) {
      filter._id = safeSearch;
    } else {
      filter.$or = [
        { "shippingAddress.phone": { $regex: safeSearch, $options: "i" } },
        { "shippingAddress.name": { $regex: safeSearch, $options: "i" } },
      ];
    }
  }

  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
  const itemsLimit = Number(limit);

  // Dynamic sorting configuration
  const sortOrder = sort && sort !== "all" ? sort.split(",").join(" ") : "-createdAt";

  const ordersRaw = await Order.find(filter)
    .sort(sortOrder)
    .skip(skip)
    .limit(itemsLimit)
    .lean();

  const total = await Order.countDocuments(filter);

  const userIds = [...new Set(ordersRaw.map((o) => o.user).filter(Boolean))];

  const users = await User.find({
    _id: { $in: userIds }
  }).select("name email avatar role").populate("role");

  const userMap = users.reduce((acc, u) => {
    acc[String(u._id)] = u;
    return acc;
  }, {});

  const enrichedOrders = ordersRaw.map((order) => {
    const registeredUser = userMap[String(order.user)];

    return {
      ...order,
      user: registeredUser ? {
        name: registeredUser.name,
        email: registeredUser.email,
        avatar: registeredUser.avatar,
        isRegistered: true
      } : {
        name: order.shippingAddress?.name || "Unknown Guest",
        email: order.shippingAddress?.email || "N/A",
        isRegistered: false
      },
    };
  });

  res.json({
    success: true,
    orders: enrichedOrders,
    total,
    page: Number(page),
    pages: Math.ceil(total / itemsLimit) || 1,
  });
});

export const createOrderAdmin = asyncHandler(async (req, res) => {
  const {
    user: customerId,
    orderItems,
    shippingAddress,
    couponCode,
    paymentMethod = "Cash",
    orderStatus = "Delivered",
    paymentStatus = "Completed",
    shippingPrice,
    deliveryZone,
    discountAmount = 0,
    note = "",
    transactionId,
  } = req.body;

  const resolvedShippingPrice = shippingPrice !== undefined
    ? Number(shippingPrice)
    : (shippingAddress?.shippingPrice !== undefined ? Number(shippingAddress.shippingPrice) : undefined);
  const resolvedDeliveryZone = deliveryZone || shippingAddress?.deliveryZone || (resolvedShippingPrice === 0 ? "pos" : undefined);

  const orderData = await calculateValidatedOrder(
    orderItems,
    couponCode,
    resolvedShippingPrice,
    resolvedDeliveryZone,
    null,
    discountAmount
  );

  const order = new Order({
    user: customerId || undefined,
    isGuest: !customerId,
    orderItems: orderData.validatedItems,
    shippingAddress: normalizeShippingAddress(shippingAddress),
    itemsPrice: orderData.itemsPrice,
    discountAmount: orderData.discountAmount,
    shippingPrice: orderData.shippingPrice,
    totalPrice: orderData.totalPrice,
    couponCode: orderData.couponCode,
    paymentMethod,
    orderStatus,
    note: note?.trim() || "",
    paymentResult: {
      transactionId: transactionId?.trim() || req.body.transactionId?.trim() || `POS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: paymentStatus,
    },
  });

  const createdOrder = await order.save();

  // Finalize order processing and inventory deductions
  await finalizeOrderProcessing(createdOrder);

  clearCache('cache:/api/admin/dashboard*');

  const io = req.app.get('io');
  if (io) {
    io.emit('new_order', createdOrder);
    logger.info('Admin order created, socket emitted', { orderId: createdOrder._id });
  }

  auditLogService.recordLog({
    req,
    action: "CREATE",
    module: "Order",
    resourceId: createdOrder._id,
    description: `Created new ${createdOrder.isDirectBuy ? "POS" : "Manual"} Order #${String(createdOrder._id).slice(-8).toUpperCase()} (Total: ৳${createdOrder.totalPrice})`,
    details: {
      orderItemsCount: createdOrder.orderItems?.length,
      totalPrice: createdOrder.totalPrice,
      paymentMethod: createdOrder.paymentMethod,
    },
  });

  res.status(201).json(createdOrder);
});

export const getAdminOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate({ path: "user", select: "name email avatar role", populate: { path: "role" } })
    .populate({
      path: "orderItems.product",
      select: "name images slug sizes",
      populate: { path: "sizes.size", select: "name" },
    })
    .populate({ path: "orderItems.size", select: "name" });
  if (!order) return res.status(404).json({ message: "Protocol not found." });
  res.json(order);
});

export const updateOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found." });

  if (req.body.orderItems) {
    const restoreOps = order.orderItems.map((item) => ({
      updateOne: {
        filter: { _id: item.product, "sizes.size": item.size },
        update: { $inc: { "sizes.$.stock": item.quantity } },
      },
    }));
    if (restoreOps.length > 0) await Product.bulkWrite(restoreOps);

    const cityId = req.body.shippingAddress?.pathao_city_id || order.shippingAddress.pathao_city_id;
    const orderData = await calculateValidatedOrder(
      req.body.orderItems,
      order.couponCode,
      cityId
    );

    order.orderItems = orderData.validatedItems;
    order.itemsPrice = orderData.itemsPrice;
    order.discountAmount = orderData.discountAmount;
    order.shippingPrice = orderData.shippingPrice;
    order.totalPrice = orderData.totalPrice;

    const deductOps = order.orderItems.map((item) => ({
      updateOne: {
        // FIX Bug 6: Atomic deduct with $gte safety — prevents negative stock under concurrency
        filter: { _id: item.product, "sizes.size": item.size, "sizes.stock": { $gte: item.quantity } },
        update: { $inc: { "sizes.$.stock": -item.quantity } },
      },
    }));
    if (deductOps.length > 0) {
      const deductResult = await Product.bulkWrite(deductOps);
      if (deductResult.matchedCount < deductOps.length) {
        console.error(" updateOrder: Some items had insufficient stock during deduct.");
        // Don't throw — admin-level operation, log and continue
      }
    }
  }

  const oldStatus = order.orderStatus;

  if (req.body.orderStatus === "Cancelled" && oldStatus !== "Cancelled") {
    await cancelOrderWithTransaction(order._id);
    clearCache('cache:/api/admin/dashboard*');

    const updatedOrder = await Order.findById(order._id)
      .populate({ path: "user", select: "name email avatar role", populate: { path: "role" } })
      .populate({
        path: "orderItems.product",
        select: "name images slug sizes",
        populate: { path: "sizes.size", select: "name" },
      })
      .populate({ path: "orderItems.size", select: "name" });

    const io = req.app.get('io');
    if (io) {
      io.emit('order_updated', {
        orderId: updatedOrder._id,
        orderStatus: updatedOrder.orderStatus,
        paymentStatus: updatedOrder.paymentResult?.status,
        order: updatedOrder
      });
      logger.info('Order cancellation socket emitted', { orderId: updatedOrder._id });
    }

    try {
      await queueOrderStatusUpdateEmail(updatedOrder);
      logger.info('Status update email queued', { email: updatedOrder.shippingAddress.email, status: 'Cancelled' });
    } catch (error) {
      logger.warn('Failed to queue status update email, continuing:', { error: error.message });
    }

    return res.json(updatedOrder);
  }

  if (req.body.shippingAddress) {
    order.shippingAddress = { ...order.shippingAddress, ...req.body.shippingAddress };
  }
  if (req.body.orderStatus) order.orderStatus = req.body.orderStatus;
  if (req.body.paymentMethod) order.paymentMethod = req.body.paymentMethod;
  if (req.body.paymentResult) {
    order.paymentResult = { ...order.paymentResult, ...req.body.paymentResult };
  }

  await order.save();

  clearCache('cache:/api/admin/dashboard*');

  const io = req.app.get('io');
  if (io) {
    io.emit('order_updated', {
      orderId: order._id,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentResult?.status,
      order
    });
    logger.info('Order update socket emitted', { orderId: order._id });
  }

  if (req.body.orderStatus && req.body.orderStatus !== oldStatus) {
    try {
      await queueOrderStatusUpdateEmail(order);
      logger.info('Status update email queued', { email: order.shippingAddress.email, status: order.orderStatus });
    } catch (error) {
      logger.warn('Failed to queue status update email, continuing:', { error: error.message });
    }

    auditLogService.recordLog({
      req,
      action: "STATUS_CHANGE",
      module: "Order",
      resourceId: order._id,
      description: `Updated Order #${String(order._id).slice(-8).toUpperCase()} status from "${oldStatus}" to "${order.orderStatus}"`,
      details: { oldStatus, newStatus: order.orderStatus },
    });
  } else {
    auditLogService.recordLog({
      req,
      action: "UPDATE",
      module: "Order",
      resourceId: order._id,
      description: `Updated Order #${String(order._id).slice(-8).toUpperCase()} attributes / payment`,
      details: req.body,
    });
  }

  const updatedOrder = await Order.findById(order._id)
    .populate({ path: "user", select: "name email avatar role", populate: { path: "role" } })
    .populate({
      path: "orderItems.product",
      select: "name images slug sizes",
      populate: { path: "sizes.size", select: "name" },
    })
    .populate({ path: "orderItems.size", select: "name" });

  res.json(updatedOrder);
});

export const syncOrderToPathao = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found." });

  const pKeys = {
    clientId: process.env.PATHAO_CLIENT_ID,
    clientSecret: process.env.PATHAO_CLIENT_SECRET,
    username: process.env.PATHAO_USERNAME,
    password: process.env.PATHAO_PASSWORD,
    storeId: process.env.PATHAO_STORE_ID,
    isActive: !!process.env.PATHAO_CLIENT_ID
  };

  if (!pKeys?.isActive) {
    return res.status(400).json({ message: "Pathao service is currently inactive in settings." });
  }

  let cityId = order.shippingAddress.pathao_city_id;
  let zoneId = order.shippingAddress.pathao_zone_id;
  let areaId = order.shippingAddress.pathao_area_id;

  if (!cityId || !zoneId || !areaId) {
    const addressToSearch = `${order.shippingAddress.street}, ${order.shippingAddress.city}`;
    const resolved = await pathaoService.autoResolveAddress(addressToSearch, pKeys);

    if (resolved) {
      cityId = resolved.city_id;
      zoneId = resolved.zone_id;
      areaId = resolved.area_id;

      order.shippingAddress.pathao_city_id = String(cityId);
      order.shippingAddress.pathao_zone_id = String(zoneId);
      order.shippingAddress.pathao_area_id = String(areaId);
      await order.save();
    } else {
      return res.status(400).json({
        message: "Pathao couldn't auto-resolve this address. Please set City/Zone/Area IDs manually in the order details.",
      });
    }
  }

  const payload = {
    store_id: parseInt(pKeys.storeId),
    merchant_order_id: order._id.toString(),
    recipient_name: order.shippingAddress.name,
    recipient_phone: order.shippingAddress.phone,
    recipient_address: order.shippingAddress.street,
    recipient_city: parseInt(cityId),
    recipient_zone: parseInt(zoneId),
    recipient_area: parseInt(areaId),
    delivery_type: 48,
    item_type: 2,
    item_weight: "0.5",
    amount_to_collect: order.paymentResult.status === "Completed" ? 0 : Math.round(order.totalPrice),
    item_quantity: order.orderItems.length,
    item_description: order.orderItems.map((i) => i.name).join(", "),
  };

  try {
    const result = await queuePathaoDispatch({
      orderId: order._id,
      payload,
      pKeys,
    });

    auditLogService.recordLog({
      req,
      action: "DISPATCH",
      module: "Order",
      resourceId: order._id,
      description: `Dispatched Order #${String(order._id).slice(-8).toUpperCase()} to Pathao Courier`,
      details: { payload, consignmentId: result.consignmentId },
    });

    res.json({
      success: true,
      message: result.queued
        ? "Pathao dispatch request queued for processing."
        : "Pathao Synchronized successfully.",
      consignmentId: result.consignmentId || null,
      jobId: result.jobId || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: "Order not found." });
  }

  // Restore stock if the order status is NOT Cancelled
  if (order.orderStatus !== "Cancelled" && order.orderItems && order.orderItems.length > 0) {
    try {
      const restoreOps = order.orderItems.map((item) => ({
        updateOne: {
          filter: { _id: item.product, "sizes.size": item.size },
          update: { $inc: { "sizes.$.stock": item.quantity } },
        },
      }));
      await Product.bulkWrite(restoreOps);
    } catch (err) {
      console.error("Failed to restore stock on order deletion:", err);
    }
  }

  await Order.findByIdAndDelete(req.params.id);
  clearCache('cache:/api/admin/dashboard*');

  auditLogService.recordLog({
    req,
    action: "DELETE",
    module: "Order",
    resourceId: req.params.id,
    description: `Deleted Order #${String(req.params.id).slice(-8).toUpperCase()} (Total: ৳${order.totalPrice})`,
    details: { orderSummary: { totalPrice: order.totalPrice, status: order.orderStatus, itemsCount: order.orderItems?.length } },
  });

  res.json({ success: true, message: "Order deleted successfully" });
});
