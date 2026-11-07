import cartService from "./cart.service.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { ApiError } from "../../utils/responseHandler.js";

/**
 * Extract authenticated user ID from request context.
 */
const extractUserId = (req) => {
  const userId = req.user?.id || req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Authentication required");
  }
  return userId;
};

export const getCart = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const result = await cartService.getCart(userId);
  res.json(result);
});

export const addToCart = asyncHandler(async (req, res) => {
  const userId = extractUserId(req);
  const result = await cartService.addToCart(userId, req.body);
  res.json(result);
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const userId = extractUserId(req);
  const result = await cartService.updateCartItem(userId, req.body);
  res.json(result);
});

export const removeFromCart = asyncHandler(async (req, res) => {
  const userId = extractUserId(req);
  const result = await cartService.removeFromCart(userId, req.params);
  res.json(result);
});

export const changeSize = asyncHandler(async (req, res) => {
  const userId = extractUserId(req);
  const result = await cartService.changeSize(userId, req.body);
  res.json(result);
});

export const clearCart = asyncHandler(async (req, res) => {
  const userId = extractUserId(req);
  const result = await cartService.clearCart(userId);
  res.json(result);
});

export const bulkAddCart = asyncHandler(async (req, res) => {
  const userId = extractUserId(req);
  const result = await cartService.bulkAddCart(userId, req.body?.items);
  res.status(200).json(result);
});
