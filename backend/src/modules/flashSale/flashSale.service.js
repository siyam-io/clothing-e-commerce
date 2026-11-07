import FlashSale from "./flashSale.model.js";
import { clearCache } from "../../middleware/cacheMiddleware.js";
import { ApiError } from "../../utils/responseHandler.js";
import logger from "../../utils/logger.js";

const populatedProductsConfig = {
  path: "products",
  populate: {
    path: "sizes.size",
    select: "name",
  },
};

/**
 * Service managing time-bound flash sales, discount calculations, and catalog pricing overlays.
 */
export class FlashSaleService {
  /**
   * @param {Object} [dependencies]
   * @param {typeof FlashSale} [dependencies.flashSaleModel]
   * @param {Function} [dependencies.cacheClearer]
   */
  constructor(dependencies = {}) {
    this.flashSaleModel = dependencies.flashSaleModel || FlashSale;
    this.cacheClearer = dependencies.cacheClearer || clearCache;
  }

  /**
   * Evict caches dependent on flash sale campaigns.
   */
  bustRelatedCaches() {
    try {
      this.cacheClearer("cache:/api/flash-sales*");
      this.cacheClearer("cache:/api/products*");
      this.cacheClearer("cache:/api/home-layout*");
      this.cacheClearer("cache:/api/admin/dashboard*");
    } catch (error) {
      logger.warn("Cache eviction skipped in FlashSaleService:", { error: error.message });
    }
  }

  /**
   * Pure calculation of promotional pricing for sale product items.
   */
  formatProductsWithDiscount(products = [], discountPercentage = 0, endDate = null, startDate = null) {
    const now = new Date();
    return products.map((product) => {
      const basePrice = product.price || 0;
      const discount = Number(discountPercentage) || 0;
      const discountedPrice = Number((basePrice - (basePrice * discount) / 100).toFixed(2));

      return {
        ...product,
        originalPrice: basePrice,
        discountedPrice,
        discountPercentage: discount,
        flashSaleEnds: endDate,
        isLive: startDate ? new Date(startDate) <= now : true,
      };
    });
  }

  /**
   * Retrieve all currently active or upcoming flash sales for storefront display.
   * Isolates query failure to ensure home page does not throw 500.
   */
  async getActiveFlashSales() {
    const now = new Date();
    try {
      const sales = await this.flashSaleModel
        .find({
          isActive: true,
          endDate: { $gte: now },
        })
        .sort("startDate")
        .populate({
          path: "products",
          model: "Product",
          populate: [
            { path: "sizes.size", model: "Size", select: "name" },
            { path: "subcategory", model: "Subcategory", select: "name" },
          ],
        })
        .lean();

      return sales.map((sale) => ({
        ...sale,
        products: this.formatProductsWithDiscount(
          sale.products,
          sale.discount,
          sale.endDate,
          sale.startDate
        ),
      }));
    } catch (error) {
      logger.error("Failed to query active flash sales, isolating failure:", { error: error.message });
      return [];
    }
  }

  /**
   * Retrieve single running flash sale campaign with discounted products.
   */
  async getLiveFlashSale() {
    const now = new Date();
    try {
      const sale = await this.flashSaleModel
        .findOne({
          isActive: true,
          startDate: { $lte: now },
          endDate: { $gte: now },
        })
        .populate({
          path: "products",
          model: "Product",
          populate: { path: "sizes.size", model: "Size", select: "name" },
        })
        .lean();

      if (!sale) return { flashSale: null, products: [] };

      const productsWithDiscount = this.formatProductsWithDiscount(
        sale.products,
        sale.discount,
        sale.endDate,
        sale.startDate
      );

      return { flashSale: sale, products: productsWithDiscount };
    } catch (error) {
      logger.error("Failed to query live flash sale, returning fallback:", { error: error.message });
      return { flashSale: null, products: [] };
    }
  }

  /**
   * Retrieve flash sale campaign by URL slug.
   */
  async getFlashSaleBySlug(slug) {
    const sale = await this.flashSaleModel
      .findOne({ slug })
      .populate({
        path: "products",
        model: "Product",
        populate: { path: "sizes.size", model: "Size", select: "name" },
      })
      .lean();

    if (!sale) {
      throw new ApiError(404, "Flash sale not found");
    }

    const productsWithDiscount = this.formatProductsWithDiscount(
      sale.products,
      sale.discount,
      sale.endDate,
      sale.startDate
    );

    return { ...sale, products: productsWithDiscount };
  }

  /**
   * Paginated list of flash sales for administration.
   */
  async getAllFlashSales({ page = 1, limit = 30, search = "" }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 30);

    const filter = {};
    if (search && search.trim()) {
      filter.name = { $regex: search.trim(), $options: "i" };
    }

    const total = await this.flashSaleModel.countDocuments(filter);
    const flashSales = await this.flashSaleModel
      .find(filter)
      .sort("-createdAt")
      .populate(populatedProductsConfig)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return {
      flashSales,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Retrieve flash sale by document ID for administration.
   */
  async getFlashSaleById(id) {
    const sale = await this.flashSaleModel.findById(id).populate(populatedProductsConfig);
    if (!sale) {
      throw new ApiError(404, "Flash sale not found");
    }
    return sale;
  }

  /**
   * Create a new flash sale campaign.
   */
  async createFlashSale({
    name,
    description = "",
    discount,
    products = [],
    startDate,
    endDate,
    bannerImage = "",
    startImmediately,
  }) {
    if (!name || discount === undefined || !products || !endDate) {
      throw new ApiError(400, "Missing required flash sale fields");
    }

    let finalStartDate = startDate ? new Date(startDate) : new Date();
    if (startImmediately === true || startImmediately === "true") {
      finalStartDate = new Date();
    }

    const end = new Date(endDate);
    if (finalStartDate >= end) {
      throw new ApiError(400, "End date must be after start date");
    }

    const flashSale = await this.flashSaleModel.create({
      name,
      description,
      discount: Number(discount),
      products,
      startDate: finalStartDate,
      endDate: end,
      bannerImage,
      isActive: true,
      startImmediately: startImmediately === true || startImmediately === "true",
    });

    this.bustRelatedCaches();
    return flashSale;
  }

  /**
   * Update flash sale parameters.
   */
  async updateFlashSale(id, bodyData) {
    const sale = await this.getFlashSaleById(id);
    const updateData = { ...bodyData };

    if (updateData.startImmediately !== undefined) {
      const startNow = updateData.startImmediately === true || updateData.startImmediately === "true";
      if (startNow) updateData.startDate = new Date();
    }

    if (updateData.discount !== undefined) {
      const discount = Number(updateData.discount);
      if (isNaN(discount)) throw new ApiError(400, "Invalid discount value");
      updateData.discount = discount;
    }

    if (updateData.products && Array.isArray(updateData.products)) {
      updateData.products = updateData.products.filter((p) => p && typeof p === "string");
    }

    const updatedSale = await this.flashSaleModel
      .findByIdAndUpdate(id, { $set: updateData }, { returnDocument: "after", runValidators: true })
      .populate(populatedProductsConfig);

    this.bustRelatedCaches();
    return updatedSale;
  }

  /**
   * Delete flash sale campaign.
   */
  async deleteFlashSale(id) {
    const sale = await this.flashSaleModel.findByIdAndDelete(id);
    if (!sale) {
      throw new ApiError(404, "Flash sale not found");
    }
    this.bustRelatedCaches();
    return { message: "Campaign removed successfully" };
  }
}

export default new FlashSaleService();

