import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { SubcategoryService } from "../subcategory.service.js";
import { ApiError } from "../../../utils/responseHandler.js";

describe("SubcategoryService", () => {
  let service;
  let mockSubcategoryModel;
  let mockCategoryModel;
  let mockUploadImageFn;
  let mockDeleteImageFn;
  let mockCacheClearer;

  beforeEach(() => {
    mockSubcategoryModel = {
      find: jest.fn(),
      findById: jest.fn(),
      countDocuments: jest.fn(),
      create: jest.fn(),
    };
    mockCategoryModel = {
      findById: jest.fn(),
    };
    mockUploadImageFn = jest.fn();
    mockDeleteImageFn = jest.fn();
    mockCacheClearer = jest.fn();

    service = new SubcategoryService({
      subcategoryModel: mockSubcategoryModel,
      categoryModel: mockCategoryModel,
      uploadImageFn: mockUploadImageFn,
      deleteImageFn: mockDeleteImageFn,
      cacheClearer: mockCacheClearer,
    });
  });

  describe("getSubcategories", () => {
    it("returns paginated subcategories list", async () => {
      const mockList = [{ _id: "sub_1", name: "Casual Shirts" }];
      mockSubcategoryModel.countDocuments.mockResolvedValue(1);
      mockSubcategoryModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockList),
              }),
            }),
          }),
        }),
      });

      const result = await service.getSubcategories();
      expect(result.subcategories).toEqual(mockList);
      expect(result.total).toBe(1);
    });

    it("isolates query errors and returns empty list", async () => {
      mockSubcategoryModel.countDocuments.mockRejectedValue(new Error("Database disconnected"));

      const result = await service.getSubcategories();
      expect(result.subcategories).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("createSubcategory", () => {
    it("throws 400 when parent category is not found", async () => {
      mockCategoryModel.findById.mockResolvedValue(null);

      await expect(
        service.createSubcategory({ name: "Denim", category: "c_none" })
      ).rejects.toThrow("Referenced parent category not found");
    });

    it("creates subcategory with generated slug and invalidates caches", async () => {
      mockCategoryModel.findById.mockResolvedValue({ _id: "c1" });
      const mockCreated = { _id: "sub_2", name: "Denim Jeans", slug: "denim-jeans" };
      mockSubcategoryModel.create.mockResolvedValue(mockCreated);

      const result = await service.createSubcategory({
        name: "Denim Jeans",
        category: "c1",
      });

      expect(result).toEqual(mockCreated);
      expect(mockSubcategoryModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Denim Jeans", slug: "denim-jeans" })
      );
      expect(mockCacheClearer).toHaveBeenCalledWith("cache:/api/categories*");
    });
  });

  describe("deleteSubcategory", () => {
    it("deletes subcategory document and clears caches even if asset cleanup fails", async () => {
      const mockSubDoc = {
        _id: "sub_3",
        image: "https://storage.example.com/sub.jpg",
        deleteOne: jest.fn().mockResolvedValue(true),
      };
      mockSubcategoryModel.findById.mockResolvedValue(mockSubDoc);
      mockDeleteImageFn.mockRejectedValue(new Error("Storage delete failed"));

      const result = await service.deleteSubcategory("sub_3");
      expect(mockSubDoc.deleteOne).toHaveBeenCalled();
      expect(result.message).toContain("removed successfully");
      expect(mockCacheClearer).toHaveBeenCalledWith("cache:/api/categories*");
    });
  });
});

