import reviewService from "./review.service.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import auditLogService from "../auditLog/auditLog.service.js";

const extractUserId = (req) => req.user?.id || req.user?._id;
const isUserAdmin = (req) => req.user?.role === "admin" || req.user?.role?.name === "superadmin";

export const createReview = asyncHandler(async (req, res) => {
  const result = await reviewService.createReview({
    ...req.body,
    userId: extractUserId(req),
    files: req.files || [],
  });

  auditLogService.recordLog({
    req,
    action: "CREATE",
    module: "Review",
    resourceId: result?._id || req.body?.productId,
    description: `User ${req.user?.name || "Customer"} submitted a ${req.body?.rating || 5}-star review for product`,
    details: {
      rating: req.body?.rating,
      comment: req.body?.comment?.slice(0, 100),
      productId: req.body?.productId,
    },
    status: "SUCCESS",
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

  auditLogService.recordLog({
    req,
    action: "UPDATE",
    module: "Review",
    resourceId: req.params.reviewId,
    description: `Updated review #${req.params.reviewId}`,
    status: "SUCCESS",
  });

  res.json(result);
});

export const deleteReview = asyncHandler(async (req, res) => {
  const result = await reviewService.deleteReview(
    req.params.reviewId,
    extractUserId(req),
    isUserAdmin(req)
  );

  auditLogService.recordLog({
    req,
    action: "DELETE",
    module: "Review",
    resourceId: req.params.reviewId,
    description: `Deleted review #${req.params.reviewId}`,
    status: "SUCCESS",
  });

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
