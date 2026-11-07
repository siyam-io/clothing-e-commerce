import reviewService from "./review.service.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

const extractUserId = (req) => req.user?.id || req.user?._id;
const isUserAdmin = (req) => req.user?.role === "admin" || req.user?.role?.name === "superadmin";

export const createReview = asyncHandler(async (req, res) => {
  const result = await reviewService.createReview({
    ...req.body,
    userId: extractUserId(req),
    files: req.files || [],
  });
  res.status(201).json(result);
});

export const updateReview = asyncHandler(async (req, res) => {
  const result = await reviewService.updateReview(
    req.params.reviewId,
    extractUserId(req),
    isUserAdmin(req),
    {
      ...req.body,
      files: req.files || [],
    }
  );
  res.json(result);
});

export const deleteReview = asyncHandler(async (req, res) => {
  const result = await reviewService.deleteReview(
    req.params.reviewId,
    extractUserId(req),
    isUserAdmin(req)
  );
  res.json(result);
});

export const getProductReviews = asyncHandler(async (req, res) => {
  const currentUserId = req.user ? extractUserId(req) : null;
  const result = await reviewService.getProductReviews(
    req.params.productId,
    currentUserId,
    req.query
  );
  res.json(result);
});
