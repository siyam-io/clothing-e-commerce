import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ProductService } from "../product.service.js";
import { ApiError } from "../../../utils/responseHandler.js";

describe("ProductService", () => {
  let service;
  let mockProductModel;
  let mockCategoryModel;
  let mockSubcategoryModel;
  let mockUploadImagesFn;
  let mockDeleteImageFn;
  let mockCacheClearer;

  beforeEach(() => {
    mockProductModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      countDocuments: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };
    mockCategoryModel = {
      findOne: jest.fn(),
    };
    mockSubcategoryModel = {
      findOne: jest.fn(),
    };
    mockUploadImagesFn = jest.fn();
    mockDeleteImageFn = jest.fn();
    mockCacheClearer = jest.fn();

    service = new ProductService({
      productModel: mockProductModel,
      categoryModel: mockCategoryModel,
      subcategoryModel: mockSubcategoryModel,
      uploadImagesFn: mockUploadImagesFn,
      deleteImageFn: mockDeleteImageFn,
      cacheClearer: mockCacheClearer,
    });
  });

  describe("getPublicProducts", () => {
    it("returns paginated products list", async () => {
      const mockItems = [{ _id: "prod_1", name: "Linen Shirt", price: 1200 }];
      mockProductModel.countDocuments.mockResolvedValue(1);
      mockProductModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockItems),
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      const result = await service.getPublicProducts({ page: 1, limit: 10 });
      expect(result.total).toBe(1);
      expect(result.products).toEqual(mockItems);
    });

    it("isolates query errors and returns empty catalog fallback", async () => {
      mockProductModel.countDocuments.mockRejectedValue(new Error("Database offline"));

      const result = await service.getPublicProducts({});
      expect(result.products).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("getProductBySlug", () => {
    it("returns product when slug matches active product", async () => {
      const mockProduct = { _id: "prod_2", slug: "linen-shirt", name: "Linen Shirt" };
      mockProductModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockProduct),
            }),
          }),
        }),
      });

      const result = await service.getProductBySlug("linen-shirt");
      expect(result).toEqual(mockProduct);
    });

    it("throws 404 ApiError when product is missing", async () => {
      mockProductModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(null),
            }),
          }),
        }),
      });

      await expect(service.getProductBySlug("missing")).rejects.toThrow(ApiError);
    });
  });

  describe("createProduct", () => {
    it("creates product with generated slug and busts cache", async () => {
      const mockCreated = { _id: "prod_3", name: "Cotton Polo", slug: "cotton-polo" };
      mockProductModel.create.mockResolvedValue(mockCreated);

      const result = await service.createProduct({ name: "Cotton Polo", price: 800 });
      expect(result).toEqual(mockCreated);
      expect(mockCacheClearer).toHaveBeenCalledWith("cache:/api/products*");
    });
  });

  describe("updateStock", () => {
    it("updates stock for variation and clears cache", async () => {
      const updated = { _id: "prod_4", sizes: [{ size: "s_m", stock: 15 }] };
      mockProductModel.findOneAndUpdate.mockResolvedValue(updated);

      const result = await service.updateStock("prod_4", "s_m", 15);
      expect(result).toEqual(updated);
      expect(mockCacheClearer).toHaveBeenCalledWith("cache:/api/products*");
    });

    it("throws 404 ApiError when product or size is not found", async () => {
      mockProductModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(service.updateStock("p_none", "s_none", 10)).rejects.toThrow(ApiError);
    });
  });

  describe("deleteProduct", () => {
    it("deletes product and continues even if image asset removal fails", async () => {
      const mockProduct = {
        _id: "prod_5",
        images: ["https://storage.example.com/p5.jpg"],
        deleteOne: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(true),
          }),
        }),
      };
      mockProductModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockProduct),
          }),
        }),
      });
      mockDeleteImageFn.mockRejectedValue(new Error("Storage delete failed"));

      const result = await service.deleteProduct("prod_5");
      expect(mockProduct.deleteOne).toHaveBeenCalled();
      expect(result.message).toContain("purged successfully");
      expect(mockCacheClearer).toHaveBeenCalledWith("cache:/api/products*");
    });
  });
});

