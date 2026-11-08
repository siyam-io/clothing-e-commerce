import Product from "../product/product.model.js";
import Coupon from "../coupon/coupon.model.js";
import Cart from "../cart/cart.model.js";
import PageSetting from "../settings/settings.model.js";
import { queueOrderConfirmationEmail } from "../../queues/index.js";
import logger from "../../utils/logger.js";

/**
 * Fetch and index product documents by stringified primary key.
 *
 * @param {Array<Object>} orderItems - Requested order items.
 * @returns {Promise<Record<string, Object>>}
 */
export const fetchProductMap = async (orderItems) => {
  const productIds = orderItems.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds } });
  return products.reduce((acc, product) => {
    acc[product._id.toString()] = product;
    return acc;
  }, {});
};

/**
 * Validate item availability, size selection, and stock levels.
 *
 * @param {Object} item - Requested line item.
 * @param {Object} product - Database product record.
 * @returns {Object} Validated order item.
 */
export const validateOrderItem = (item, product) => {
  if (!product || !product.isActive) {
    throw new Error(`Product unavailable or inactive: ${item.product}`);
  }

  const requestedSizeId = item.size?._id || item.size;

  if (product.sizes?.length > 0) {
    if (!requestedSizeId) {
      throw new Error(`Size selection required for ${product.name}`);
    }

    const sizeRecord = product.sizes.find(
      (entry) => entry.size.toString() === requestedSizeId.toString()
    );

    if (!sizeRecord || sizeRecord.stock < item.quantity) {
      throw new Error(`Insufficient inventory for ${product.name}`);
    }
  }

  const unitPrice =
    product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price;

  return {
    product: product._id,
    name: product.name,
    size: requestedSizeId,
    quantity: item.quantity,
    price: Number(unitPrice.toFixed(2)),
    image: product.images?.[0] || "",
  };
};

/**
 * Resolve shipping charge based on configured zone rates or custom courier selection.
 *
 * @param {Object} settings - Store settings document.
 * @param {string} [deliveryZone] - Selected delivery zone or courier identifier.
 * @param {number|string} [fallbackPrice] - Fallback shipping charge.
 * @returns {number} Shipping fee.
 */
export const resolveShippingPrice = (settings, deliveryZone, fallbackPrice) => {
  if (deliveryZone === "pos" || deliveryZone === "instore" || deliveryZone === "in_store" || deliveryZone === "none") {
    return 0;
  }

  const defaultInside = settings?.shipping?.insideDhaka || 60;
  const defaultOutside = settings?.shipping?.outsideDhaka || 120;

  const customCourier = settings?.shipping?.couriers?.find(
    (c) => c.isActive && (c._id?.toString() === deliveryZone || c.name === deliveryZone)
  );

  if (customCourier) return customCourier.charge;
  if (deliveryZone === "dhaka") return defaultInside;
  if (deliveryZone) return defaultOutside;
  if (fallbackPrice !== undefined && fallbackPrice !== null && !isNaN(Number(fallbackPrice))) {
    return Number(fallbackPrice);
  }
  return defaultInside;
};

/**
 * Calculate applicable discount from active coupon code.
 *
 * @param {string} couponCode - Coupon identifier.
 * @param {number} itemsPrice - Order items subtotal.
 * @returns {Promise<{ discountAmount: number, finalCoupon: string|null }>}
 */
export const resolveCouponDiscount = async (couponCode, itemsPrice) => {
  if (!couponCode) return { discountAmount: 0, finalCoupon: null };

  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
  const now = new Date();

  if (
    coupon &&
    coupon.startDate <= now &&
    (!coupon.endDate || coupon.endDate >= now) &&
    itemsPrice >= coupon.minOrderAmount
  ) {
    const rawDiscount =
      coupon.discountType === "percentage"
        ? (itemsPrice * coupon.discountValue) / 100
        : coupon.discountValue;

    const discountAmount = Math.min(rawDiscount, coupon.maxDiscount || Infinity);
    return { discountAmount, finalCoupon: coupon.code };
  }

  return { discountAmount: 0, finalCoupon: null };
};

/**
 * Validate order items, verify stock availability, and compute pricing breakdown.
 */
export const calculateValidatedOrder = async (
  orderItems,
  couponCode,
  shippingPrice,
  deliveryZone,
  preloadedSettings = null,
  manualDiscount = 0
) => {
  const settings = preloadedSettings || (await PageSetting.findOne());
  const productMap = await fetchProductMap(orderItems);

  let itemsPrice = 0;
  const validatedItems = orderItems.map((item) => {
    const product = productMap[item.product.toString()];
    const validated = validateOrderItem(item, product);
    itemsPrice += validated.price * validated.quantity;
    return validated;
  });

  const finalShippingPrice = resolveShippingPrice(settings, deliveryZone, shippingPrice);
  const { discountAmount, finalCoupon } = await resolveCouponDiscount(couponCode, itemsPrice);
  const totalDiscount = Math.min(itemsPrice, Number(((discountAmount || 0) + (Number(manualDiscount) || 0)).toFixed(2)));

  return {
    itemsPrice: Number(itemsPrice.toFixed(2)),
    discountAmount: totalDiscount,
    shippingPrice: finalShippingPrice,
    totalPrice: Math.max(0, Number((itemsPrice - totalDiscount + finalShippingPrice).toFixed(2))),
    validatedItems,
    couponCode: finalCoupon,
  };
};

/**
 * Format shipping address attributes into standard payload.
 */
export const normalizeShippingAddress = (addr) => ({
  name: addr.name,
  email: addr.email,
  phone: addr.phone,
  address: addr.address || [addr.street, addr.city].filter(Boolean).join(", "),
});

/**
 * Decrement inventory stock, update coupon usage, and dispatch confirmation email.
 */
export const finalizeOrderProcessing = async (order, session = null) => {
  const bulkOps = order.orderItems.map((item) => ({
    updateOne: {
      filter: {
        _id: item.product,
        "sizes.size": item.size,
        "sizes.stock": { $gte: item.quantity },
      },
      update: { $inc: { "sizes.$.stock": -item.quantity } },
    },
  }));

  // Deterministically sort operations by Product ID and Size to eliminate multi-document deadlocks
  bulkOps.sort((a, b) => {
    const idA = String(a.updateOne.filter._id);
    const idB = String(b.updateOne.filter._id);
    if (idA !== idB) return idA.localeCompare(idB);
    return String(a.updateOne.filter["sizes.size"]).localeCompare(String(b.updateOne.filter["sizes.size"]));
  });

  if (bulkOps.length > 0) {
    const result = await Product.bulkWrite(bulkOps, { session });
    if (result.matchedCount < bulkOps.length) {
      logger.error("Stock allocation concurrency conflict detected during order finalization", {
        orderId: order._id,
      });
      throw new Error("One or more items in your order are out of stock. Order cancelled.");
    }
  }

  if (order.couponCode) {
    const updatedCoupon = await Coupon.findOneAndUpdate(
      {
        code: order.couponCode.toUpperCase(),
        $or: [
          { usageLimit: null },
          { usageLimit: 0 },
          { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
        ],
      },
      { $inc: { usedCount: 1 } },
      { session, new: true }
    );
    if (!updatedCoupon) {
      logger.warn(`Coupon ${order.couponCode} exceeded usage limit or was exhausted concurrently`);
    }
  }

  if (!order.isDirectBuy && order.user) {
    await Cart.findOneAndUpdate(
      { user: order.user },
      { $set: { items: [] } },
      { session }
    );
  }

  // Asynchronously dispatch confirmation email outside of the active database lock
  if (order?.shippingAddress?.email) {
    setImmediate(async () => {
      try {
        await queueOrderConfirmationEmail(order);
      } catch (error) {
        logger.error("Failed to queue order confirmation email:", { error: error.message });
      }
    });
  }
};
