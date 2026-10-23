import Product from '../../product/product.model.js';
import Size from '../../size/size.model.js';
import Cart from '../../cart/cart.model.js';
import Order from '../../order/order.model.js';

export class ConversationalOrderService {
  /**
   * Processes structured actions emitted by the VLM model.
   *
   * @param {Object} actionPayload - e.g. { action: "ADD_TO_CART", sku: "SKU-1", size: "L", quantity: 1 }
   * @param {string} userIdentifier - User ObjectId string or Guest Session ID
   * @param {Object} [userInfo] - Optional authenticated user object
   * @returns {Promise<{ success: boolean, message: string, cart?: Object, orderDraft?: Object, product?: Object }>}
   */
  static async handleAction(actionPayload, userIdentifier, userInfo = null) {
    if (!actionPayload || !actionPayload.action) {
      return { success: false, message: 'No executable action detected' };
    }

    const actionType = actionPayload.action.toUpperCase();

    switch (actionType) {
      case 'ADD_TO_CART':
        return await this.executeAddToCart(actionPayload, userIdentifier);

      case 'CREATE_ORDER':
      case 'ORDER_CONFIRM':
      case 'PREPARE_CHECKOUT':
        return await this.executePrepareOrder(actionPayload, userIdentifier, userInfo);

      case 'CHECK_STOCK':
        return await this.executeCheckStock(actionPayload);

      default:
        return {
          success: false,
          message: `Unknown action type: ${actionType}`,
        };
    }
  }

  /**
   * Adds matched item to user/guest cart in MongoDB.
   */
  static async executeAddToCart(payload, userIdentifier) {
    const { sku, size: requestedSize, quantity = 1, product_name } = payload;

    // 1. Resolve product by SKU, name, or slug
    const productQuery = sku
      ? { sku: new RegExp(`^${sku.trim()}$`, 'i') }
      : { name: new RegExp(product_name?.trim() || '', 'i') };

    const product = await Product.findOne(productQuery).populate('sizes.size', 'name');
    if (!product) {
      return {
        success: false,
        message: `Product matching SKU "${sku || product_name}" could not be located in our inventory.`,
      };
    }

    // 2. Resolve size
    const availableSizes = product.sizes || [];
    let matchedSizeEntry = null;

    if (requestedSize) {
      const cleanSizeReq = requestedSize.trim().toLowerCase();
      matchedSizeEntry = availableSizes.find(
        (entry) => entry.size && entry.size.name.trim().toLowerCase() === cleanSizeReq
      );
    } else if (availableSizes.length === 1) {
      // Default to single available size
      matchedSizeEntry = availableSizes[0];
    }

    if (!matchedSizeEntry) {
      const sizeOptions = availableSizes
        .filter((s) => s.stock > 0 && s.size)
        .map((s) => s.size.name);

      return {
        success: false,
        message: `Please specify a valid size for **${product.name}**. Available in-stock sizes: ${sizeOptions.join(', ') || 'None'}.`,
        product: { id: product._id, name: product.name, sku: product.sku },
      };
    }

    // 3. Stock validation
    const requestedQty = Math.max(1, parseInt(quantity, 10) || 1);
    if (matchedSizeEntry.stock < requestedQty) {
      return {
        success: false,
        message: `Insufficient stock for size **${matchedSizeEntry.size.name}**. Only ${matchedSizeEntry.stock} units available.`,
      };
    }

    const sizeId = matchedSizeEntry.size._id;
    const productId = product._id;

    // 4. Update or Create Cart in MongoDB
    let cart = await Cart.findOne({ user: userIdentifier });
    if (!cart) {
      cart = await Cart.create({ user: userIdentifier, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString() && item.size.toString() === sizeId.toString()
    );

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + requestedQty;
      if (newQty > matchedSizeEntry.stock) {
        return {
          success: false,
          message: `Cannot add ${requestedQty} more. You already have ${cart.items[existingIndex].quantity} in your cart, and our total stock is ${matchedSizeEntry.stock}.`,
        };
      }
      cart.items[existingIndex].quantity = newQty;
    } else {
      cart.items.push({
        product: productId,
        size: sizeId,
        quantity: requestedQty,
      });
    }

    await cart.save();

    // Populate for clean client representation
    await cart.populate('items.product', 'name price discount images slug sku isActive');
    await cart.populate('items.size', 'name');

    const totals = await cart.calculateTotals();

    return {
      success: true,
      message: `✅ Added **${product.name}** (Size: ${matchedSizeEntry.size.name}, Qty: ${requestedQty}) to your cart!`,
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
        size: matchedSizeEntry.size.name,
        quantity: requestedQty,
        unitPrice: product.discount > 0 ? product.price - (product.price * product.discount / 100) : product.price,
      },
    };
  }

  /**
   * Prepares a pending order or checkout draft from conversational intent.
   */
  static async executePrepareOrder(payload, userIdentifier, userInfo) {
    const { sku, size: requestedSize, quantity = 1 } = payload;
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
      currency: 'BDT',
      status: 'Draft',
    };

    return {
      success: true,
      message: `Your order draft for **${cartResult.product.name}** is ready. Total: ৳${totalAmount.toFixed(2)}. Click below to complete checkout!`,
      cart: cartResult.cart,
      orderDraft,
    };
  }

  /**
   * Checks inventory stock levels for a specific SKU and optional size.
   */
  static async executeCheckStock(payload) {
    const { sku } = payload;
    const product = await Product.findOne({ sku: new RegExp(`^${sku?.trim()}$`, 'i') }).populate('sizes.size', 'name');

    if (!product) {
      return { success: false, message: `Product with SKU "${sku}" not found.` };
    }

    const sizesStock = (product.sizes || []).map((s) => ({
      size: s.size?.name || 'Standard',
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
