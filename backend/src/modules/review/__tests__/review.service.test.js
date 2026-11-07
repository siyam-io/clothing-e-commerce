import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ReviewService } from "../review.service.js";
import { ApiError } from "../../../utils/responseHandler.js";

describe("ReviewService", () => {
  let service;
  let mockReviewModel;
  let mockProductModel;
  let mockUserModel;
  let mockUploadImagesFn;
  let mockDeleteImageFn;

  beforeEach(() => {
    mockReviewModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      countDocuments: jest.fn(),
      find: jest.fn(),
      aggregate: jest.fn(),
    };
    mockProductModel = {
      findById: jest.fn(),
    };
    mockUserModel = {
      find: jest.fn(),
    };
    mockUploadImagesFn = jest.fn();
    mockDeleteImageFn = jest.fn();

    service = new ReviewService({
      reviewModel: mockReviewModel,
      productModel: mockProductModel,
      userModel: mockUserModel,
      uploadImagesFn: mockUploadImagesFn,
      deleteImageFn: mockDeleteImageFn,
    });
  });

  describe("createReview", () => {
    it("throws 400 when product ID or rating is missing", async () => {
      await expect(
        service.createReview({ productId: null, userId: "u1", rating: 5 })
      ).rejects.toThrow(ApiError);
    });

    it("throws 400 when user has already reviewed the product", async () => {
      mockReviewModel.findOne.mockResolvedValue({ _id: "r1" });

      await expect(
        service.createReview({ productId: "p1", userId: "u1", rating: 4, comment: "Nice" })
      ).rejects.toThrow("You have already reviewed this product");
    });

    it("creates review and updates product rating", async () => {
      mockReviewModel.findOne.mockResolvedValue(null);
      const mockCreated = {
        _id: "r2",
        product: "p1",
        user: "u1",
        rating: 5,
        comment: "Great quality",
        toObject: () => ({ _id: "r2", product: "p1", user: "u1", rating: 5 }),
      };
      mockReviewModel.create.mockResolvedValue(mockCreated);
      mockProductModel.findById.mockResolvedValue({
        _id: "p1",
        save: jest.fn().mockResolvedValue(true),
      });
      mockReviewModel.aggregate.mockResolvedValue([{ averageRating: 5, totalReviews: 1 }]);
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([{ _id: "u1", name: "User One" }]),
        }),
      });

      const result = await service.createReview({
        productId: "p1",
        userId: "u1",
        rating: 5,
        comment: "Great quality",
      });

      expect(result.rating).toBe(5);
      expect(result.user.name).toBe("User One");
      expect(mockReviewModel.create).toHaveBeenCalled();
    });
  });

  describe("deleteReview", () => {
    it("throws 403 when non-admin tries to delete another user's review", async () => {
      mockReviewModel.findById.mockResolvedValue({
        _id: "r3",
        user: "owner_1",
      });

      await expect(service.deleteReview("r3", "other_user", false)).rejects.toThrow(
        "Not authorized to remove this review"
      );
    });

    it("deletes review and recalculates rating even if image cleanup fails", async () => {
      const mockReviewDoc = {
        _id: "r4",
        user: "u2",
        product: "p2",
        images: [{ url: "https://storage.example.com/rev.jpg" }],
        deleteOne: jest.fn().mockResolvedValue(true),
      };
      mockReviewModel.findById.mockResolvedValue(mockReviewDoc);
      mockDeleteImageFn.mockRejectedValue(new Error("Storage unavailable"));
      mockProductModel.findById.mockResolvedValue({
        _id: "p2",
        save: jest.fn().mockResolvedValue(true),
      });
      mockReviewModel.aggregate.mockResolvedValue([]);

      const result = await service.deleteReview("r4", "u2", false);
      expect(mockReviewDoc.deleteOne).toHaveBeenCalled();
      expect(result.message).toContain("removed successfully");
    });
  });

  describe("getProductReviews", () => {
    it("isolates query errors and returns safe fallback payload", async () => {
      mockReviewModel.countDocuments.mockRejectedValue(new Error("Database error"));

      const result = await service.getProductReviews("p1", null);
      expect(result.reviews).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.averageRating).toBe(0);
    });
  });
});

