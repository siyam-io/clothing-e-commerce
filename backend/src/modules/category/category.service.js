import Category from "./category.model.js";
import { uploadImage, deleteImage } from "../../services/imageUploadService.js";
import { clearCache } from "../../middleware/cacheMiddleware.js";
import { ApiError } from "../../utils/responseHandler.js";
import logger from "../../utils/logger.js";

/**
 * Service managing product categories, media assets, and cache invalidation with fault isolation.
 */
export class CategoryService {
  /**
   * @param {Object} [dependencies]
   * @param {typeof Category} [dependencies.categoryModel]
   * @param {Function} [dependencies.uploadImageFn]
   * @param {Function} [dependencies.deleteImageFn]
   * @param {Function} [dependencies.cacheClearer]
   */
  constructor(dependencies = {}) {
    this.categoryModel = dependencies.categoryModel || Category;
    this.uploadImageFn = dependencies.uploadImageFn || uploadImage;
    this.deleteImageFn = dependencies.deleteImageFn || deleteImage;
    this.cacheClearer = dependencies.cacheClearer || clearCache;
  }

  /**
   * Evict all caches dependent on category changes.
   */
  bustRelatedCaches() {
    try {
      this.cacheClearer("cache:/api/categories*");
      this.cacheClearer("cache:/api/products*");
      this.cacheClearer("cache:/api/home-layout*");
      this.cacheClearer("cache:/api/admin/dashboard*");
    } catch (error) {
      logger.warn("Cache eviction skipped in CategoryService:", { error: error.message });
    }
  }

  /**
   * Retrieve storefront categories including virtual promotional entry.
   * Isolates query failure to ensure storefront header does not crash.
   */
  async getPublicCategories() {
    const virtualOnSale = {
      _id: "virtual-on-sale",
      name: "On Sale",
      slug: "on-sale",
      description: "Promotional and discounted items",
      image: null,
    };

    try {
      const categories = await this.categoryModel
        .find({})
        .select("name slug image description isFeatured")
        .sort("name")
        .lean();

      return [virtualOnSale, ...categories];
    } catch (error) {
      logger.error("Failed to query public categories, serving virtual fallback:", {
        error: error.message,
      });
      return [virtualOnSale];
    }
  }

  /**
   * Retrieve category by unique slug.
   */
  async getPublicCategoryBySlug(slug) {
    const category = await this.categoryModel
      .findOne({ slug })
      .select("name slug image description")
      .lean();

    if (!category) {
      throw new ApiError(404, "Category not found");
    }
    return category;
  }

  /**
   * Retrieve category by document ID.
   */
  async getCategoryById(id) {
    const category = await this.categoryModel.findById(id);
    if (!category) {
      throw new ApiError(404, "Category not found");
    }
    return category;
  }

  /**
   * Paginated listing for administrative dashboards.
   */
  async getAdminCategories({ page = 1, limit = 30, search = "" }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 30);

    const filter = {};
    if (search && search.trim()) {
      filter.name = { $regex: search.trim(), $options: "i" };
    }

    const total = await this.categoryModel.countDocuments(filter);
    const categories = await this.categoryModel
      .find(filter)
      .sort("name")
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return {
      categories,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Create category record with optional image upload.
   */
  async createCategory({ name, slug, description, file }) {
    let imageUrl = null;
    if (file) {
      try {
        imageUrl = await this.uploadImageFn(file, "categories");
      } catch (error) {
        logger.error("Category image upload failed during creation:", { error: error.message });
      }
    }

    const category = await this.categoryModel.create({
      name,
      slug,
      description,
      image: imageUrl,
    });

    this.bustRelatedCaches();
    return category;
  }

  /**
   * Update category fields and handle image asset replacement.
   */
  async updateCategory(id, { name, slug, description, file }) {
    const category = await this.getCategoryById(id);

    let imageUrl = category.image;
    if (file) {
      if (category.image) {
        try {
          await this.deleteImageFn(category.image);
        } catch (error) {
          logger.warn("Old category image deletion failed, proceeding with update:", {
            error: error.message,
          });
        }
      }
      try {
        imageUrl = await this.uploadImageFn(file, "categories", category.image);
      } catch (error) {
        logger.error("Category image upload failed during update:", { error: error.message });
      }
    }

    category.name = name || category.name;
    category.slug = slug || category.slug;
    category.description = description !== undefined ? description : category.description;
    category.image = imageUrl;

    const updated = await category.save();
    this.bustRelatedCaches();
    return updated;
  }

  /**
   * Delete category and clean up image asset.
   */
  async deleteCategory(id) {
    const category = await this.getCategoryById(id);

    if (category.image) {
      try {
        await this.deleteImageFn(category.image);
      } catch (error) {
        logger.warn("Category asset cleanup failed during deletion, continuing:", {
          error: error.message,
        });
      }
    }

    await category.deleteOne();
    this.bustRelatedCaches();
    return { message: "Category purged successfully" };
  }
}

export default new CategoryService();

