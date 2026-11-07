import Size from "./size.model.js";
import Category from "../category/category.model.js";
import { ApiError } from "../../utils/responseHandler.js";
import logger from "../../utils/logger.js";

const SIZE_ORDER_MAP = {
  XXS: 1,
  XS: 2,
  S: 3,
  M: 4,
  L: 5,
  XL: 6,
  XXL: 7,
  XXXL: 8,
  "28": 10,
  "29": 11,
  "30": 12,
  "31": 13,
  "32": 14,
  "33": 15,
  "34": 16,
  "35": 17,
  "36": 18,
  "38": 19,
  "40": 20,
  "42": 21,
};

/**
 * Service managing apparel sizing variations, natural sorting hierarchies, and category bounds.
 */
export class SizeService {
  /**
   * @param {Object} [dependencies]
   * @param {typeof Size} [dependencies.sizeModel]
   * @param {typeof Category} [dependencies.categoryModel]
   */
  constructor(dependencies = {}) {
    this.sizeModel = dependencies.sizeModel || Size;
    this.categoryModel = dependencies.categoryModel || Category;
  }

  /**
   * Resolve logical numeric sequence for apparel sizing tags.
   */
  getSizeOrder(name = "") {
    const key = name.trim().toUpperCase();
    return SIZE_ORDER_MAP[key] || 999;
  }

  /**
   * Retrieve paginated sizes ordered by apparel standard hierarchy.
   */
  async getSizes({ page = 1, limit = 30, category } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 30);
    const filter = {};

    if (category && category !== "all") {
      filter.category = category;
    }

    try {
      const total = await this.sizeModel.countDocuments(filter);
      const sizes = await this.sizeModel
        .find(filter)
        .populate("category", "name slug")
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean();

      const sortedSizes = sizes.sort((a, b) => {
        const orderA = this.getSizeOrder(a.name);
        const orderB = this.getSizeOrder(b.name);
        return orderA - orderB;
      });

      return {
        sizes: sortedSizes,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      };
    } catch (error) {
      logger.error("Failed to query sizes, returning fallback:", { error: error.message });
      return { sizes: [], total: 0, page: pageNum, pages: 0 };
    }
  }

  /**
   * Retrieve size by document ID.
   */
  async getSizeById(id) {
    const size = await this.sizeModel.findById(id).populate("category", "name slug").lean();
    if (!size) {
      throw new ApiError(404, "Size not found");
    }
    return size;
  }

  /**
   * Create a new apparel size option under a category.
   */
  async createSize({ name, description, category }) {
    if (!name || !name.trim()) {
      throw new ApiError(400, "Size name is required");
    }
    if (!category) {
      throw new ApiError(400, "Category reference is required");
    }

    const cat = await this.categoryModel.findById(category);
    if (!cat) {
      throw new ApiError(400, "Referenced category not found");
    }

    return await this.sizeModel.create({
      name: name.trim().toUpperCase(),
      description: description?.trim() || "",
      category,
    });
  }

  /**
   * Update size variation attributes.
   */
  async updateSize(id, { name, description, category }) {
    if (category) {
      const cat = await this.categoryModel.findById(category);
      if (!cat) throw new ApiError(400, "Referenced category not found");
    }

    const updateData = {};
    if (name) updateData.name = name.trim().toUpperCase();
    if (description !== undefined) updateData.description = description.trim();
    if (category) updateData.category = category;

    const size = await this.sizeModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!size) {
      throw new ApiError(404, "Size not found");
    }
    return size;
  }

  /**
   * Delete size variation and trigger cascade cleanup in products and carts.
   */
  async deleteSize(id) {
    const size = await this.sizeModel.findById(id);
    if (!size) {
      throw new ApiError(404, "Size not found");
    }

    await size.deleteOne();
    return { message: "Size removed successfully" };
  }
}

export default new SizeService();

