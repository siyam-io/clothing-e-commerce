import couponService from "./coupon.service.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import auditLogService from "../auditLog/auditLog.service.js";

export const validateCoupon = asyncHandler(async (req, res) => {
  const result = await couponService.validateCoupon(req.body);
  res.json(result);
});

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.createCoupon(req.body);
  auditLogService.recordLog({
    req,
    action: "CREATE",
    module: "Coupon",
    resourceId: coupon._id,
    resourceName: coupon.code,
    description: `Created new promotion coupon: ${coupon.code}`,
    details: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountAmount: coupon.discountAmount,
    },
    status: "SUCCESS",
  });
  res.status(201).json(coupon);
});

export const getCoupons = asyncHandler(async (req, res) => {
  const result = await couponService.getCoupons(req.query);
  res.json(result);
});

export const getCouponById = asyncHandler(async (req, res) => {
  const result = await couponService.getCouponById(req.params.id, req.query);
  res.json(result);
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.updateCoupon(req.params.id, req.body);
  auditLogService.recordLog({
    req,
    action: "UPDATE",
    module: "Coupon",
    resourceId: coupon?._id || req.params.id,
    resourceName: coupon?.code,
    description: `Updated promotion coupon: ${coupon?.code || req.params.id}`,
    details: req.body,
    status: "SUCCESS",
  });
  res.json(coupon);
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const result = await couponService.deleteCoupon(req.params.id);
  auditLogService.recordLog({
    req,
    action: "DELETE",
    module: "Coupon",
    resourceId: req.params.id,
    description: `Deleted promotion coupon #${req.params.id}`,
    status: "SUCCESS",
  });
  res.json(result);
});
