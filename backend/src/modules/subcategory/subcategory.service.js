import slugify from "slugify";
import Subcategory from "./subcategory.model.js";
import Category from "../category/category.model.js";
import { uploadImage, deleteImage } from "../../services/imageUploadService.js";
import { clearCache } from "../../middleware/cacheMiddleware.js";
import { ApiError } from "../../utils/responseHandler.js";
import logger from "../../utils/logger.js";

/**
 * Service managing catalog subcategories, taxonomic hierarchy, and media assets with fault isolation.
 */
export class SubcategoryService {
  /**
   * @param {Object} [dependencies]
   * @param {typeof Subcategory} [dependencies.subcategoryModel]
   * @param {typeof Category} [dependencies.categoryModel]
   * @param {Function} [dependencies.uploadImageFn]
   * @param {Function} [dependencies.deleteImageFn]
   * @param {Function} [dependencies.cacheClearer]
   */
  constructor(dependencies = {}) {
    this.subcategoryModel = dependencies.subcategoryModel || Subcategory;
    this.categoryModel = dependencies.categoryModel || Category;
    this.uploadImageFn = dependencies.uploadImageFn || uploadImage;
    this.deleteImageFn = dependencies.deleteImageFn || deleteImage;
    this.cacheClearer = dependencies.cacheClearer || clearCache;
  }

  /**
   * Evict caches dependent on subcategory taxonomy.
   */
  bustSubcategoryCaches() {
    try {
      this.cacheClearer("cache:/api/categories*");
      this.cacheClearer("cache:/api/products*");
      this.cacheClearer("cache:/api/home-layout*");
      this.cacheClearer("cache:/api/admin/dashboard*");
    } catch (error) {
      logger.warn("Cache eviction skipped in SubcategoryService:", { error: error.message });
    }
  }

  /**
   * Retrieve paginated subcategories with optional category and search filters.
   */
  async getSubcategories({ page = 1, limit = 30, search = "", category } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 30);
    const filter = {};

    if (search && search.trim()) {
      filter.name = { $regex: search.trim(), $options: "i" };
    }
    if (category && category !== "all") {
      filter.category = category;
    }

    try {
      const total = await this.subcategoryModel.countDocuments(filter);
      const subcategories = await this.subcategoryModel
        .find(filter)
        .populate("category", "name slug")
        .sort("name")
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean();

      return {
        subcategories,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      };
    } catch (error) {
      logger.error("Failed to query subcategories, returning fallback:", { error: error.message });
      return { subcategories: [], total: 0, page: pageNum, pages: 0 };
    }
  }

  /**
   * Retrieve subcategory by document ID.
   */
  async getSubcategoryById(id) {
    const subcategory = await this.subcategoryModel
      .findById(id)
      .populate("category", "name slug")
      .lean();

    if (!subcategory) {
      throw new ApiError(404, "Subcategory not found");
    }
    return subcategory;
  }

  /**
   * Create a new subcategory record with optional thumbnail image.
   */
  async createSubcategory({ name, slug, category, description, file }) {
    if (!name || !name.trim()) throw new ApiError(400, "Subcategory name is required");
    if (!category) throw new ApiError(400, "Category reference is required");

    const parentCategory = await this.categoryModel.findById(category);
    if (!parentCategory) {
      throw new ApiError(400, "Referenced parent category not found");
    }

    let imageUrl = null;
    if (file) {
      try {
        imageUrl = await this.uploadImageFn(file, "subcategories");
      } catch (error) {
        logger.error("Subcategory image upload failed:", { error: error.message });
      }
    }

    const generatedSlug = slug || slugify(name, { lower: true, strict: true });
    const subcategory = await this.subcategoryModel.create({
      name: name.trim(),
      slug: generatedSlug,
      category,
      description: description?.trim() || "",
      image: imageUrl,
    });

    this.bustSubcategoryCaches();
    return subcategory;
  }

  /**
   * Update subcategory details and reconcile media assets.
   */
  async updateSubcategory(id, data = {}, file) {
    const subcategory = await this.subcategoryModel.findById(id);
    if (!subcategory) {
      throw new ApiError(404, "Subcategory not found");
    }

    if (data.category && data.category !== subcategory.category?.toString()) {
      const parentCategory = await this.categoryModel.findById(data.category);
      if (!parentCategory) throw new ApiError(400, "Referenced parent category not found");
    }

    let imageUrl = subcategory.image;
    if (file) {
      if (subcategory.image) {
        try {
          await this.deleteImageFn(subcategory.image);
        } catch (error) {
          logger.warn("Old subcategory image cleanup failed, continuing:", { error: error.message });
        }
      }
      try {
        imageUrl = await this.uploadImageFn(file, "subcategories", subcategory.image);
      } catch (error) {
        logger.error("New subcategory image upload failed:", { error: error.message });
      }
    }

    if (data.name) {
      subcategory.name = data.name.trim();
      if (!data.slug) subcategory.slug = slugify(data.name, { lower: true, strict: true });
    }
    if (data.slug) subcategory.slug = data.slug.trim().toLowerCase();
    if (data.category) subcategory.category = data.category;
    if (data.description !== undefined) subcategory.description = data.description.trim();
    subcategory.image = imageUrl;

    const updated = await subcategory.save();
    this.bustSubcategoryCaches();
    return updated;
  }

  /**
   * Delete subcategory and trigger cascade product cleanup.
   */
  async deleteSubcategory(id) {
    const subcategory = await this.subcategoryModel.findById(id);
    if (!subcategory) {
      throw new ApiError(404, "Subcategory not found");
    }

    if (subcategory.image) {
      try {
        await this.deleteImageFn(subcategory.image);
      } catch (error) {
        logger.warn("Subcategory asset cleanup failed during deletion, continuing:", {
          error: error.message,
        });
      }
    }

    await subcategory.deleteOne();
    this.bustSubcategoryCaches();
    return { message: "Subcategory removed successfully" };
  }
}

export default new SubcategoryService();

