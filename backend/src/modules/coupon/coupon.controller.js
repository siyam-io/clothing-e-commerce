import couponService from "./coupon.service.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

export const validateCoupon = asyncHandler(async (req, res) => {
  const result = await couponService.validateCoupon(req.body);
  res.json(result);
});

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.createCoupon(req.body);
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
  res.json(coupon);
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const result = await couponService.deleteCoupon(req.params.id);
  res.json(result);
});
