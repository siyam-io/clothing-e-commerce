import Coupon from "./coupon.model.js";
import Order from "../order/order.model.js";
import { clearCache } from "../../middleware/cacheMiddleware.js";
import { ApiError } from "../../utils/responseHandler.js";
import logger from "../../utils/logger.js";

/**
 * Service managing promotional coupon codes, cart deductions, and usage history.
 */
export class CouponService {
  /**
   * @param {Object} [dependencies]
   * @param {typeof Coupon} [dependencies.couponModel]
   * @param {typeof Order} [dependencies.orderModel]
   * @param {Function} [dependencies.cacheClearer]
   */
  constructor(dependencies = {}) {
    this.couponModel = dependencies.couponModel || Coupon;
    this.orderModel = dependencies.orderModel || Order;
    this.cacheClearer = dependencies.cacheClearer || clearCache;
  }

  /**
   * Safe eviction of dashboard analytical caches.
   */
  bustDashboardCache() {
    try {
      this.cacheClearer("cache:/api/admin/dashboard*");
    } catch (error) {
      logger.warn("Cache eviction skipped in CouponService:", { error: error.message });
    }
  }

  /**
   * Pure calculation of discount amount based on coupon type and cart total.
   */
  calculateDiscount(coupon, cartTotal) {
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = (cartTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }
    return Number(Math.min(discountAmount, cartTotal).toFixed(2));
  }

  /**
   * Validate coupon code eligibility against cart contents and date bounds.
   */
  async validateCoupon({ code, cartTotal }) {
    if (!code || typeof code !== "string") {
      throw new ApiError(400, "Coupon code is required");
    }

    const sanitizedCode = code.trim().toUpperCase();
    const coupon = await this.couponModel.findOne({ code: sanitizedCode, isActive: true });

    if (!coupon) {
      throw new ApiError(404, "Invalid coupon code");
    }

    const now = new Date();
    if (coupon.startDate && coupon.startDate > now) {
      throw new ApiError(400, "Coupon is not yet active");
    }
    if (coupon.endDate && coupon.endDate < now) {
      throw new ApiError(400, "Coupon has expired");
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new ApiError(400, "Coupon usage limit reached");
    }
    if (cartTotal < (coupon.minOrderAmount || 0)) {
      throw new ApiError(400, `Minimum order amount of ${coupon.minOrderAmount} required`);
    }

    const discountAmount = this.calculateDiscount(coupon, cartTotal);

    return {
      valid: true,
      discountAmount,
      coupon,
    };
  }

  /**
   * Create a new coupon rule.
   */
  async createCoupon(data) {
    const coupon = await this.couponModel.create({
      ...data,
      code: (data.code || "").trim().toUpperCase(),
    });
    this.bustDashboardCache();
    return coupon;
  }

  /**
   * Paginated listing of coupons for administration.
   */
  async getCoupons({ page = 1, limit = 30, search = "" }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 30);

    const filter = {};
    if (search && search.trim()) {
      filter.code = { $regex: search.trim(), $options: "i" };
    }

    const total = await this.couponModel.countDocuments(filter);
    const coupons = await this.couponModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return {
      coupons,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Retrieve coupon details along with historical usage and order attribution.
   */
  async getCouponById(id, { page = 1, limit = 10 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);

    const coupon = await this.couponModel.findById(id);
    if (!coupon) {
      throw new ApiError(404, "Coupon not found");
    }

    const filter = { couponCode: coupon.code };
    const total = await this.orderModel.countDocuments(filter);

    const usageHistory = await this.orderModel
      .find(filter)
      .populate("user", "name email avatar")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const uniqueProducts = await this.orderModel.distinct("orderItems.product", filter);

    return {
      ...coupon.toObject(),
      usageHistory,
      uniqueProductsCount: uniqueProducts.length,
      usagePagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    };
  }

  /**
   * Update an existing coupon.
   */
  async updateCoupon(id, updateData) {
    const coupon = await this.couponModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!coupon) {
      throw new ApiError(404, "Coupon not found");
    }
    this.bustDashboardCache();
    return coupon;
  }

  /**
   * Delete a coupon record.
   */
  async deleteCoupon(id) {
    const coupon = await this.couponModel.findByIdAndDelete(id);
    if (!coupon) {
      throw new ApiError(404, "Coupon not found");
    }
    this.bustDashboardCache();
    return { message: "Coupon deleted successfully" };
  }
}

export default new CouponService();

