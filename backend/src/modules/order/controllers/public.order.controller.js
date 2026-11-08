import Order from "../order.model.js";
import mongoose from "mongoose";
import { asyncHandler } from "../../../middleware/asyncHandler.js";
import { clearCache } from "../../../middleware/cacheMiddleware.js";
import {
  calculateValidatedOrder,
  normalizeShippingAddress,
  finalizeOrderProcessing
} from "../order.utils.js";
import { createOrderWithTransaction } from "../order.service.js";
import {
  initiateSSLCommerz,
  initiateBkash,
  handleCODGateway,
} from "../order.gateway.js";
import bkashService from '../../../services/bkash.service.js';
import PageSetting from "../../settings/settings.model.js";
import ApiKey from "../../settings/apiKey.model.js";
import { decrypt } from "../../../utils/encryption.js";
import PDFDocument from "pdfkit";
import SSLCommerzPayment from "sslcommerz-lts";
import logger from "../../../utils/logger.js";
import auditLogService from "../../auditLog/auditLog.service.js";

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

// Sanitizer to enforce strict alphanumeric UUID/ID formats on guest session headers
export const sanitizeGuestId = (rawId) => {
  if (typeof rawId !== "string") return null;
  const trimmed = rawId.trim();
  const isValidFormat = /^(guest_)?[a-zA-Z0-9_-]{10,64}$/.test(trimmed);
  return isValidFormat ? trimmed : null;
};

const getUserIdFromReq = (req) => {
  if (req.user?._id) return req.user._id.toString();
  if (req.user?.id) return req.user.id.toString();
  return sanitizeGuestId(req.headers["x-guest-id"]);
};

let cachedPageSetting = null;
let cachedPageSettingExpiry = 0;
let cachedApiKey = null;
let cachedApiKeyExpiry = 0;

export const getCachedPageSettings = async () => {
  const now = Date.now();
  if (cachedPageSetting && now < cachedPageSettingExpiry) {
    return cachedPageSetting;
  }
  const settings = await PageSetting.findOne();
  if (settings) {
    cachedPageSetting = settings;
    cachedPageSettingExpiry = now + 60000;
  }
  return settings;
};

export const getCachedApiKeys = async () => {
  const now = Date.now();
  if (cachedApiKey && now < cachedApiKeyExpiry) {
    return cachedApiKey;
  }
  const apiKeys = await ApiKey.findOne();
  if (apiKeys) {
    cachedApiKey = apiKeys;
    cachedApiKeyExpiry = now + 60000;
  }
  return apiKeys;
};

export const initPayment = asyncHandler(async (req, res) => {
  logger.info("Order initiation requested", {
    userId: getUserIdFromReq(req),
    itemsCount: req.body.orderItems?.length,
    paymentMethod: req.body.paymentMethod,
  });

  const {
    orderItems,
    shippingAddress,
    isDirectBuy,
    couponCode,
    shippingPrice,
    deliveryZone,
    paymentMethod = "ssl",
  } = req.body;

  const isRegisteredUser = Boolean(req.user && req.user._id);
  const registeredUserId = isRegisteredUser ? req.user._id : undefined;
  const guestId = !isRegisteredUser ? sanitizeGuestId(req.headers["x-guest-id"]) : undefined;

  if (!isRegisteredUser && !guestId) {
    return res.status(401).json({
      success: false,
      message: "Identity required. Please provide a Guest Session or Login.",
    });
  }

  const settings = await getCachedPageSettings();
  const apiKeys = await getCachedApiKeys();

  if (!settings) {
    console.error(" SETTINGS NOT INITIALIZED");
    throw new Error("Settings not initialized.");
  }

  const sslCreds = {
    storeId: apiKeys?.sslStoreId || process.env.SSL_STORE_ID,
    storePassword: apiKeys?.sslStorePassword ? decrypt(apiKeys.sslStorePassword) : process.env.SSL_STORE_PASSWORD
  };

  const bkashCreds = {
    appKey: apiKeys?.bkashAppKey || process.env.BKASH_APP_KEY,
    appSecret: apiKeys?.bkashAppSecret ? decrypt(apiKeys.bkashAppSecret) : process.env.BKASH_APP_SECRET
  };

  try {
    // FIX Issue 14: Pass already-fetched settings to avoid a second DB query inside calculateValidatedOrder
    const orderData = await calculateValidatedOrder(
      orderItems,
      couponCode,
      shippingPrice,
      deliveryZone,
      settings  // preloaded
    );

    const orderPayload = {
      user: registeredUserId,
      isGuest: !isRegisteredUser,
      guestId: guestId,
      orderItems: orderData.validatedItems,
      shippingAddress: normalizeShippingAddress(shippingAddress),
      itemsPrice: orderData.itemsPrice,
      discountAmount: orderData.discountAmount,
      shippingPrice: orderData.shippingPrice,
      totalPrice: orderData.totalPrice,
      couponCode: orderData.couponCode,
      isDirectBuy: !!isDirectBuy,
      paymentMethod: paymentMethod === "cod" ? "COD" : paymentMethod === "bkash" ? "bKash" : "SSLCommerz",
      paymentResult: {
        transactionId: new mongoose.Types.ObjectId().toString(),
        status: "Pending",
      },
    };

    const logOrderCreated = async (order) => {
      try {
        await auditLogService.recordLog({
          req,
          action: "CREATE",
          module: "Order",
          resourceId: order._id,
          resourceName: `Order #${order._id.toString().slice(-6).toUpperCase()}`,
          description: `Customer placed order #${order._id.toString().slice(-6).toUpperCase()} via ${order.paymentMethod} (Total: ৳${order.totalPrice})`,
          details: {
            itemsCount: order.orderItems?.length,
            totalPrice: order.totalPrice,
            paymentMethod: order.paymentMethod,
            customerName: order.shippingAddress?.name,
            phone: order.shippingAddress?.phone,
            city: order.shippingAddress?.city,
          },
          status: "SUCCESS",
        });
      } catch (logErr) {
        logger.error("Failed to record order creation audit log:", { error: logErr.message });
      }
    };

    if (paymentMethod === "cod") {
      const order = await createOrderWithTransaction(orderPayload, true);
      clearCache('cache:/api/admin/dashboard*');
      await logOrderCreated(order);

      const io = req.app.get('io');
      if (io) {
        io.emit('new_order', order);
        logger.info('COD order created, socket emitted', { orderId: order._id });
      }

      res.json(await handleCODGateway(order));
    } else if (paymentMethod === "bkash") {
      const order = await createOrderWithTransaction(orderPayload, false);
      clearCache('cache:/api/admin/dashboard*');
      await logOrderCreated(order);

      const io = req.app.get('io');
      if (io) {
        io.emit('new_order', order);
        logger.info('bKash order created, socket emitted', { orderId: order._id });
      }

      const bkashData = await initiateBkash(order, bkashCreds);
      await Order.findByIdAndUpdate(order._id, {
        $set: { "paymentResult.bkashPaymentID": bkashData.paymentID },
      });
      res.json({ url: bkashData.url });
    } else {
      const order = await createOrderWithTransaction(orderPayload, false);
      clearCache('cache:/api/admin/dashboard*');
      await logOrderCreated(order);

      const io = req.app.get('io');
      if (io) {
        io.emit('new_order', order);
        logger.info('SSLCommerz order created, socket emitted', { orderId: order._id });
      } else {
        logger.warn('SSL ORDER: Socket.io instance not available');
      }

      const sslUrl = await initiateSSLCommerz(order, sslCreds);
      res.json({ url: sslUrl });
    }
  } catch (err) {
    console.error(" ORDER PROCESSING ERROR:", err);
    res.status(400).json({
      success: false,
      message: err.message || "Order protocol failure."
    });
  }
});

export const paymentSuccess = asyncHandler(async (req, res) => {
  const { tran_id } = req.params;
  const { val_id } = req.body;

  const order = await Order.findOne({ "paymentResult.transactionId": tran_id });
  if (!order) {
    console.error(` paymentSuccess: Order not found for tran_id=${tran_id}`);
    return res.redirect(`${frontendUrl}/payment/failed?reason=Order%20not%20found`);
  }

  // Idempotency: Return early if already completed
  if (order.paymentResult.status === "Completed") {
    return res.redirect(`${frontendUrl}/payment/success?orderId=${order._id}`);
  }

  if (order.paymentResult.status !== "Pending") {
    return res.redirect(`${frontendUrl}/payment/failed?reason=Invalid%20order%20state`);
  }

  if (!val_id) {
    console.error(` paymentSuccess: Missing val_id for tran_id=${tran_id}`);
    return res.redirect(`${frontendUrl}/payment/failed?reason=Missing%20validation%20token`);
  }

  // Fetch Gateway Credentials
  const apiKeys = await ApiKey.findOne();
  const storeId = apiKeys?.sslStoreId || process.env.SSL_STORE_ID;
  const rawStorePass = apiKeys?.sslStorePassword ? decrypt(apiKeys.sslStorePassword) : process.env.SSL_STORE_PASSWORD;
  const isLive = apiKeys?.sslIsTest === false || process.env.NODE_ENV === "production";

  if (!storeId || !rawStorePass) {
    console.error(" SSLCommerz credentials uninitialized in database or environment.");
    return res.redirect(`${frontendUrl}/payment/failed?reason=Payment%20configuration%20error`);
  }

  try {
    const sslcz = new SSLCommerzPayment(storeId.trim(), rawStorePass.trim(), isLive);
    const validationData = await sslcz.validate({ val_id });

    const isStatusValid = validationData.status === "VALID" || validationData.status === "VALIDATED";
    const paidAmount = Number(validationData.amount || validationData.currency_amount || 0);
    const expectedAmount = Number(order.totalPrice);

    if (!isStatusValid) {
      console.error(` SSLCommerz Rejected: Status=${validationData.status} for Order=${order._id}`);
      return res.redirect(`${frontendUrl}/payment/failed?reason=Gateway%20declined%20transaction`);
    }

    // Price tampering defense (0.01 BDT delta tolerance)
    if (Math.abs(paidAmount - expectedAmount) > 0.01) {
      logger.error(`Price discrepancy detected: Order ${order._id} Expected ${expectedAmount}, Received ${paidAmount}`);
      order.paymentResult.status = "Failed";
      order.orderStatus = "Cancelled";
      await order.save();
      return res.redirect(`${frontendUrl}/payment/failed?reason=Amount%20mismatch%20detected`);
    }

    order.paymentResult.status = "Completed";
    order.paymentResult.val_id = val_id;
    order.orderStatus = "Processing";
    await order.save();
    await finalizeOrderProcessing(order);
    clearCache('cache:/api/admin/dashboard*');

    const io = req.app.get('io');
    if (io) {
      io.emit('new_order', order);
      logger.info('SSL payment verified, new_order event emitted', { orderId: order._id });
    }

    return res.redirect(`${frontendUrl}/payment/success?orderId=${order._id}`);
  } catch (err) {
    logger.error(`SSLCommerz verification failed for tran_id=${tran_id}:`, { error: err.message });
    return res.redirect(`${frontendUrl}/payment/failed?reason=Gateway%20verification%20failed`);
  }
});

export const bkashSuccess = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { paymentID, status } = req.query;

  const apiKeys = await ApiKey.findOne();
  const bkashCreds = {
    appKey: apiKeys?.bkashAppKey || process.env.BKASH_APP_KEY,
    appSecret: apiKeys?.bkashAppSecret ? decrypt(apiKeys.bkashAppSecret) : process.env.BKASH_APP_SECRET
  };

  const order = await Order.findById(orderId);
  if (!order) {
    logger.error(`bkashSuccess: Order not found for orderId=${orderId}`);
    return res.redirect(`${frontendUrl}/payment/failed?reason=Order not found`);
  }

  // Idempotency / Replay Attack Guard
  if (order.paymentResult?.status === "Completed") {
    logger.info(`bkashSuccess: Order ${orderId} already completed, skipping duplicate processing`);
    return res.redirect(`${frontendUrl}/payment/success?orderId=${order._id}`);
  }

  // PaymentID Binding Validation (CWE-346 Origin & Token binding)
  if (order.paymentResult?.bkashPaymentID && paymentID && order.paymentResult.bkashPaymentID !== paymentID) {
    logger.error(`bkashSuccess: PaymentID mismatch for order ${orderId}. Expected ${order.paymentResult.bkashPaymentID}, received ${paymentID}`);
    return res.redirect(`${frontendUrl}/payment/failed?reason=Payment%20identification%20mismatch`);
  }

  if (status === "success" && paymentID) {
    try {
      const executeResult = await bkashService.executePayment(paymentID, bkashCreds);
      if (executeResult.transactionStatus === "Completed") {
        const paidAmount = Number(executeResult.amount || 0);
        const expectedAmount = Number(order.totalPrice);

        // Price tampering defense (0.01 BDT delta tolerance)
        if (Math.abs(paidAmount - expectedAmount) > 0.01) {
          logger.error(`bKash price discrepancy detected: Order ${order._id} Expected ${expectedAmount}, Paid ${paidAmount}`);
          order.paymentResult.status = "Failed";
          order.orderStatus = "Cancelled";
          await order.save();
          return res.redirect(`${frontendUrl}/payment/failed?reason=Amount%20mismatch%20detected`);
        }

        order.paymentResult.status = "Completed";
        order.paymentResult.transactionId = executeResult.trxID;
        order.orderStatus = "Processing";
        await order.save();
        await finalizeOrderProcessing(order);
        clearCache('cache:/api/admin/dashboard*');

        const io = req.app.get('io');
        if (io) {
          io.emit('new_order', order);
          logger.info('bKash payment success, new_order event emitted', { orderId: order._id });
        }

        return res.redirect(`${frontendUrl}/payment/success?orderId=${order._id}`);
      }
    } catch (err) {
      console.error(` bkashSuccess: bKash execute failed:`, err.message);
      return res.redirect(`${frontendUrl}/payment/failed?reason=bKash execution error`);
    }
  }
  res.redirect(`${frontendUrl}/payment/failed?reason=bKash verification failed`);
});

export const paymentFail = asyncHandler(async (req, res) => {
  const { tran_id } = req.params;
  await Order.findOneAndUpdate(
    { "paymentResult.transactionId": tran_id },
    { $set: { "paymentResult.status": "Failed", orderStatus: "Cancelled" } }
  );
  clearCache('cache:/api/admin/dashboard*');
  res.redirect(`${frontendUrl}/payment/failed?tran_id=${tran_id}&reason=Payment rejected by gateway`);
});

export const paymentCancel = asyncHandler(async (req, res) => {
  res.redirect(`${frontendUrl}/payment/failed?reason=User cancelled transaction`);
});

export const ipn = asyncHandler(async (req, res) => {
  const { val_id, tran_id } = req.body;

  if (!val_id || !tran_id) {
    return res.status(400).send("Bad Request: Missing validation parameters.");
  }

  const order = await Order.findOne({ "paymentResult.transactionId": tran_id });
  if (!order || order.paymentResult.status === "Completed") {
    return res.status(200).send("IPN Acknowledged: Order already completed or not found.");
  }

  const apiKeys = await ApiKey.findOne();
  const storeId = apiKeys?.sslStoreId || process.env.SSL_STORE_ID;
  const rawStorePass = apiKeys?.sslStorePassword ? decrypt(apiKeys.sslStorePassword) : process.env.SSL_STORE_PASSWORD;
  const isLive = apiKeys?.sslIsTest === false || process.env.NODE_ENV === "production";

  try {
    const sslcz = new SSLCommerzPayment(storeId.trim(), rawStorePass.trim(), isLive);
    const validationData = await sslcz.validate({ val_id });

    const isStatusValid = validationData.status === "VALID" || validationData.status === "VALIDATED";
    const paidAmount = Number(validationData.amount || validationData.currency_amount || 0);

    if (isStatusValid && Math.abs(paidAmount - Number(order.totalPrice)) <= 0.01) {
      order.paymentResult.status = "Completed";
      order.paymentResult.val_id = val_id;
      order.orderStatus = "Processing";
      await order.save();

      await finalizeOrderProcessing(order);
      clearCache('cache:/api/admin/dashboard*');

      const io = req.app.get('io');
      if (io) io.emit('new_order', order);

      return res.status(200).send("IPN Processed Successfully");
    }

    console.warn(` IPN Validation Failed for transaction: ${tran_id}`);
    return res.status(400).send("IPN Verification Failed");
  } catch (err) {
    console.error(" IPN Handler Error:", err.message);
    return res.status(500).send("Internal Server Error processing IPN");
  }
});

export const getMyOrders = asyncHandler(async (req, res) => {
  let query;

  // 1. Authenticated User: Strictly use JWT verified identity
  if (req.user && req.user._id) {
    query = { user: req.user._id };
  } else {
    // 2. Guest Context: Strictly isolate to guest orders
    const rawGuestHeader = req.headers["x-guest-id"];
    const sanitizedGuestId = sanitizeGuestId(rawGuestHeader);

    if (!sanitizedGuestId) {
      return res.status(401).json({
        success: false,
        message: "Valid guest session or user authentication required."
      });
    }

    query = {
      guestId: sanitizedGuestId,
      isGuest: true
    };
  }

  const page = parseInt(req.query.page, 10);
  const limit = parseInt(req.query.limit, 10) || 10;

  if (!isNaN(page) && page > 0) {
    const skip = (page - 1) * limit;
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .populate("orderItems.product", "name images slug")
      .populate("orderItems.size", "name");

    return res.json({
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  }

  const orders = await Order.find(query)
    .sort("-createdAt")
    .populate("orderItems.product", "name images slug")
    .populate("orderItems.size", "name");

  res.json(orders);
});

export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { phone } = req.query;

  let order;

  if (mongoose.Types.ObjectId.isValid(id)) {
    order = await Order.findById(id)
      .populate({ path: "user", select: "name email avatar role", populate: { path: "role" } })
      .populate("orderItems.product", "name images slug")
      .populate("orderItems.size", "name");
  } else if (id && id.length >= 6 && phone && typeof phone === "string") {
    const cleanPhone = phone.trim();
    const orders = await Order.find({ "shippingAddress.phone": cleanPhone })
      .populate({ path: "user", select: "name email avatar role", populate: { path: "role" } })
      .populate("orderItems.product", "name images slug")
      .populate("orderItems.size", "name");

    order = orders.find(o => o._id.toString().toLowerCase().endsWith(id.toLowerCase()));
  } else {
    return res.status(400).json({ message: "Invalid Order ID protocol." });
  }

  if (!order) return res.status(404).json({ message: "Protocol not found." });

  const userRole = req.user?.role?.name;
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  const orderUserId = order.user?._id ? order.user._id.toString() : order.user?.toString();
  const isRegisteredOwner = Boolean(
    req.user?._id && orderUserId && orderUserId === req.user._id.toString()
  );

  const rawGuestHeader = req.headers["x-guest-id"];
  const sanitizedGuestId = sanitizeGuestId(rawGuestHeader);
  const isGuestOwner = Boolean(
    order.isGuest && sanitizedGuestId && order.guestId === sanitizedGuestId
  );

  const isPhoneMatch = Boolean(
    order.isGuest && phone && typeof phone === "string" && order.shippingAddress?.phone === phone.trim()
  );

  if (!isRegisteredOwner && !isGuestOwner && !isAdmin && !isPhoneMatch) {
    return res.status(403).json({ message: "Access Denied: Insufficient authorization." });
  }

  res.json(order);
});

export const getOrderReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await Order.findById(id)
    .populate("orderItems.product", "name")
    .populate("orderItems.size", "name");

  if (!order) {
    return res.status(404).json({ message: "Order not found." });
  }

  // Security Check
  const userRole = req.user?.role?.name;
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  const orderUserId = order.user?._id ? order.user._id.toString() : order.user?.toString();
  const isRegisteredOwner = Boolean(
    req.user?._id && orderUserId && orderUserId === req.user._id.toString()
  );

  const rawGuestHeader = req.headers["x-guest-id"];
  const sanitizedGuestId = sanitizeGuestId(rawGuestHeader);
  const isGuestOwner = Boolean(
    order.isGuest && sanitizedGuestId && order.guestId === sanitizedGuestId
  );

  const { phone } = req.query;
  const isPhoneMatch = Boolean(
    order.isGuest && phone && typeof phone === "string" && order.shippingAddress?.phone === phone.trim()
  );

  if (!isRegisteredOwner && !isGuestOwner && !isAdmin && !isPhoneMatch) {
    return res.status(403).json({ message: "Access Denied: Insufficient authorization." });
  }

  const doc = new PDFDocument({ margin: 50 });
  let filename = `invoice-${order._id.toString().slice(-8).toUpperCase()}.pdf`;

  res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
  res.setHeader('Content-type', 'application/pdf');

  doc.pipe(res);

  // Brand Header
  const settings = await PageSetting.findOne();
  const siteName = settings?.branding?.siteName || "Store";

  doc.fontSize(25).font('Helvetica-Bold').text(siteName.toUpperCase(), { align: 'right' });
  doc.fontSize(10).font('Helvetica').text("Official Order Receipt", { align: 'right' });
  doc.moveDown();

  // Horizontal line
  doc.moveTo(50, 115).lineTo(550, 115).stroke();
  doc.moveDown(2);

  // Order Details Header
  doc.fontSize(14).font('Helvetica-Bold').text(`Invoice: #${order._id.toString().slice(-8).toUpperCase()}`);
  doc.fontSize(10).font('Helvetica').text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
  doc.text(`Status: ${order.orderStatus.toUpperCase()}`);
  doc.moveDown();

  // Shipping Details
  doc.fontSize(12).font('Helvetica-Bold').text("Shipping Address:");
  doc.fontSize(10).font('Helvetica').text(order.shippingAddress.name);
  doc.text(order.shippingAddress.address);
  doc.text(`Phone: ${order.shippingAddress.phone}`);
  doc.moveDown(2);

  // Table Header
  const tableTop = 270;
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text("Item Name", 50, tableTop);
  doc.text("Size", 250, tableTop);
  doc.text("Qty", 350, tableTop);
  doc.text("Price", 450, tableTop);
  doc.text("Total", 500, tableTop, { align: 'right' });

  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  // Table Items
  let currentY = tableTop + 25;
  doc.font('Helvetica');

  order.orderItems.forEach(item => {
    doc.text(item.name, 50, currentY, { width: 190 });
    doc.text(item.size?.name || "Standard", 250, currentY);
    doc.text(item.quantity.toString(), 350, currentY);
    doc.text(`TK ${item.price.toLocaleString()}`, 450, currentY);
    doc.text(`TK ${(item.price * item.quantity).toLocaleString()}`, 500, currentY, { align: 'right' });
    currentY += 25;
  });

  doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
  currentY += 15;

  // Totals
  doc.text("Subtotal:", 400, currentY);
  doc.text(`TK ${order.itemsPrice.toLocaleString()}`, 500, currentY, { align: 'right' });
  currentY += 15;

  if (order.discountAmount > 0) {
    doc.fillColor('green').text("Discount:", 400, currentY);
    doc.text(`-TK ${order.discountAmount.toLocaleString()}`, 500, currentY, { align: 'right' });
    doc.fillColor('black');
    currentY += 15;
  }

  doc.text("Shipping:", 400, currentY);
  doc.text(`TK ${order.shippingPrice.toLocaleString()}`, 500, currentY, { align: 'right' });
  currentY += 20;

  doc.fontSize(14).font('Helvetica-Bold').text("Grand Total:", 350, currentY);
  doc.text(`TK ${order.totalPrice.toLocaleString()}`, 500, currentY, { align: 'right' });

  // Footer
  doc.fontSize(8).font('Helvetica-Oblique').text("Thank you for shopping with us.", 50, 700, { align: 'center', width: 500 });

  doc.end();
});
