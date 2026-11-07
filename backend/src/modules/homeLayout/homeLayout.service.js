import HomeLayout from "./homeLayout.model.js";
import { clearCache } from "../../middleware/cacheMiddleware.js";
import { ApiError } from "../../utils/responseHandler.js";
import logger from "../../utils/logger.js";

const DEFAULT_SECTIONS = [
  {
    id: "hero-default",
    type: "HERO",
    isVisible: true,
    title: "NEW COLLECTION",
    subtitle: "EXPLORE THE LATEST STYLES",
  },
  {
    id: "usp-default",
    type: "USP",
    isVisible: true,
  },
];

/**
 * Service managing storefront section arrangements, hero banners, and dynamic home page layouts.
 */
export class HomeLayoutService {
  /**
   * @param {Object} [dependencies]
   * @param {typeof HomeLayout} [dependencies.homeLayoutModel]
   * @param {Function} [dependencies.cacheClearer]
   */
  constructor(dependencies = {}) {
    this.homeLayoutModel = dependencies.homeLayoutModel || HomeLayout;
    this.cacheClearer = dependencies.cacheClearer || clearCache;
  }

  /**
   * Safe eviction of home layout caches.
   */
  bustLayoutCache() {
    try {
      this.cacheClearer("cache:/api/home-layout*");
      this.cacheClearer("cache:/api/home-layouts*");
    } catch (error) {
      logger.warn("Cache eviction skipped in HomeLayoutService:", { error: error.message });
    }
  }

  /**
   * Retrieve active layout sections for public storefront.
   * Isolates query failure to ensure home page render does not throw 500.
   */
  async getActiveLayout() {
    try {
      let layout = await this.homeLayoutModel.findOne({ isActive: true }).lean();

      if (!layout) {
        layout = await this.homeLayoutModel.findOne().lean();
      }

      if (!layout) {
        const created = await this.homeLayoutModel.create({
          name: "Default Layout",
          isActive: true,
          sections: DEFAULT_SECTIONS,
        });
        layout = created.toObject ? created.toObject() : created;
      }

      return { sections: layout.sections || DEFAULT_SECTIONS };
    } catch (error) {
      logger.error("Failed to query active home layout, serving fallback sections:", {
        error: error.message,
      });
      return { sections: DEFAULT_SECTIONS };
    }
  }

  /**
   * Retrieve all layout configurations for administration.
   */
  async getAllLayouts() {
    let layouts = await this.homeLayoutModel.find().sort({ createdAt: -1 }).lean();

    if (layouts.length === 0) {
      const defaultLayout = await this.homeLayoutModel.create({
        name: "Default Layout",
        isActive: true,
        sections: DEFAULT_SECTIONS,
      });
      layouts = [defaultLayout];
    }

    return layouts;
  }

  /**
   * Create a new layout entry, cloning sections from the active layout.
   */
  async createLayout({ name }) {
    const activeLayout = await this.homeLayoutModel.findOne({ isActive: true }).lean();
    const sections = activeLayout?.sections?.length ? activeLayout.sections : DEFAULT_SECTIONS;

    const layout = await this.homeLayoutModel.create({
      name: name || `Layout ${Date.now()}`,
      sections,
      isActive: false,
    });

    this.bustLayoutCache();
    return layout;
  }

  /**
   * Update section configurations or title of a layout.
   */
  async updateLayout(id, { sections, name }) {
    const updateFields = {};
    if (sections !== undefined) updateFields.sections = sections;
    if (name !== undefined) updateFields.name = name;

    if (Object.keys(updateFields).length === 0) {
      throw new ApiError(400, "No valid fields provided to update");
    }

    const layout = await this.homeLayoutModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!layout) {
      throw new ApiError(404, "Layout not found");
    }

    this.bustLayoutCache();
    return layout;
  }

  /**
   * Activate target layout and deactivate all others.
   */
  async switchLayout(id) {
    await this.homeLayoutModel.updateMany({}, { isActive: false });

    const layout = await this.homeLayoutModel.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );

    if (!layout) {
      throw new ApiError(404, "Layout not found");
    }

    this.bustLayoutCache();
    return { message: `${layout.name} is now active`, layout };
  }

  /**
   * Delete an inactive layout configuration.
   */
  async deleteLayout(id) {
    const layout = await this.homeLayoutModel.findById(id);

    if (!layout) {
      throw new ApiError(404, "Layout not found");
    }

    if (layout.isActive) {
      throw new ApiError(400, "Cannot delete currently active layout");
    }

    await layout.deleteOne();
    this.bustLayoutCache();
    return { message: "Layout removed successfully" };
  }
}

export default new HomeLayoutService();

