import BannerCampaign from "./bannerCampaign.model.js";
import { uploadMultipleImages, deleteImage } from "../../services/imageUploadService.js";
import { clearCache } from "../../middleware/cacheMiddleware.js";
import { ApiError } from "../../utils/responseHandler.js";
import logger from "../../utils/logger.js";

/**
 * Service managing promotional banner campaigns and media slides with fault isolation.
 */
export class BannerCampaignService {
  /**
   * @param {Object} [dependencies]
   * @param {typeof BannerCampaign} [dependencies.bannerModel]
   * @param {Function} [dependencies.uploadImages]
   * @param {Function} [dependencies.deleteImageFn]
   * @param {Function} [dependencies.cacheClearer]
   */
  constructor(dependencies = {}) {
    this.bannerModel = dependencies.bannerModel || BannerCampaign;
    this.uploadImages = dependencies.uploadImages || uploadMultipleImages;
    this.deleteImageFn = dependencies.deleteImageFn || deleteImage;
    this.cacheClearer = dependencies.cacheClearer || clearCache;
  }

  /**
   * Parse slides JSON string safely without crashing.
   */
  parseSlides(slidesInput) {
    if (!slidesInput) return [];
    if (Array.isArray(slidesInput)) return slidesInput;
    if (typeof slidesInput === "object") return [slidesInput];
    try {
      return JSON.parse(slidesInput);
    } catch (err) {
      logger.warn("Malformed slides JSON provided to BannerCampaignService:", { error: err.message });
      return [];
    }
  }

  /**
   * Invalidate related caches safely without throwing.
   */
  bustRelatedCaches() {
    try {
      this.cacheClearer("cache:/api/banner-campaigns*");
      this.cacheClearer("cache:/api/home-layout*");
      this.cacheClearer("cache:/api/admin/dashboard*");
    } catch (err) {
      logger.warn("Cache eviction skipped in BannerCampaignService:", { error: err.message });
    }
  }

  /**
   * Retrieve currently active banner campaign.
   * Employs fault isolation: returns null instead of throwing to prevent homepage rendering failures.
   */
  async getActiveCampaign() {
    try {
      return await this.bannerModel.findOne({ isActive: true }).sort("-createdAt").lean();
    } catch (error) {
      logger.error("Failed to query active banner campaign, isolating failure:", { error: error.message });
      return null;
    }
  }

  /**
   * Retrieve campaign by ID.
   */
  async getCampaignById(id) {
    const campaign = await this.bannerModel.findById(id);
    if (!campaign) {
      throw new ApiError(404, "Banner campaign not found");
    }
    return campaign;
  }

  /**
   * Retrieve paginated list of campaigns for administration.
   */
  async getAllCampaigns({ page = 1, limit = 30 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 30);

    const total = await this.bannerModel.countDocuments();
    const campaigns = await this.bannerModel
      .find({})
      .sort("-createdAt")
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return {
      campaigns,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Create a new campaign with optional media upload.
   */
  async createCampaign({ name, description, slides: slidesInput, isActive, files = [] }) {
    let slides = this.parseSlides(slidesInput);

    if (files.length > 0) {
      try {
        const uploadedUrls = await this.uploadImages(files, "banners");
        let fileIndex = 0;
        slides = slides.map((slide) => {
          if (slide.fileId && fileIndex < uploadedUrls.length) {
            return { ...slide, image: uploadedUrls[fileIndex++], fileId: undefined };
          }
          return slide;
        });
      } catch (err) {
        logger.error("Image upload failed during banner creation:", { error: err.message });
      }
    }

    const campaign = await this.bannerModel.create({
      name,
      description,
      slides,
      isActive: isActive === "true" || isActive === true,
    });

    this.bustRelatedCaches();
    return campaign;
  }

  /**
   * Update an existing campaign with slide reconciliation and media replacement.
   */
  async updateCampaign(id, { name, description, slides: slidesInput, isActive, files = [] }) {
    const campaign = await this.getCampaignById(id);
    let updatedSlides = this.parseSlides(slidesInput);

    const oldUrls = campaign.slides.map((s) => s.image).filter(Boolean);
    const keptUrls = updatedSlides.map((s) => s.image).filter(Boolean);
    const urlsToDelete = oldUrls.filter((url) => !keptUrls.includes(url));

    for (const url of urlsToDelete) {
      try {
        await this.deleteImageFn(url);
      } catch (err) {
        logger.warn("Image deletion failed in banner update, continuing:", { url, error: err.message });
      }
    }

    if (files.length > 0) {
      try {
        const newUrls = await this.uploadImages(files, "banners");
        let fileIndex = 0;
        updatedSlides = updatedSlides.map((slide) => {
          if (slide.fileId && fileIndex < newUrls.length) {
            return { ...slide, image: newUrls[fileIndex++], fileId: undefined };
          }
          return slide;
        });
      } catch (err) {
        logger.error("New image upload failed during banner update:", { error: err.message });
      }
    }

    campaign.name = name;
    campaign.description = description;
    campaign.slides = updatedSlides;
    if (isActive !== undefined) {
      campaign.isActive = isActive === "true" || isActive === true;
    }

    await campaign.save();
    this.bustRelatedCaches();
    return campaign;
  }

  /**
   * Delete campaign and clean up associated storage assets.
   */
  async deleteCampaign(id) {
    const campaign = await this.getCampaignById(id);

    for (const slide of campaign.slides) {
      if (slide.image) {
        try {
          await this.deleteImageFn(slide.image);
        } catch (err) {
          logger.warn("Image asset cleanup failed during campaign deletion, continuing:", {
            image: slide.image,
            error: err.message,
          });
        }
      }
    }

    await campaign.deleteOne();
    this.bustRelatedCaches();
    return { message: "Campaign and associated assets removed successfully" };
  }
}

export default new BannerCampaignService();

