import Cart from "./cart.model.js";
import Product from "../product/product.model.js";
import Size from "../size/size.model.js";
import { ApiError } from "../../utils/responseHandler.js";

/**
 * Service managing customer cart items, stock limits, and totals with fault isolation.
 */
export class CartService {
  /**
   * @param {Object} [dependencies]
   * @param {typeof Cart} [dependencies.cartModel]
   * @param {typeof Product} [dependencies.productModel]
   * @param {typeof Size} [dependencies.sizeModel]
   */
  constructor(dependencies = {}) {
    this.cartModel = dependencies.cartModel || Cart;
    this.productModel = dependencies.productModel || Product;
    this.sizeModel = dependencies.sizeModel || Size;
  }

  /**
   * Pure calculation of total item count and discounted subtotal.
   */
  calculateTotals(cart) {
    let totalItems = 0;
    let totalPrice = 0;

    for (const item of cart.items || []) {
      if (!item.product || item.product.isActive === false) continue;
      const unitPrice =
        item.product.discount > 0
          ? item.product.price * (1 - item.product.discount / 100)
          : item.product.price;

      totalItems += item.quantity;
      totalPrice += unitPrice * item.quantity;
    }

    return { totalItems, totalPrice: Number(totalPrice.toFixed(2)) };
  }

  /**
   * Populate product and size details on cart document.
   */
  async populateCart(cart) {
    await cart.populate("items.product", "name price discount images slug isActive");
    await cart.populate("items.size", "name");
    return cart;
  }

  /**
   * Filter and purge inactive or missing items from cart for resilience.
   */
  async sanitizeCart(cart) {
    const validItems = (cart.items || []).filter(
      (item) => item.product && item.product.isActive !== false && item.size
    );

    if (validItems.length !== cart.items.length) {
      cart.items = validItems.map((item) => ({
        product: item.product._id || item.product,
        size: item.size._id || item.size,
        quantity: item.quantity,
      }));
      await cart.save();
      await this.populateCart(cart);
    }
  }

  /**
   * Format standard cart payload for HTTP response.
   */
  formatResponse(cart) {
    const { totalItems, totalPrice } = this.calculateTotals(cart);
    return {
      ...cart.toObject(),
      totalItems,
      totalPrice,
    };
  }

  /**
   * Retrieve active cart for user.
   */
  async getCart(userId) {
    if (!userId) {
      return { items: [], totalItems: 0, totalPrice: 0 };
    }

    let cart = await this.cartModel.findOne({ user: userId });
    if (!cart) {
      cart = await this.cartModel.create({ user: userId, items: [] });
      return { ...cart.toObject(), totalItems: 0, totalPrice: 0 };
    }

    await this.populateCart(cart);
    await this.sanitizeCart(cart);
    return this.formatResponse(cart);
  }

  /**
   * Add item variation to cart.
   */
  async addToCart(userId, { productId, sizeId, quantity }) {
    const [product, size] = await Promise.all([
      this.productModel.findById(productId),
      this.sizeModel.findById(sizeId),
    ]);

    if (!product || !product.isActive) throw new ApiError(404, "Product not found or inactive");
    if (!size) throw new ApiError(404, "Size not found");

    const sizeRecord = product.sizes.find((s) => s.size.toString() === sizeId);
    if (!sizeRecord || sizeRecord.stock < quantity) {
      throw new ApiError(400, "Insufficient stock for requested item");
    }

    let cart = await this.cartModel.findOne({ user: userId });
    if (!cart) cart = await this.cartModel.create({ user: userId, items: [] });

    const existing = cart.items.find(
      (i) => i.product.toString() === productId && i.size.toString() === sizeId
    );

    if (existing) {
      const combined = existing.quantity + quantity;
      if (sizeRecord.stock < combined) {
        throw new ApiError(400, `Stock limit reached. You already have ${existing.quantity} in cart.`);
      }
      existing.quantity = combined;
    } else {
      cart.items.push({ product: productId, size: sizeId, quantity });
    }

    await cart.save();
    await this.populateCart(cart);
    return this.formatResponse(cart);
  }

  /**
   * Modify quantity of item in cart.
   */
  async updateCartItem(userId, { productId, sizeId, quantity }) {
    const cart = await this.cartModel.findOne({ user: userId });
    if (!cart) throw new ApiError(404, "Cart not found");

    if (quantity < 1) {
      return this.removeFromCart(userId, { productId, sizeId });
    }

    const item = cart.items.find(
      (i) => i.product.toString() === productId && i.size.toString() === sizeId
    );
    if (!item) throw new ApiError(404, "Item not found in cart");

    const product = await this.productModel.findById(productId);
    const sizeStock = product?.sizes.find((s) => s.size.toString() === sizeId);
    if (sizeStock && sizeStock.stock < quantity) {
      throw new ApiError(400, `Insufficient stock. Only ${sizeStock.stock} units available.`);
    }

    item.quantity = quantity;
    await cart.save();
    await this.populateCart(cart);
    return this.formatResponse(cart);
  }

  /**
   * Remove item from cart.
   */
  async removeFromCart(userId, { productId, sizeId }) {
    const cart = await this.cartModel.findOne({ user: userId });
    if (!cart) throw new ApiError(404, "Cart not found");

    cart.items = cart.items.filter(
      (i) => !(i.product.toString() === productId && i.size.toString() === sizeId)
    );

    await cart.save();
    await this.populateCart(cart);
    return this.formatResponse(cart);
  }

  /**
   * Switch item variation size with stock check and potential line item merge.
   */
  async changeSize(userId, { productId, oldSizeId, newSizeId }) {
    const cart = await this.cartModel.findOne({ user: userId });
    if (!cart) throw new ApiError(404, "Cart not found");

    const index = cart.items.findIndex(
      (i) => i.product.toString() === productId && i.size.toString() === oldSizeId
    );
    if (index === -1) throw new ApiError(404, "Item not found in cart");

    const quantity = cart.items[index].quantity;
    const product = await this.productModel.findById(productId);
    const sizeStock = product?.sizes.find((s) => s.size.toString() === newSizeId);
    if (!sizeStock || sizeStock.stock < quantity) {
      throw new ApiError(400, "Insufficient stock for requested size");
    }

    const targetIndex = cart.items.findIndex(
      (i) => i.product.toString() === productId && i.size.toString() === newSizeId
    );

    if (targetIndex !== -1) {
      const mergedQty = cart.items[targetIndex].quantity + quantity;
      if (sizeStock.stock < mergedQty) {
        throw new ApiError(400, `Insufficient stock. Only ${sizeStock.stock} available.`);
      }
      cart.items[targetIndex].quantity = mergedQty;
      cart.items.splice(index, 1);
    } else {
      cart.items[index].size = newSizeId;
    }

    await cart.save();
    await this.populateCart(cart);
    return this.formatResponse(cart);
  }

  /**
   * Empty all items in cart.
   */
  async clearCart(userId) {
    const cart = await this.cartModel.findOne({ user: userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    return { message: "Cart cleared", items: [], totalItems: 0, totalPrice: 0 };
  }

  /**
   * Batch add multiple items to cart.
   */
  async bulkAddCart(userId, items = []) {
    if (!Array.isArray(items)) {
      throw new ApiError(400, "Items must be an array");
    }

    let cart = await this.cartModel.findOne({ user: userId });
    if (!cart) cart = await this.cartModel.create({ user: userId, items: [] });

    for (const newItem of items) {
      const existing = cart.items.find(
        (i) =>
          i.product.toString() === newItem.productId &&
          i.size.toString() === newItem.sizeId
      );
      if (existing) {
        existing.quantity += newItem.quantity;
      } else {
        cart.items.push({
          product: newItem.productId,
          size: newItem.sizeId,
          quantity: newItem.quantity,
        });
      }
    }

    await cart.save();
    await this.populateCart(cart);
    return this.formatResponse(cart);
  }
}

export default new CartService();

