import Product from "../../product/product.model.js";
import Cart from "../../cart/cart.model.js";

/**
 * Service translating structured conversational assistant actions into cart mutations and order drafts.
 */
export class ConversationalOrderService {
  /**
   * Dispatches incoming action payload to its designated execution handler.
   *
   * @param {Object} actionPayload
   * @param {string} userIdentifier - User ObjectId string or Guest Session identifier.
   * @param {Object} [userInfo=null] - Optional authenticated user document.
   * @returns {Promise<Object>} Execution status and resulting payload.
   */
  static async handleAction(actionPayload, userIdentifier, userInfo = null) {
    if (!actionPayload?.action) {
      return { success: false, message: "No executable action detected" };
    }

    const actionType = actionPayload.action.toUpperCase();

    switch (actionType) {
      case "ADD_TO_CART":
        return this.executeAddToCart(actionPayload, userIdentifier);
      case "CREATE_ORDER":
      case "ORDER_CONFIRM":
      case "PREPARE_CHECKOUT":
        return this.executePrepareOrder(actionPayload, userIdentifier, userInfo);
      case "CHECK_STOCK":
        return this.executeCheckStock(actionPayload);
      default:
        return { success: false, message: `Unsupported action type: ${actionType}` };
    }
  }

  /**
   * Find product matching SKU or product name.
   */
  static async resolveProduct(sku, productName) {
    const query = sku
      ? { sku: new RegExp(`^${sku.trim()}$`, "i") }
      : { name: new RegExp(productName?.trim() || "", "i") };

    return Product.findOne(query).populate("sizes.size", "name");
  }

  /**
   * Match requested size against available product variations.
   */
  static resolveSizeEntry(availableSizes = [], requestedSize) {
    if (requestedSize) {
      const target = requestedSize.trim().toLowerCase();
      return availableSizes.find(
        (entry) => entry.size && entry.size.name.trim().toLowerCase() === target
      );
    }
    if (availableSizes.length === 1) {
      return availableSizes[0];
    }
    return null;
  }

  /**
   * Update or append item in cart while enforcing maximum stock limits.
   */
  static applyCartItemMutation(cart, productId, sizeId, requestedQty, maxStock) {
    const existingIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId.toString() &&
        item.size.toString() === sizeId.toString()
    );

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + requestedQty;
      if (newQty > maxStock) {
        return {
          success: false,
          message: `Cannot add ${requestedQty} more. Cart contains ${cart.items[existingIndex].quantity}, stock is ${maxStock}.`,
        };
      }
      cart.items[existingIndex].quantity = newQty;
    } else {
      cart.items.push({ product: productId, size: sizeId, quantity: requestedQty });
    }

    return { success: true };
  }

  /**
   * Adds specified product SKU and size to user or guest cart.
   */
  static async executeAddToCart(payload, userIdentifier) {
    const { sku, size: requestedSize, quantity = 1, product_name: productName } = payload;
    const product = await this.resolveProduct(sku, productName);

    if (!product) {
      return {
        success: false,
        message: `Product matching "${sku || productName}" was not found in catalog.`,
      };
    }

    const matchedSize = this.resolveSizeEntry(product.sizes, requestedSize);
    if (!matchedSize) {
      const options = (product.sizes || [])
        .filter((s) => s.stock > 0 && s.size)
        .map((s) => s.size.name);
      return {
        success: false,
        message: `Please specify a valid size for ${product.name}. In-stock options: ${options.join(", ") || "None"}.`,
        product: { id: product._id, name: product.name, sku: product.sku },
      };
    }

    const requestedQty = Math.max(1, parseInt(quantity, 10) || 1);
    if (matchedSize.stock < requestedQty) {
      return {
        success: false,
        message: `Insufficient stock for size ${matchedSize.size.name}. Available: ${matchedSize.stock}.`,
      };
    }

    let cart = await Cart.findOne({ user: userIdentifier });
    if (!cart) cart = await Cart.create({ user: userIdentifier, items: [] });

    const mutationResult = this.applyCartItemMutation(
      cart,
      product._id,
      matchedSize.size._id,
      requestedQty,
      matchedSize.stock
    );

    if (!mutationResult.success) return mutationResult;

    await cart.save();
    await cart.populate("items.product", "name price discount images slug sku isActive");
    await cart.populate("items.size", "name");

    const totals = await cart.calculateTotals();
    const unitPrice =
      product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price;

    return {
      success: true,
      message: `Added ${product.name} (Size: ${matchedSize.size.name}, Qty: ${requestedQty}) to your cart.`,
      cart: {
        id: cart._id,
        items: cart.items,
        totalItems: totals.totalItems,
        totalPrice: totals.totalPrice,
      },
      product: {
        id: product._id,
        name: product.name,
        sku: product.sku,
        size: matchedSize.size.name,
        quantity: requestedQty,
        unitPrice,
      },
    };
  }

  /**
   * Prepares an order draft for immediate checkout from chat dialog.
   */
  static async executePrepareOrder(payload, userIdentifier, userInfo) {
    const { quantity = 1 } = payload;
    const cartResult = await this.executeAddToCart(payload, userIdentifier);

    if (!cartResult.success) {
      return cartResult;
    }

    const unitPrice = cartResult.product.unitPrice;
    const totalAmount = unitPrice * (parseInt(quantity, 10) || 1);

    const orderDraft = {
      user: userInfo ? userInfo._id : null,
      isGuest: !userInfo,
      guestId: !userInfo ? userIdentifier : null,
      items: [
        {
          productId: cartResult.product.id,
          name: cartResult.product.name,
          sku: cartResult.product.sku,
          size: cartResult.product.size,
          quantity: cartResult.product.quantity,
          price: unitPrice,
        },
      ],
      totalAmount,
      currency: "BDT",
      status: "Draft",
    };

    return {
      success: true,
      message: `Order draft for ${cartResult.product.name} is ready. Total: BDT ${totalAmount.toFixed(2)}. Proceed to checkout to finalize.`,
      cart: cartResult.cart,
      orderDraft,
    };
  }

  /**
   * Query inventory stock levels for a specific SKU.
   */
  static async executeCheckStock(payload) {
    const { sku } = payload;
    const product = await Product.findOne({
      sku: new RegExp(`^${sku?.trim()}$`, "i"),
    }).populate("sizes.size", "name");

    if (!product) {
      return { success: false, message: `Product with SKU "${sku}" not found.` };
    }

    const sizesStock = (product.sizes || []).map((s) => ({
      size: s.size?.name || "Standard",
      stock: s.stock,
      inStock: s.stock > 0,
    }));

    return {
      success: true,
      product: {
        name: product.name,
        sku: product.sku,
        sizes: sizesStock,
        totalStock: sizesStock.reduce((acc, curr) => acc + curr.stock, 0),
      },
    };
  }
}
