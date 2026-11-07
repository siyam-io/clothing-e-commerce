import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { SizeService } from "../size.service.js";
import { ApiError } from "../../../utils/responseHandler.js";

describe("SizeService", () => {
  let service;
  let mockSizeModel;
  let mockCategoryModel;

  beforeEach(() => {
    mockSizeModel = {
      find: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      countDocuments: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };
    mockCategoryModel = {
      findById: jest.fn(),
    };

    service = new SizeService({
      sizeModel: mockSizeModel,
      categoryModel: mockCategoryModel,
    });
  });

  describe("getSizeOrder", () => {
    it("orders standard sizing labels correctly", () => {
      expect(service.getSizeOrder("S")).toBeLessThan(service.getSizeOrder("M"));
      expect(service.getSizeOrder("M")).toBeLessThan(service.getSizeOrder("L"));
      expect(service.getSizeOrder("L")).toBeLessThan(service.getSizeOrder("XL"));
    });
  });

  describe("getSizes", () => {
    it("sorts returned sizes by apparel sequence", async () => {
      const mockRawSizes = [
        { _id: "s1", name: "XL" },
        { _id: "s2", name: "S" },
        { _id: "s3", name: "M" },
      ];

      mockSizeModel.countDocuments.mockResolvedValue(3);
      mockSizeModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockRawSizes),
            }),
          }),
        }),
      });

      const result = await service.getSizes();
      // Should be naturally ordered: S, M, XL
      expect(result.sizes[0].name).toBe("S");
      expect(result.sizes[1].name).toBe("M");
      expect(result.sizes[2].name).toBe("XL");
    });

    it("isolates query errors and returns empty list", async () => {
      mockSizeModel.countDocuments.mockRejectedValue(new Error("Database disconnected"));

      const result = await service.getSizes();
      expect(result.sizes).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("createSize", () => {
    it("throws 400 when category does not exist", async () => {
      mockCategoryModel.findById.mockResolvedValue(null);

      await expect(
        service.createSize({ name: "M", category: "c_none" })
      ).rejects.toThrow("Referenced category not found");
    });

    it("creates size in uppercase", async () => {
      mockCategoryModel.findById.mockResolvedValue({ _id: "c1" });
      const mockCreated = { _id: "s4", name: "XXL", category: "c1" };
      mockSizeModel.create.mockResolvedValue(mockCreated);

      const result = await service.createSize({ name: "xxl", category: "c1" });
      expect(result.name).toBe("XXL");
      expect(mockSizeModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: "XXL", category: "c1" })
      );
    });
  });

  describe("deleteSize", () => {
    it("calls deleteOne on document to trigger cascade hooks", async () => {
      const mockSizeDoc = {
        _id: "s5",
        deleteOne: jest.fn().mockResolvedValue(true),
      };
      mockSizeModel.findById.mockResolvedValue(mockSizeDoc);

      const result = await service.deleteSize("s5");
      expect(mockSizeDoc.deleteOne).toHaveBeenCalled();
      expect(result.message).toContain("removed successfully");
    });
  });
});

