import Wishlist from "./wishlist.model.js";
import Product from "../product/product.model.js";

const DEFAULT_POPULATE_CONFIG = {
  path: "products",
  select: "name price discount images slug category sizes",
  populate: { path: "sizes.size", select: "name" },
};

/**
 * Service managing user wishlists with automatic reference integrity pruning.
 */
export class WishlistService {
  /**
   * @param {Object} [dependencies]
   * @param {Object} [dependencies.wishlistModel]
   * @param {Object} [dependencies.productModel]
   */
  constructor(dependencies = {}) {
    this.wishlistModel = dependencies.wishlistModel || Wishlist;
    this.productModel = dependencies.productModel || Product;
  }

  /**
   * Retrieves wishlist for a user, populating and cleaning inactive product references.
   */
  async getWishlist(userId) {
    if (!userId) {
      return { products: [] };
    }

    let wishlist = await this.wishlistModel
      .findOne({ user: userId })
      .populate(DEFAULT_POPULATE_CONFIG);

    if (!wishlist) {
      wishlist = await this.wishlistModel.create({ user: userId, products: [] });
    } else {
      await this._pruneMissingProducts(wishlist);
    }

    return wishlist;
  }

  /**
   * Appends product reference to user wishlist.
   */
  async addToWishlist(userId, productId) {
    this._assertAuthenticated(userId);

    const product = await this.productModel.findById(productId);
    if (!product) {
      const error = new Error("Product not found");
      error.statusCode = 404;
      throw error;
    }

    let wishlist = await this.wishlistModel.findOne({ user: userId });
    if (!wishlist) {
      wishlist = await this.wishlistModel.create({ user: userId, products: [] });
    }

    const alreadyExists = wishlist.products.some(
      (existing) => existing?.toString() === productId.toString()
    );

    if (!alreadyExists) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    await wishlist.populate(DEFAULT_POPULATE_CONFIG);
    await this._pruneMissingProducts(wishlist);

    return wishlist;
  }

  /**
   * Removes specific product reference from user wishlist.
   */
  async removeFromWishlist(userId, productId) {
    this._assertAuthenticated(userId);

    const wishlist = await this.wishlistModel.findOne({ user: userId });
    if (!wishlist) {
      const error = new Error("Wishlist not found");
      error.statusCode = 404;
      throw error;
    }

    wishlist.products = wishlist.products.filter(
      (id) => id?.toString() !== productId.toString()
    );

    await wishlist.save();
    await wishlist.populate(DEFAULT_POPULATE_CONFIG);
    await this._pruneMissingProducts(wishlist);

    return wishlist;
  }

  /**
   * Clears all products from user wishlist.
   */
  async clearWishlist(userId) {
    this._assertAuthenticated(userId);

    const wishlist = await this.wishlistModel.findOne({ user: userId });
    if (wishlist) {
      wishlist.products = [];
      await wishlist.save();
    }

    return { message: "Wishlist cleared" };
  }

  /**
   * Merges multiple product references into user wishlist.
   */
  async bulkAddWishlist(userId, productIds) {
    this._assertAuthenticated(userId);

    if (!Array.isArray(productIds)) {
      const error = new Error("productIds must be an array");
      error.statusCode = 400;
      throw error;
    }

    let wishlist = await this.wishlistModel.findOne({ user: userId });
    if (!wishlist) {
      wishlist = await this.wishlistModel.create({ user: userId, products: [] });
    }

    productIds.forEach((id) => {
      const alreadyExists = wishlist.products.some(
        (existing) => existing?.toString() === id.toString()
      );
      if (!alreadyExists) {
        wishlist.products.push(id);
      }
    });

    await wishlist.save();
    await wishlist.populate(DEFAULT_POPULATE_CONFIG);
    await this._pruneMissingProducts(wishlist);

    return wishlist;
  }

  /**
   * Internal guard enforcing authentication requirement.
   */
  _assertAuthenticated(userId) {
    if (!userId) {
      const error = new Error("Authentication required to modify wishlist");
      error.statusCode = 401;
      throw error;
    }
  }

  /**
   * Prunes dangling references where product was deleted from DB.
   */
  async _pruneMissingProducts(wishlist) {
    if (!Array.isArray(wishlist.products)) return;

    const hadNulls = wishlist.products.some((p) => !p);
    if (hadNulls) {
      wishlist.products = wishlist.products.filter(Boolean);
      await this.wishlistModel.updateOne(
        { _id: wishlist._id },
        { $set: { products: wishlist.products.map((p) => p._id || p) } }
      );
    }
  }
}

export default new WishlistService();

