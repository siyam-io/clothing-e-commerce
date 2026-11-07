import mongoose from "mongoose";
import slugify from "slugify";
import Product from "./product.model.js";
import Category from "../category/category.model.js";
import Subcategory from "../subcategory/subcategory.model.js";
import { uploadMultipleImages, deleteImage } from "../../services/imageUploadService.js";
import { clearCache } from "../../middleware/cacheMiddleware.js";
import { ApiError } from "../../utils/responseHandler.js";
import logger from "../../utils/logger.js";

/**
 * Service managing product catalog, inventory variations, faceted search, and asset lifecycles.
 */
export class ProductService {
  /**
   * @param {Object} [dependencies]
   * @param {typeof Product} [dependencies.productModel]
   * @param {typeof Category} [dependencies.categoryModel]
   * @param {typeof Subcategory} [dependencies.subcategoryModel]
   * @param {Function} [dependencies.uploadImagesFn]
   * @param {Function} [dependencies.deleteImageFn]
   * @param {Function} [dependencies.cacheClearer]
   */
  constructor(dependencies = {}) {
    this.productModel = dependencies.productModel || Product;
    this.categoryModel = dependencies.categoryModel || Category;
    this.subcategoryModel = dependencies.subcategoryModel || Subcategory;
    this.uploadImagesFn = dependencies.uploadImagesFn || uploadMultipleImages;
    this.deleteImageFn = dependencies.deleteImageFn || deleteImage;
    this.cacheClearer = dependencies.cacheClearer || clearCache;
  }

  /**
   * Invalidate catalog and analytical caches safely.
   */
  bustProductCaches() {
    try {
      this.cacheClearer("cache:/api/products*");
      this.cacheClearer("cache:/api/categories*");
      this.cacheClearer("cache:/api/home-layout*");
      this.cacheClearer("cache:/api/admin/dashboard*");
    } catch (error) {
      logger.warn("Cache eviction skipped in ProductService:", { error: error.message });
    }
  }

  /**
   * Build match filter for catalog querying.
   */
  async buildFilter({ category, subcategory, search, minPrice, maxPrice, isFeatured, ids }) {
    const match = { isActive: true };

    if (isFeatured === "true" || isFeatured === true) {
      match.isFeatured = true;
    }

    if (ids) {
      const validIds = ids
        .split(",")
        .filter((id) => mongoose.Types.ObjectId.isValid(id.trim()))
        .map((id) => new mongoose.Types.ObjectId(id.trim()));
      if (validIds.length) match._id = { $in: validIds };
    }

    if (category && category !== "all") {
      if (category === "on-sale") {
        match.discount = { $gt: 0 };
      } else if (mongoose.Types.ObjectId.isValid(category)) {
        match.category = new mongoose.Types.ObjectId(category);
      } else {
        const cat = await this.categoryModel.findOne({ slug: category }).select("_id").lean();
        if (cat) match.category = cat._id;
        else match.category = new mongoose.Types.ObjectId(); // No matches
      }
    }

    if (subcategory && subcategory !== "all") {
      if (mongoose.Types.ObjectId.isValid(subcategory)) {
        match.subcategory = new mongoose.Types.ObjectId(subcategory);
      } else {
        const sub = await this.subcategoryModel.findOne({ slug: subcategory }).select("_id").lean();
        if (sub) match.subcategory = sub._id;
        else match.subcategory = new mongoose.Types.ObjectId(); // No matches
      }
    }

    if (search && search.trim()) {
      const words = search.trim().split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        const regexPattern = words
          .map((w) => `(?=.*${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`)
          .join("");
        match.name = { $regex: regexPattern, $options: "i" };
      }
    }

    if (minPrice || maxPrice) {
      match.price = {};
      if (minPrice) match.price.$gte = Number(minPrice);
      if (maxPrice) match.price.$lte = Number(maxPrice);
    }

    return match;
  }

  /**
   * Retrieve paginated catalog products with pricing and stock enrichment.
   */
  async getPublicProducts(query = {}) {
    const { page = 1, limit = 24, sort } = query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 24);
    const skip = (pageNum - 1) * limitNum;

    try {
      const match = await this.buildFilter(query);
      const sortStage =
        sort === "price"
          ? { price: 1 }
          : sort === "-price"
          ? { price: -1 }
          : { createdAt: -1 };

      const total = await this.productModel.countDocuments(match);
      const products = await this.productModel
        .find(match)
        .sort(sortStage)
        .skip(skip)
        .limit(limitNum)
        .populate("category", "name slug")
        .populate("subcategory", "name slug")
        .populate("sizes.size", "name")
        .lean();

      return {
        products,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      };
    } catch (error) {
      logger.error("Failed to query public products, returning fallback:", { error: error.message });
      return { products: [], total: 0, page: pageNum, pages: 0 };
    }
  }

  /**
   * Retrieve single product by SEO slug.
   */
  async getProductBySlug(slug) {
    const product = await this.productModel
      .findOne({ slug, isActive: true })
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .populate("sizes.size", "name")
      .lean();

    if (!product) {
      throw new ApiError(404, "Product not found");
    }
    return product;
  }

  /**
   * Retrieve single product by document ID.
   */
  async getProductById(id) {
    const product = await this.productModel
      .findById(id)
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .populate("sizes.size", "name");

    if (!product) {
      throw new ApiError(404, "Product not found");
    }
    return product;
  }

  /**
   * Retrieve related products based on category affinity.
   */
  async getRelatedProducts(productId, { limit = 4 } = {}) {
    try {
      const currentProduct = await this.productModel.findById(productId).select("category subcategory");
      if (!currentProduct) return [];

      return await this.productModel
        .find({
          _id: { $ne: productId },
          category: currentProduct.category,
          isActive: true,
        })
        .limit(Math.max(1, parseInt(limit, 10) || 4))
        .populate("sizes.size", "name")
        .lean();
    } catch (error) {
      logger.warn("Failed to fetch related products, returning empty array:", { error: error.message });
      return [];
    }
  }

  /**
   * Retrieve products with low stock levels for inventory management.
   */
  async getLowStockAlerts(threshold = 5) {
    return await this.productModel
      .find({
        isActive: true,
        "sizes.stock": { $lte: Number(threshold) },
      })
      .select("name sku sizes images")
      .populate("sizes.size", "name")
      .lean();
  }

  /**
   * Create a new product with media assets.
   */
  async createProduct(data, files = []) {
    let images = [];
    if (files.length > 0) {
      try {
        images = await this.uploadImagesFn(files, "products");
      } catch (error) {
        logger.error("Product media upload failed:", { error: error.message });
      }
    }

    const slug = data.slug || slugify(data.name, { lower: true, strict: true });
    const product = await this.productModel.create({
      ...data,
      slug,
      images: images.length ? images : data.images || [],
    });

    this.bustProductCaches();
    return product;
  }

  /**
   * Update an existing product.
   */
  async updateProduct(id, data, files = []) {
    const product = await this.getProductById(id);

    if (files.length > 0) {
      try {
        const newImages = await this.uploadImagesFn(files, "products");
        product.images = [...(product.images || []), ...newImages];
      } catch (error) {
        logger.error("New product media upload failed:", { error: error.message });
      }
    }

    if (data.name && data.name !== product.name && !data.slug) {
      product.slug = slugify(data.name, { lower: true, strict: true });
    }

    Object.assign(product, data);
    const updated = await product.save();
    this.bustProductCaches();
    return updated;
  }

  /**
   * Delete product and clean up attached storage assets.
   */
  async deleteProduct(id) {
    const product = await this.getProductById(id);

    for (const imgUrl of product.images || []) {
      try {
        await this.deleteImageFn(imgUrl);
      } catch (err) {
        logger.warn("Image deletion failed on product purge, continuing:", { imgUrl, error: err.message });
      }
    }

    await product.deleteOne();
    this.bustProductCaches();
    return { message: "Product purged successfully" };
  }

  /**
   * Atomically adjust stock level for a product variation.
   */
  async updateStock(productId, sizeId, newStock) {
    const product = await this.productModel.findOneAndUpdate(
      { _id: productId, "sizes.size": sizeId },
      { $set: { "sizes.$.stock": Number(newStock) } },
      { new: true }
    );

    if (!product) {
      throw new ApiError(404, "Product or variation size not found");
    }

    this.bustProductCaches();
    return product;
  }
}

export default new ProductService();

