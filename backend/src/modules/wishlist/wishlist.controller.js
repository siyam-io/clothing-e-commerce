import wishlistService from "./wishlist.service.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

/**
 * Controller managing customer product wishlists.
 */
export const getWishlist = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const result = await wishlistService.getWishlist(userId);
  res.json(result);
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const result = await wishlistService.addToWishlist(userId, req.body.productId);
  res.json(result);
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const result = await wishlistService.removeFromWishlist(userId, req.params.productId);
  res.json(result);
});

export const clearWishlist = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const result = await wishlistService.clearWishlist(userId);
  res.json(result);
});

export const bulkAddWishlist = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const result = await wishlistService.bulkAddWishlist(userId, req.body.productIds);
  res.json(result);
});

export default {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  bulkAddWishlist,
};
