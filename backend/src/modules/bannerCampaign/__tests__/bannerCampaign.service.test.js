import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { BannerCampaignService } from "../bannerCampaign.service.js";

describe("BannerCampaignService", () => {
  let service;
  let mockBannerModel;
  let mockUploadImages;
  let mockDeleteImageFn;
  let mockCacheClearer;

  beforeEach(() => {
    mockBannerModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      countDocuments: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
    };
    mockUploadImages = jest.fn();
    mockDeleteImageFn = jest.fn();
    mockCacheClearer = jest.fn();

    service = new BannerCampaignService({
      bannerModel: mockBannerModel,
      uploadImages: mockUploadImages,
      deleteImageFn: mockDeleteImageFn,
      cacheClearer: mockCacheClearer,
    });
  });

  describe("parseSlides", () => {
    it("returns empty array when input is falsy", () => {
      expect(service.parseSlides(null)).toEqual([]);
      expect(service.parseSlides("")).toEqual([]);
    });

    it("returns original array when input is array", () => {
      const slides = [{ title: "Spring Sale" }];
      expect(service.parseSlides(slides)).toEqual(slides);
    });

    it("wraps single object in array", () => {
      const slide = { title: "Summer Deals" };
      expect(service.parseSlides(slide)).toEqual([slide]);
    });

    it("parses valid JSON string", () => {
      const json = JSON.stringify([{ title: "Winter Collection" }]);
      expect(service.parseSlides(json)).toEqual([{ title: "Winter Collection" }]);
    });

    it("returns empty array on malformed JSON without throwing", () => {
      expect(service.parseSlides("{ invalid json")).toEqual([]);
    });
  });

  describe("getActiveCampaign", () => {
    it("returns active campaign document when found", async () => {
      const mockResult = { _id: "camp_1", name: "Eid Festive", isActive: true };
      mockBannerModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockResult),
        }),
      });

      const result = await service.getActiveCampaign();
      expect(result).toEqual(mockResult);
      expect(mockBannerModel.findOne).toHaveBeenCalledWith({ isActive: true });
    });

    it("isolates database failure and returns null instead of throwing", async () => {
      mockBannerModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockRejectedValue(new Error("Database connection lost")),
        }),
      });

      const result = await service.getActiveCampaign();
      expect(result).toBeNull();
    });
  });

  describe("createCampaign", () => {
    it("creates campaign and invalidates cache", async () => {
      const mockCampaign = { _id: "camp_2", name: "Launch", slides: [] };
      mockBannerModel.create.mockResolvedValue(mockCampaign);

      const result = await service.createCampaign({
        name: "Launch",
        description: "New season",
        slides: [],
        isActive: true,
      });

      expect(result).toEqual(mockCampaign);
      expect(mockBannerModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Launch", isActive: true })
      );
      expect(mockCacheClearer).toHaveBeenCalledWith("cache:/api/banner-campaigns*");
    });

    it("creates campaign even if image upload encounters an error", async () => {
      mockUploadImages.mockRejectedValue(new Error("Cloud storage timeout"));
      const mockCampaign = { _id: "camp_3", name: "Resilient Banner" };
      mockBannerModel.create.mockResolvedValue(mockCampaign);

      const result = await service.createCampaign({
        name: "Resilient Banner",
        slides: [{ fileId: "file_1" }],
        files: [{ filename: "banner.jpg" }],
      });

      expect(result).toEqual(mockCampaign);
    });
  });

  describe("deleteCampaign", () => {
    it("removes campaign even if image cleanup fails", async () => {
      const mockCampaign = {
        _id: "camp_4",
        slides: [{ image: "http://res.cloudinary.com/old_banner.jpg" }],
        deleteOne: jest.fn().mockResolvedValue(true),
      };
      mockBannerModel.findById.mockResolvedValue(mockCampaign);
      mockDeleteImageFn.mockRejectedValue(new Error("Asset not found"));

      const result = await service.deleteCampaign("camp_4");

      expect(mockCampaign.deleteOne).toHaveBeenCalled();
      expect(result.message).toContain("removed successfully");
    });
  });
});

