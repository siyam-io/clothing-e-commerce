import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { CategoryService } from "../category.service.js";
import { ApiError } from "../../../utils/responseHandler.js";

describe("CategoryService", () => {
  let service;
  let mockCategoryModel;
  let mockUploadImageFn;
  let mockDeleteImageFn;
  let mockCacheClearer;

  beforeEach(() => {
    mockCategoryModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      countDocuments: jest.fn(),
      create: jest.fn(),
    };
    mockUploadImageFn = jest.fn();
    mockDeleteImageFn = jest.fn();
    mockCacheClearer = jest.fn();

    service = new CategoryService({
      categoryModel: mockCategoryModel,
      uploadImageFn: mockUploadImageFn,
      deleteImageFn: mockDeleteImageFn,
      cacheClearer: mockCacheClearer,
    });
  });

  describe("getPublicCategories", () => {
    it("returns virtual On Sale entry prepended to categories", async () => {
      const mockDbCategories = [{ _id: "c1", name: "Men", slug: "men" }];
      mockCategoryModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockDbCategories),
          }),
        }),
      });

      const result = await service.getPublicCategories();

      expect(result.length).toBe(2);
      expect(result[0].slug).toBe("on-sale");
      expect(result[1].name).toBe("Men");
    });

    it("isolates query failure and returns virtual fallback without throwing", async () => {
      mockCategoryModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockRejectedValue(new Error("Database disconnected")),
          }),
        }),
      });

      const result = await service.getPublicCategories();

      expect(result.length).toBe(1);
      expect(result[0].slug).toBe("on-sale");
    });
  });

  describe("getPublicCategoryBySlug", () => {
    it("returns category matching slug", async () => {
      const mockCategory = { _id: "c2", name: "Women", slug: "women" };
      mockCategoryModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockCategory),
        }),
      });

      const result = await service.getPublicCategoryBySlug("women");
      expect(result).toEqual(mockCategory);
    });

    it("throws 404 ApiError when category is not found", async () => {
      mockCategoryModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.getPublicCategoryBySlug("unknown")).rejects.toThrow(ApiError);
    });
  });

  describe("createCategory", () => {
    it("creates category record and clears caches", async () => {
      const mockCreated = { _id: "c3", name: "Kids", slug: "kids" };
      mockCategoryModel.create.mockResolvedValue(mockCreated);

      const result = await service.createCategory({
        name: "Kids",
        slug: "kids",
        description: "Apparel for kids",
      });

      expect(result).toEqual(mockCreated);
      expect(mockCacheClearer).toHaveBeenCalledWith("cache:/api/categories*");
    });

    it("creates category even if image upload encounters an error", async () => {
      mockUploadImageFn.mockRejectedValue(new Error("Storage timeout"));
      const mockCreated = { _id: "c4", name: "Accessories", slug: "accessories", image: null };
      mockCategoryModel.create.mockResolvedValue(mockCreated);

      const result = await service.createCategory({
        name: "Accessories",
        slug: "accessories",
        file: { filename: "acc.png" },
      });

      expect(result).toEqual(mockCreated);
      expect(mockCategoryModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Accessories", image: null })
      );
    });
  });

  describe("deleteCategory", () => {
    it("deletes document even if image asset removal fails", async () => {
      const mockCategoryDoc = {
        _id: "c5",
        image: "https://storage.example.com/cat.jpg",
        deleteOne: jest.fn().mockResolvedValue(true),
      };
      mockCategoryModel.findById.mockResolvedValue(mockCategoryDoc);
      mockDeleteImageFn.mockRejectedValue(new Error("Storage deletion failed"));

      const result = await service.deleteCategory("c5");

      expect(mockCategoryDoc.deleteOne).toHaveBeenCalled();
      expect(mockCacheClearer).toHaveBeenCalledWith("cache:/api/categories*");
      expect(result.message).toContain("purged successfully");
    });
  });
});

