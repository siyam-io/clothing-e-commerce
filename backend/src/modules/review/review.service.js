import mongoose from "mongoose";
import Review from "./review.model.js";
import Product from "../product/product.model.js";
import User from "../user/user.model.js";
import { uploadMultipleImages, deleteImage } from "../../services/imageUploadService.js";
import { ApiError } from "../../utils/responseHandler.js";
import logger from "../../utils/logger.js";

/**
 * Service managing customer feedback, ratings recalculation, and review assets with fault isolation.
 */
export class ReviewService {
  /**
   * @param {Object} [dependencies]
   * @param {typeof Review} [dependencies.reviewModel]
   * @param {typeof Product} [dependencies.productModel]
   * @param {typeof User} [dependencies.userModel]
   * @param {Function} [dependencies.uploadImagesFn]
   * @param {Function} [dependencies.deleteImageFn]
   */
  constructor(dependencies = {}) {
    this.reviewModel = dependencies.reviewModel || Review;
    this.productModel = dependencies.productModel || Product;
    this.userModel = dependencies.userModel || User;
    this.uploadImagesFn = dependencies.uploadImagesFn || uploadMultipleImages;
    this.deleteImageFn = dependencies.deleteImageFn || deleteImage;
  }

  /**
   * Recalculate average rating and total reviews on parent product.
   * Isolates failures so feedback submission is not rolled back if counter fails.
   */
  async updateProductRating(productId) {
    try {
      const product = await this.productModel.findById(productId);
      if (!product) return;

      const stats = await this.reviewModel.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(productId) } },
        {
          $group: {
            _id: "$product",
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
      ]);

      if (stats.length > 0) {
        product.averageRating = Number((Math.round(stats[0].averageRating * 10) / 10).toFixed(1));
        product.totalReviews = stats[0].totalReviews;
      } else {
        product.averageRating = 0;
        product.totalReviews = 0;
      }

      await product.save();
    } catch (error) {
      logger.warn("Failed to recalculate product rating, continuing:", {
        productId,
        error: error.message,
      });
    }
  }

  /**
   * Helper to map user profile metadata onto review payload.
   */
  async attachUserProfiles(reviews = []) {
    if (!reviews.length) return [];

    const userIds = [...new Set(reviews.map((r) => r.user))];
    const objectIds = userIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    let users = [];
    try {
      users = await this.userModel
        .find({
          $or: [{ id: { $in: userIds } }, { _id: { $in: objectIds } }],
        })
        .select("name avatar id")
        .lean();
    } catch (error) {
      logger.warn("Failed to fetch user profiles for reviews:", { error: error.message });
    }

    const userMap = users.reduce((acc, u) => {
      const strId = u._id.toString();
      acc[strId] = { _id: strId, name: u.name, avatar: u.avatar || "" };
      if (u.id) acc[u.id] = acc[strId];
      return acc;
    }, {});

    return reviews.map((r) => ({
      ...r,
      user: userMap[r.user] || { _id: r.user, name: "Verified Customer", avatar: "" },
    }));
  }

  /**
   * Submit a new verified review.
   */
  async createReview({ productId, userId, rating, comment, files = [] }) {
    if (!productId || !rating) {
      throw new ApiError(400, "Product ID and rating are required");
    }

    const numericRating = parseInt(rating, 10);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      throw new ApiError(400, "Rating must be an integer between 1 and 5");
    }

    const existing = await this.reviewModel.findOne({ product: productId, user: userId });
    if (existing) {
      throw new ApiError(400, "You have already reviewed this product");
    }

    let imageUrls = [];
    if (files.length > 0) {
      try {
        imageUrls = await this.uploadImagesFn(files, "reviews");
      } catch (error) {
        logger.error("Review image upload failed:", { error: error.message });
      }
    }

    const review = await this.reviewModel.create({
      product: productId,
      user: userId,
      rating: numericRating,
      comment: comment || "",
      images: imageUrls.map((url) => ({ url })),
    });

    await this.updateProductRating(productId);
    const [enrichedReview] = await this.attachUserProfiles([review.toObject()]);
    return enrichedReview;
  }

  /**
   * Update existing review submission.
   */
  async updateReview(reviewId, userId, isAdmin, { rating, comment, removeImages, files = [] }) {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    if (!isAdmin && review.user.toString() !== userId.toString()) {
      throw new ApiError(403, "Not authorized to modify this review");
    }

    if (removeImages && removeImages !== "undefined") {
      let urlsToRemove = [];
      try {
        urlsToRemove = typeof removeImages === "string" ? JSON.parse(removeImages) : removeImages;
      } catch (e) {
        urlsToRemove = [];
      }

      for (const url of urlsToRemove) {
        try {
          await this.deleteImageFn(url);
        } catch (err) {
          logger.warn("Review image cleanup failed, continuing:", { url, error: err.message });
        }
      }
      review.images = review.images.filter((img) => !urlsToRemove.includes(img.url));
    }

    if (files.length > 0) {
      try {
        const newUrls = await this.uploadImagesFn(files, "reviews");
        newUrls.forEach((url) => review.images.push({ url }));
      } catch (err) {
        logger.error("New review image upload failed:", { error: err.message });
      }
    }

    if (rating) {
      const numRating = parseInt(rating, 10);
      if (numRating >= 1 && numRating <= 5) review.rating = numRating;
    }
    if (comment !== undefined) review.comment = comment;
    review.isEdited = true;
    review.editedAt = new Date();

    await review.save();
    await this.updateProductRating(review.product);

    const [enriched] = await this.attachUserProfiles([review.toObject()]);
    return enriched;
  }

  /**
   * Remove a review and purge attached assets.
   */
  async deleteReview(reviewId, userId, isAdmin) {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    if (!isAdmin && review.user.toString() !== userId.toString()) {
      throw new ApiError(403, "Not authorized to remove this review");
    }

    for (const img of review.images || []) {
      if (img.url) {
        try {
          await this.deleteImageFn(img.url);
        } catch (err) {
          logger.warn("Image deletion failed on review removal, continuing:", { error: err.message });
        }
      }
    }

    const productId = review.product;
    await review.deleteOne();
    await this.updateProductRating(productId);

    return { message: "Review removed successfully" };
  }

  /**
   * Retrieve paginated reviews for product display.
   */
  async getProductReviews(productId, currentUserId = null, { page = 1, limit = 5 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 5);
    const skip = (pageNum - 1) * limitNum;

    try {
      const total = await this.reviewModel.countDocuments({ product: productId });
      const rawReviews = await this.reviewModel
        .find({ product: productId })
        .sort("-createdAt")
        .skip(skip)
        .limit(limitNum)
        .lean();

      const enrichedReviews = await this.attachUserProfiles(rawReviews);

      let userReview = null;
      if (currentUserId) {
        const found = await this.reviewModel
          .findOne({ product: productId, user: currentUserId.toString() })
          .lean();
        if (found) {
          const [enrichedUserReview] = await this.attachUserProfiles([found]);
          userReview = enrichedUserReview;
        }
      }

      const product = await this.productModel
        .findById(productId)
        .select("averageRating totalReviews")
        .lean();

      return {
        reviews: enrichedReviews,
        userReview,
        total,
        pages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        averageRating: product?.averageRating || 0,
        totalReviews: product?.totalReviews || 0,
      };
    } catch (error) {
      logger.error("Failed to query product reviews, returning fallback:", { error: error.message });
      return {
        reviews: [],
        userReview: null,
        total: 0,
        pages: 0,
        currentPage: pageNum,
        averageRating: 0,
        totalReviews: 0,
      };
    }
  }
}

export default new ReviewService();

