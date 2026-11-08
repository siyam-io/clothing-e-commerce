import mongoose from "mongoose";
import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import ApiKey from "../settings/apiKey.model.js";
import PageSetting from "../settings/settings.model.js";

import Product from "../product/product.model.js";
import Order from "../order/order.model.js";
import Size from "../size/size.model.js";
import Category from "../category/category.model.js";
import Subcategory from "../subcategory/subcategory.model.js";
import Coupon from "../coupon/coupon.model.js";
import User from "../user/user.model.js";
import FlashSale from "../flashSale/flashSale.model.js";
import Blog from "../blog/blog.model.js";
import BannerCampaign from "../bannerCampaign/bannerCampaign.model.js";
import { AdminAiMessage, AdminAiSession } from "./admin-ai-chat.model.js";
import auditLogService from "../auditLog/auditLog.service.js";
import { decrypt } from "../../utils/encryption.js";
import pathaoService from "../../services/pathao.service.js";
import { clearCache } from "../../middleware/cacheMiddleware.js";
import {
  calculateValidatedOrder,
  normalizeShippingAddress,
  finalizeOrderProcessing
} from "../order/order.utils.js";


// Helper function to resolve API key
const getApiKey = async () => {
  let apiKey = "";
  try {
    const apiKeys = await ApiKey.findOne();
    if (apiKeys && apiKeys.geminiApiKey) {
      apiKey = decrypt(apiKeys.geminiApiKey);
    }
  } catch (error) {
    console.error("Error reading geminiApiKey from DB:", error.message);
  }

  return apiKey;
};

// Define tool functions
export const localTools = {
  searchProducts: async ({ query }) => {
    try {
      let products = await Product.find({ $text: { $search: query } })
        .limit(5)
        .populate("category", "name")
        .lean();

      if (!products || products.length === 0) {
        products = await Product.find({ name: { $regex: query, $options: "i" } })
          .limit(5)
          .populate("category", "name")
          .lean();
      }

      return {
        success: true,
        count: products.length,
        products: products.map(p => ({
          id: p._id,
          name: p.name,
          price: p.price,
          category: p.category?.name || "Uncategorized",
          isActive: p.isActive,
          sizes: p.sizes.map(s => ({ stock: s.stock }))
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  updateProductStock: async ({ productId, sizeName, newStock }) => {
    try {
      const product = await Product.findById(productId).populate("sizes.size");
      if (!product) {
        return { success: false, error: "Product not found" };
      }

      // Check sizes matching sizeName (case-insensitive)
      let matchedSize = product.sizes.find(
        s => s.size && s.size.name.toLowerCase() === sizeName.toLowerCase()
      );

      const oldStock = matchedSize ? matchedSize.stock : 0;

      if (!matchedSize) {
        // Fallback: If not found in current product, find the size document globally
        const sizeDoc = await Size.findOne({ name: { $regex: `^${sizeName}$`, $options: "i" } });
        if (sizeDoc) {
          // If product doesn't have this size yet, add it
          product.sizes.push({ size: sizeDoc._id, stock: newStock });
          await product.save();
          return {
            success: true,
            message: `Added size ${sizeName} to ${product.name} with stock ${newStock}`,
            undoAction: {
              tool: "updateProductStock",
              args: { productId, sizeName, newStock: 0 }
            }
          };
        }
        return {
          success: false,
          error: `Size "${sizeName}" is not a valid size option in the store.`
        };
      }

      matchedSize.stock = newStock;
      await product.save();

      return {
        success: true,
        message: `Successfully updated stock of "${product.name}" (Size: ${sizeName}) to ${newStock}.`,
        undoAction: {
          tool: "updateProductStock",
          args: { productId, sizeName, newStock: oldStock }
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getDashboardSummary: async () => {
    try {
      const [ordersCount, productsCount] = await Promise.all([
        Order.countDocuments(),
        Product.countDocuments()
      ]);

      const revenueResult = await Order.aggregate([
        { $match: { "paymentResult.status": { $in: ["Completed", "COD"] } } },
        { $group: { _id: null, total: { $sum: { $toDouble: "$totalPrice" } } } }
      ]);
      const totalRevenue = revenueResult[0]?.total || 0;

      // Low stock stats (sum of stock < 10)
      const lowStockProducts = await Product.aggregate([
        { $project: { name: 1, totalStock: { $sum: "$sizes.stock" } } },
        { $match: { totalStock: { $lt: 10 } } },
        { $limit: 5 }
      ]);

      return {
        success: true,
        ordersCount,
        productsCount,
        totalRevenue: Math.round(totalRevenue),
        criticalStockCount: lowStockProducts.length,
        criticalItems: lowStockProducts
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getRecentOrders: async ({ limit = 5 }) => {
    try {
      const orders = await Order.find({})
        .sort("-createdAt")
        .limit(limit)
        .populate("user", "name email")
        .lean();

      return {
        success: true,
        orders: orders.map(o => ({
          id: o._id,
          customer: o.user?.name || o.shippingAddress?.name || "Guest User",
          totalPrice: o.totalPrice,
          paymentStatus: o.paymentResult?.status || "Pending",
          orderStatus: o.orderStatus || "Processing",
          createdAt: o.createdAt
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  createProduct: async ({ name, price, description, categoryName, sizeStockList, brand, color, material, gender, imageUrl }) => {
    try {
      let categoryObj = await Category.findOne({ name: { $regex: `^${categoryName}$`, $options: "i" } });
      if (!categoryObj) {
        categoryObj = await Category.findOne({ name: { $regex: categoryName, $options: "i" } });
      }
      if (!categoryObj) {
        return { success: false, error: `Category "${categoryName}" does not exist. Please specify a valid category.` };
      }

      const sizesArray = [];
      if (sizeStockList && Array.isArray(sizeStockList)) {
        for (const item of sizeStockList) {
          const sizeDoc = await Size.findOne({ name: { $regex: `^${item.sizeName}$`, $options: "i" } });
          if (sizeDoc) {
            sizesArray.push({
              size: sizeDoc._id,
              stock: Math.max(0, parseInt(item.stock))
            });
          }
        }
      }

      let siteName = "Store";
      try {
        const settings = await PageSetting.findOne();
        if (settings && settings.branding && settings.branding.siteName) {
          siteName = settings.branding.siteName;
        }
      } catch (error) {
        console.error("Error reading siteName from PageSetting:", error.message);
      }

      const slug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

      const product = await Product.create({
        name,
        slug,
        price: parseFloat(price),
        description: description || "",
        category: categoryObj._id,
        sizes: sizesArray,
        brand: brand || siteName,
        color: color || "",
        material: material || "",
        gender: gender || "Unisex",
        images: imageUrl ? [imageUrl] : [],
        isActive: true
      });

      return {
        success: true,
        message: `Successfully created product "${product.name}" under category "${categoryObj.name}"!`,
        productId: product._id,
        undoAction: {
          tool: "updateProductSettings",
          args: { productId: String(product._id), isActive: false }
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  updateProductSeo: async ({ productId, metaTitle, metaDescription, keywords }) => {
    try {
      const product = await Product.findById(productId);
      if (!product) return { success: false, error: "Product not found" };

      const oldSeo = {
        productId,
        metaTitle: product.seo?.metaTitle || "",
        metaDescription: product.seo?.metaDescription || "",
        keywords: product.seo?.keywords || ""
      };

      product.seo = {
        metaTitle: metaTitle || "",
        metaDescription: metaDescription || "",
        keywords: keywords || ""
      };
      await product.save();
      return {
        success: true,
        message: `Successfully updated SEO/AEO tags for product "${product.name}"`,
        undoAction: {
          tool: "updateProductSeo",
          args: oldSeo
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  updateOrderStatus: async ({ orderId, status }) => {
    try {
      const order = await Order.findById(orderId);
      if (!order) return { success: false, error: "Order not found" };
      const oldStatus = order.orderStatus;
      order.orderStatus = status;
      await order.save();
      return {
        success: true,
        message: `Successfully updated order #${orderId} status to "${status}"`,
        undoAction: {
          tool: "updateOrderStatus",
          args: { orderId, status: oldStatus }
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  createCoupon: async ({ code, discountType, discountValue, usageLimit = 100, daysValid = 30 }) => {
    try {
      const existing = await Coupon.findOne({ code: code.toUpperCase() });
      if (existing) return { success: false, error: `Coupon code "${code}" already exists.` };

      const expiry = new Date();
      expiry.setDate(expiry.getDate() + parseInt(daysValid));

      const coupon = await Coupon.create({
        code: code.toUpperCase(),
        discountType: discountType || "percentage",
        discountValue: parseFloat(discountValue),
        usageLimit: parseInt(usageLimit),
        endDate: expiry,
        isActive: true
      });

      return {
        success: true,
        message: `Successfully created coupon "${coupon.code}" (${coupon.discountValue}${coupon.discountType === "percentage" ? "%" : "$"} off, expires on ${coupon.endDate.toLocaleDateString()})`,
        undoAction: {
          tool: "editCoupon",
          args: { code: coupon.code, isActive: false }
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  toggleFlashSale: async ({ productId, discountPercentage, name = "AI Flash Sale" }) => {
    try {
      const product = await Product.findById(productId);
      if (!product) return { success: false, error: "Product not found" };

      let flashSale = await FlashSale.findOne({ isActive: true });
      if (!flashSale) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 7);

        flashSale = await FlashSale.create({
          name,
          discount: parseInt(discountPercentage || 20),
          products: [productId],
          startDate: new Date(),
          endDate: expiry,
          startImmediately: true,
          isActive: true
        });
        return {
          success: true,
          message: `Created new flash sale "${name}" and added ${product.name}`,
          undoAction: {
            tool: "toggleFlashSale",
            args: { productId, discountPercentage, name }
          }
        };
      } else {
        if (flashSale.products.includes(productId)) {
          flashSale.products = flashSale.products.filter(id => String(id) !== productId);
          await flashSale.save();
          return {
            success: true,
            message: `Removed "${product.name}" from active flash sale "${flashSale.name}"`,
            undoAction: {
              tool: "toggleFlashSale",
              args: { productId, discountPercentage, name }
            }
          };
        } else {
          flashSale.products.push(productId);
          await flashSale.save();
          return {
            success: true,
            message: `Added "${product.name}" to active flash sale "${flashSale.name}"`,
            undoAction: {
              tool: "toggleFlashSale",
              args: { productId, discountPercentage, name }
            }
          };
        }
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  searchCustomer: async ({ query }) => {
    try {
      const users = await User.find({
        $or: [
          { name: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } }
        ]
      }).limit(5).select("name email isActive role createdAt").lean();
      return {
        success: true,
        count: users.length,
        users
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  toggleUserStatus: async ({ userId }) => {
    try {
      const user = await User.findById(userId);
      if (!user) return { success: false, error: "User not found" };

      user.isActive = !user.isActive;
      await user.save();
      return {
        success: true,
        message: `Successfully changed status of customer "${user.name}" to ${user.isActive ? "ACTIVE" : "BLOCKED"}`,
        undoAction: {
          tool: "toggleUserStatus",
          args: { userId }
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  createBlogDraft: async ({ title, content, category = "NEWS", imageUrl }) => {
    try {
      const slug = title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

      const authorUser = await User.findOne({ role: { $ne: null } });
      const authorId = authorUser ? authorUser._id : null;

      const blog = await Blog.create({
        title,
        slug,
        content,
        category: category.toUpperCase(),
        author: authorId || new mongoose.Types.ObjectId(),
        featuredImage: imageUrl || "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f",
        status: "DRAFT",
        readingTime: "3 min read"
      });

      return {
        success: true,
        message: `Successfully created blog draft "${blog.title}" under category "${blog.category}"!`,
        blogId: blog._id,
        undoAction: {
          tool: "editBlog",
          args: { blogId: String(blog._id), status: "DRAFT" } // Or set status to hidden/draft
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  createCategory: async ({ name, description, imageUrl }) => {
    try {
      const existing = await Category.findOne({ name: { $regex: `^${name}$`, $options: "i" } });
      if (existing) return { success: false, error: `Category "${name}" already exists.` };

      const slug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
      const category = await Category.create({
        name,
        slug,
        description: description || "",
        image: imageUrl || ""
      });
      return {
        success: true,
        message: `Successfully created category "${category.name}"!`,
        categoryId: category._id
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  listCoupons: async () => {
    try {
      const coupons = await Coupon.find({ isActive: true }).lean();
      return {
        success: true,
        count: coupons.length,
        coupons: coupons.map(c => ({
          code: c.code,
          discountType: c.discountType,
          discountValue: c.discountValue,
          usageLimit: c.usageLimit,
          usedCount: c.usedCount,
          isActive: c.isActive,
          endDate: c.endDate
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  listCategories: async () => {
    try {
      const categories = await Category.find({}).lean();
      return {
        success: true,
        count: categories.length,
        categories: categories.map(c => ({
          id: c._id,
          name: c.name,
          slug: c.slug,
          description: c.description
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  createOrder: async ({ customerEmail, orderItems, shippingAddress, couponCode, paymentMethod = "COD", orderStatus = "Processing", paymentStatus = "Pending" }) => {
    try {
      let customerId;
      if (customerEmail) {
        const userObj = await User.findOne({ email: customerEmail });
        if (userObj) customerId = userObj._id;
      }

      const resolvedItems = [];
      for (const item of orderItems) {
        let prod = null;
        if (item.productId) {
          prod = await Product.findById(item.productId);
        }
        if (!prod && item.productName) {
          prod = await Product.findOne({ name: { $regex: `^${item.productName}$`, $options: "i" } });
        }
        if (!prod) {
          return { success: false, error: `Product "${item.productName || item.productId}" not found.` };
        }

        let matchedSize = null;
        if (item.sizeId) {
          matchedSize = prod.sizes.find(s => String(s.size) === String(item.sizeId));
        }
        if (!matchedSize && item.sizeName) {
          const sizeDoc = await Size.findOne({ name: { $regex: `^${item.sizeName}$`, $options: "i" } });
          if (sizeDoc) {
            matchedSize = prod.sizes.find(s => String(s.size) === String(sizeDoc._id));
          }
        }
        if (!matchedSize) {
          return { success: false, error: `Size "${item.sizeName || item.sizeId}" not available for product "${prod.name}"` };
        }

        resolvedItems.push({
          product: prod._id,
          name: prod.name,
          size: matchedSize.size,
          price: prod.price,
          quantity: parseInt(item.quantity)
        });
      }

      const orderData = await calculateValidatedOrder(
        resolvedItems,
        couponCode,
        shippingAddress.pathao_city_id
      );

      const order = new Order({
        user: customerId || undefined,
        isGuest: !customerId,
        orderItems: orderData.validatedItems,
        shippingAddress: normalizeShippingAddress(shippingAddress),
        itemsPrice: orderData.itemsPrice,
        discountAmount: orderData.discountAmount,
        shippingPrice: orderData.shippingPrice,
        totalPrice: orderData.totalPrice,
        couponCode: orderData.couponCode,
        paymentMethod,
        orderStatus,
        paymentResult: {
          transactionId: `ADMIN-AI-${new mongoose.Types.ObjectId().toString()}`,
          status: paymentStatus,
        },
      });

      const createdOrder = await order.save();
      await finalizeOrderProcessing(createdOrder);
      clearCache('cache:/api/admin/dashboard*');
      return {
        success: true,
        message: `Successfully created order #${createdOrder._id} for ${shippingAddress.name}!`,
        orderId: createdOrder._id,
        totalPrice: createdOrder.totalPrice,
        undoAction: {
          tool: "updateOrderStatus",
          args: { orderId: String(createdOrder._id), status: "Cancelled" }
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  updateOrder: async ({ orderId, orderStatus, shippingAddress, paymentMethod, paymentStatus }) => {
    try {
      const order = await Order.findById(orderId);
      if (!order) return { success: false, error: "Order not found." };

      const oldState = {
        orderId,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentResult?.status || "Pending",
        shippingAddress: {
          name: order.shippingAddress.name,
          phone: order.shippingAddress.phone,
          street: order.shippingAddress.street,
          city: order.shippingAddress.city,
          pathao_city_id: order.shippingAddress.pathao_city_id || "",
          pathao_zone_id: order.shippingAddress.pathao_zone_id || "",
          pathao_area_id: order.shippingAddress.pathao_area_id || ""
        }
      };

      if (shippingAddress) {
        order.shippingAddress = { ...order.shippingAddress, ...shippingAddress };
      }
      if (orderStatus) order.orderStatus = orderStatus;
      if (paymentMethod) order.paymentMethod = paymentMethod;
      if (paymentStatus) {
        order.paymentResult = { ...order.paymentResult, status: paymentStatus };
      }
      await order.save();
      clearCache('cache:/api/admin/dashboard*');
      return {
        success: true,
        message: `Successfully updated order #${orderId}`,
        order,
        undoAction: {
          tool: "updateOrder",
          args: oldState
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getOrderDetails: async ({ orderId }) => {
    try {
      const order = await Order.findById(orderId)
        .populate("user", "name email")
        .populate("orderItems.product", "name price");
      if (!order) return { success: false, error: "Order not found." };
      return { success: true, order };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  listOrders: async ({ status, search, limit = 10, page = 1 }) => {
    try {
      const filter = {};
      if (status && status !== "all") filter.orderStatus = status;
      if (search && search.trim()) {
        const safeSearch = search.trim();
        if (mongoose.Types.ObjectId.isValid(safeSearch)) {
          filter._id = safeSearch;
        } else {
          filter.$or = [
            { "shippingAddress.phone": { $regex: safeSearch, $options: "i" } },
            { "shippingAddress.name": { $regex: safeSearch, $options: "i" } },
          ];
        }
      }
      const skip = (Math.max(1, page) - 1) * limit;
      const orders = await Order.find(filter)
        .sort("-createdAt")
        .skip(skip)
        .limit(limit)
        .lean();
      const total = await Order.countDocuments(filter);
      return { success: true, count: orders.length, total, orders };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  syncOrderToPathao: async ({ orderId }) => {
    try {
      const order = await Order.findById(orderId);
      if (!order) return { success: false, error: "Order not found." };

      const pKeys = {
        clientId: process.env.PATHAO_CLIENT_ID,
        clientSecret: process.env.PATHAO_CLIENT_SECRET,
        username: process.env.PATHAO_USERNAME,
        password: process.env.PATHAO_PASSWORD,
        storeId: process.env.PATHAO_STORE_ID,
        isActive: !!process.env.PATHAO_CLIENT_ID
      };
      if (!pKeys?.isActive) return { success: false, error: "Pathao service is currently inactive in settings." };

      let cityId = order.shippingAddress.pathao_city_id;
      let zoneId = order.shippingAddress.pathao_zone_id;
      let areaId = order.shippingAddress.pathao_area_id;

      if (!cityId || !zoneId || !areaId) {
        const addressToSearch = `${order.shippingAddress.street}, ${order.shippingAddress.city}`;
        const resolved = await pathaoService.autoResolveAddress(addressToSearch, pKeys);
        if (resolved) {
          cityId = resolved.city_id;
          zoneId = resolved.zone_id;
          areaId = resolved.area_id;
          order.shippingAddress.pathao_city_id = String(cityId);
          order.shippingAddress.pathao_zone_id = String(zoneId);
          order.shippingAddress.pathao_area_id = String(areaId);
          await order.save();
        } else {
          return { success: false, error: "Pathao couldn't auto-resolve address. Set City/Zone/Area manually." };
        }
      }

      const payload = {
        store_id: parseInt(pKeys.storeId),
        merchant_order_id: order._id.toString(),
        recipient_name: order.shippingAddress.name,
        recipient_phone: order.shippingAddress.phone,
        recipient_address: order.shippingAddress.street,
        recipient_city: parseInt(cityId),
        recipient_zone: parseInt(zoneId),
        recipient_area: parseInt(areaId),
        delivery_type: 48,
        item_type: 2,
        item_weight: "0.5",
        amount_to_collect: order.paymentResult.status === "Completed" ? 0 : Math.round(order.totalPrice),
        item_quantity: order.orderItems.length,
        item_description: order.orderItems.map((i) => i.name).join(", "),
      };

      const pRes = await pathaoService.createOrder(payload, pKeys);
      order.pathaoConsignmentId = pRes.consignment_id;
      order.pathaoStatus = "Synced";
      await order.save();

      return {
        success: true,
        message: "Pathao Synchronized successfully.",
        consignmentId: pRes.consignment_id,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  editProduct: async ({ productId, name, price, description, categoryName, subcategoryName, brand, color, material, gender, imageUrl }) => {
    try {
      const product = await Product.findById(productId).populate("category subcategory");
      if (!product) return { success: false, error: "Product not found" };

      const oldState = {
        productId,
        name: product.name,
        price: product.price,
        description: product.description,
        categoryName: product.category?.name || "",
        subcategoryName: product.subcategory?.name || "",
        brand: product.brand,
        color: product.color,
        material: product.material,
        gender: product.gender,
        imageUrl: product.images?.[0] || ""
      };

      if (name) {
        product.name = name;
        product.slug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
      }
      if (price) product.price = parseFloat(price);
      if (description !== undefined) product.description = description;
      if (brand) product.brand = brand;
      if (color) product.color = color;
      if (material) product.material = material;
      if (gender) product.gender = gender;
      if (imageUrl) product.images = [imageUrl];

      if (categoryName) {
        const categoryObj = await Category.findOne({ name: { $regex: `^${categoryName}$`, $options: "i" } });
        if (categoryObj) product.category = categoryObj._id;
      }

      if (subcategoryName) {
        const subcatObj = await Subcategory.findOne({ name: { $regex: `^${subcategoryName}$`, $options: "i" } });
        if (subcatObj) product.subcategory = subcatObj._id;
      }

      await product.save();
      return {
        success: true,
        message: `Successfully updated product "${product.name}"!`,
        product,
        undoAction: {
          tool: "editProduct",
          args: oldState
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  updateProductSettings: async ({ productId, isFeatured, isActive, showReviews }) => {
    try {
      const product = await Product.findById(productId);
      if (!product) return { success: false, error: "Product not found" };

      const oldState = {
        productId,
        isFeatured: product.isFeatured,
        isActive: product.isActive,
        showReviews: product.showReviews
      };

      if (isFeatured !== undefined) product.isFeatured = isFeatured;
      if (isActive !== undefined) product.isActive = isActive;
      if (showReviews !== undefined) product.showReviews = showReviews;
      await product.save();
      return {
        success: true,
        message: `Successfully updated product settings for "${product.name}"`,
        undoAction: {
          tool: "updateProductSettings",
          args: oldState
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  editCategory: async ({ categoryId, name, description, imageUrl }) => {
    try {
      const category = await Category.findById(categoryId);
      if (!category) return { success: false, error: "Category not found" };

      const oldState = {
        categoryId,
        name: category.name,
        description: category.description,
        imageUrl: category.image
      };

      if (name) {
        category.name = name;
        category.slug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
      }
      if (description !== undefined) category.description = description;
      if (imageUrl) category.image = imageUrl;
      await category.save();
      return {
        success: true,
        message: `Successfully updated category "${category.name}"`,
        undoAction: {
          tool: "editCategory",
          args: oldState
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  listSubcategories: async () => {
    try {
      const subcategories = await Subcategory.find({}).populate("category", "name").lean();
      return { success: true, count: subcategories.length, subcategories };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  createSubcategory: async ({ name, categoryName, description, imageUrl }) => {
    try {
      const categoryObj = await Category.findOne({ name: { $regex: `^${categoryName}$`, $options: "i" } });
      if (!categoryObj) return { success: false, error: `Category "${categoryName}" not found.` };
      const existing = await Subcategory.findOne({ name: { $regex: `^${name}$`, $options: "i" }, category: categoryObj._id });
      if (existing) return { success: false, error: `Subcategory "${name}" already exists in "${categoryName}".` };
      const slug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
      const subcat = await Subcategory.create({
        name,
        slug,
        category: categoryObj._id,
        description: description || "",
        image: imageUrl || ""
      });
      return {
        success: true,
        message: `Successfully created subcategory "${subcat.name}" under category "${categoryObj.name}"!`,
        subcategoryId: subcat._id,
        undoAction: {
          tool: "editSubcategory",
          args: { subcategoryId: String(subcat._id) } // Mark it or deactivate it
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  editSubcategory: async ({ subcategoryId, name, categoryName, description, imageUrl }) => {
    try {
      const subcat = await Subcategory.findById(subcategoryId).populate("category");
      if (!subcat) return { success: false, error: "Subcategory not found." };

      const oldState = {
        subcategoryId,
        name: subcat.name,
        categoryName: subcat.category?.name || "",
        description: subcat.description,
        imageUrl: subcat.image
      };

      if (name) {
        subcat.name = name;
        subcat.slug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
      }
      if (categoryName) {
        const categoryObj = await Category.findOne({ name: { $regex: `^${categoryName}$`, $options: "i" } });
        if (categoryObj) subcat.category = categoryObj._id;
      }
      if (description !== undefined) subcat.description = description;
      if (imageUrl) subcat.image = imageUrl;
      await subcat.save();
      return {
        success: true,
        message: `Successfully updated subcategory "${subcat.name}"`,
        undoAction: {
          tool: "editSubcategory",
          args: oldState
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  listBannerCampaigns: async () => {
    try {
      const campaigns = await BannerCampaign.find({}).lean();
      return { success: true, count: campaigns.length, campaigns };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  createBannerCampaign: async ({ name, description, slides, isActive = false }) => {
    try {
      const campaign = await BannerCampaign.create({ name, description, slides, isActive });
      return {
        success: true,
        message: `Successfully created banner campaign "${campaign.name}"!`,
        campaignId: campaign._id,
        undoAction: {
          tool: "editBannerCampaign",
          args: { campaignId: String(campaign._id), isActive: false }
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  editBannerCampaign: async ({ campaignId, name, description, slides, isActive }) => {
    try {
      const campaign = await BannerCampaign.findById(campaignId);
      if (!campaign) return { success: false, error: "Campaign not found" };

      const oldState = {
        campaignId,
        name: campaign.name,
        description: campaign.description,
        slides: campaign.slides,
        isActive: campaign.isActive
      };

      if (name) campaign.name = name;
      if (description !== undefined) campaign.description = description;
      if (slides) campaign.slides = slides;
      if (isActive !== undefined) campaign.isActive = isActive;
      await campaign.save();
      return {
        success: true,
        message: `Successfully updated campaign "${campaign.name}"`,
        undoAction: {
          tool: "editBannerCampaign",
          args: oldState
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  listFlashSales: async () => {
    try {
      const sales = await FlashSale.find({}).populate("products", "name").lean();
      return { success: true, count: sales.length, sales };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  createFlashSaleCampaign: async ({ name, description, discount, productIds, startDate, endDate, isActive = true, bannerImage, startImmediately = false }) => {
    try {
      const campaign = await FlashSale.create({ name, description, discount, products: productIds, startDate, endDate, isActive, bannerImage, startImmediately });
      return {
        success: true,
        message: `Successfully created flash sale campaign "${campaign.name}"!`,
        campaignId: campaign._id,
        undoAction: {
          tool: "editFlashSaleCampaign",
          args: { campaignId: String(campaign._id), isActive: false }
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  editFlashSaleCampaign: async ({ campaignId, name, description, discount, productIds, startDate, endDate, isActive, bannerImage }) => {
    try {
      const campaign = await FlashSale.findById(campaignId);
      if (!campaign) return { success: false, error: "Flash sale campaign not found" };

      const oldState = {
        campaignId,
        name: campaign.name,
        description: campaign.description,
        discount: campaign.discount,
        productIds: campaign.products?.map(id => String(id)) || [],
        startDate: campaign.startDate?.toISOString() || "",
        endDate: campaign.endDate?.toISOString() || "",
        isActive: campaign.isActive,
        bannerImage: campaign.bannerImage
      };

      if (name) campaign.name = name;
      if (description !== undefined) campaign.description = description;
      if (discount) campaign.discount = discount;
      if (productIds) campaign.products = productIds;
      if (startDate) campaign.startDate = startDate;
      if (endDate) campaign.endDate = endDate;
      if (isActive !== undefined) campaign.isActive = isActive;
      if (bannerImage) campaign.bannerImage = bannerImage;
      await campaign.save();
      return {
        success: true,
        message: `Successfully updated flash sale "${campaign.name}"`,
        undoAction: {
          tool: "editFlashSaleCampaign",
          args: oldState
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  editCoupon: async ({ couponId, code, discountType, discountValue, usageLimit, daysValid, isActive }) => {
    try {
      const coupon = await Coupon.findById(couponId);
      if (!coupon) {
        const cCode = code ? code.toUpperCase() : "";
        const couponByCode = await Coupon.findOne({ code: cCode });
        if (!couponByCode) return { success: false, error: "Coupon not found" };
        return await editCouponDoc(couponByCode);
      }
      return await editCouponDoc(coupon);

      async function editCouponDoc(doc) {
        const oldState = {
          couponId: String(doc._id),
          code: doc.code,
          discountType: doc.discountType,
          discountValue: doc.discountValue,
          usageLimit: doc.usageLimit,
          isActive: doc.isActive
        };
        const oldDaysValid = Math.max(1, Math.round((doc.endDate - new Date()) / (1000 * 60 * 60 * 24)));
        oldState.daysValid = oldDaysValid;

        if (code) doc.code = code.toUpperCase();
        if (discountType) doc.discountType = discountType;
        if (discountValue) doc.discountValue = parseFloat(discountValue);
        if (usageLimit !== undefined) doc.usageLimit = parseInt(usageLimit);
        if (daysValid) {
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + parseInt(daysValid));
          doc.endDate = expiry;
        }
        if (isActive !== undefined) doc.isActive = isActive;
        await doc.save();
        return {
          success: true,
          message: `Successfully updated coupon "${doc.code}"`,
          undoAction: {
            tool: "editCoupon",
            args: oldState
          }
        };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  listBlogs: async () => {
    try {
      const blogs = await Blog.find({}).populate("author", "name").lean();
      return { success: true, count: blogs.length, blogs };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  editBlog: async ({ blogId, title, content, category, imageUrl, status }) => {
    try {
      const blog = await Blog.findById(blogId);
      if (!blog) return { success: false, error: "Blog not found" };

      const oldState = {
        blogId,
        title: blog.title,
        content: blog.content,
        category: blog.category,
        imageUrl: blog.featuredImage,
        status: blog.status
      };

      if (title) {
        blog.title = title;
        blog.slug = title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
      }
      if (content) blog.content = content;
      if (category) blog.category = category.toUpperCase();
      if (imageUrl) blog.featuredImage = imageUrl;
      if (status) blog.status = status.toUpperCase();
      await blog.save();
      return {
        success: true,
        message: `Successfully updated blog post "${blog.title}"`,
        undoAction: {
          tool: "editBlog",
          args: oldState
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// Define Gemini tool declarations (Function Declarations)
export const toolDeclarations = [
  {
    name: "searchProducts",
    description: "Search for clothing products in the catalog by a text query or product name",
    parameters: {
      type: "OBJECT",
      properties: {
        query: {
          type: "STRING",
          description: "The search query (e.g. 'T-shirt', 'Jeans', 'Red jacket')"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "updateProductStock",
    description: "Update the inventory / stock count of a specific size of a product",
    parameters: {
      type: "OBJECT",
      properties: {
        productId: {
          type: "STRING",
          description: "The MongoDB ID of the product"
        },
        sizeName: {
          type: "STRING",
          description: "The name of the size (e.g. 'S', 'M', 'L', 'XL', 'XXL')"
        },
        newStock: {
          type: "INTEGER",
          description: "The new stock count to set (must be >= 0)"
        }
      },
      required: ["productId", "sizeName", "newStock"]
    }
  },
  {
    name: "getDashboardSummary",
    description: "Get general store business metrics, total completed sales revenue, order count, and low stock inventory alerts",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },
  {
    name: "getRecentOrders",
    description: "Retrieve a list of the most recent orders placed in the store",
    parameters: {
      type: "OBJECT",
      properties: {
        limit: {
          type: "INTEGER",
          description: "The number of orders to return (defaults to 5)"
        }
      }
    }
  },
  {
    name: "createProduct",
    description: "Create a new clothing product in the store database catalog",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", description: "Name of the clothing product" },
        price: { type: "NUMBER", description: "Retail price of the product" },
        description: { type: "STRING", description: "Detailed description of the product" },
        imageUrl: { type: "STRING", description: "The image URL link to associate with this product" },
        categoryName: { type: "STRING", description: "Category name (e.g., 'T-Shirt', 'Pants', 'Outerwear')" },
        sizeStockList: {
          type: "ARRAY",
          description: "List of sizes and their initial stock levels",
          items: {
            type: "OBJECT",
            properties: {
              sizeName: { type: "STRING", description: "Name of size e.g. 'S', 'M', 'L', 'XL'" },
              stock: { type: "INTEGER", description: "Initial stock quantity" }
            },
            required: ["sizeName", "stock"]
          }
        },
        brand: { type: "STRING", description: "Brand name" },
        color: { type: "STRING", description: "Primary color name" },
        material: { type: "STRING", description: "Fabric material" },
        gender: { type: "STRING", description: "Target gender ('Men', 'Women', 'Unisex', 'Kids')" }
      },
      required: ["name", "price", "categoryName"]
    }
  },
  {
    name: "updateProductSeo",
    description: "Update the search engine optimization (SEO / AEO) meta details and keywords of a specific product",
    parameters: {
      type: "OBJECT",
      properties: {
        productId: { type: "STRING", description: "MongoDB object ID of the product to modify" },
        metaTitle: { type: "STRING", description: "Optimized SEO Meta Title" },
        metaDescription: { type: "STRING", description: "Optimized SEO Meta Description" },
        keywords: { type: "STRING", description: "Comma-separated keywords (e.g., 'jeans, pants, blue jeans')" }
      },
      required: ["productId", "metaTitle", "metaDescription", "keywords"]
    }
  },
  {
    name: "updateOrderStatus",
    description: "Change the processing / delivery status of a customer order",
    parameters: {
      type: "OBJECT",
      properties: {
        orderId: { type: "STRING", description: "MongoDB ID of the order" },
        status: { type: "STRING", description: "New status of order, e.g., 'Processing', 'Shipped', 'Delivered', 'Cancelled'" }
      },
      required: ["orderId", "status"]
    }
  },
  {
    name: "createCoupon",
    description: "Generate a new active store coupon code for customer discounts",
    parameters: {
      type: "OBJECT",
      properties: {
        code: { type: "STRING", description: "Coupon code text (e.g. SUMMERSALE)" },
        discountType: { type: "STRING", description: "Type of discount ('percentage' or 'fixed')" },
        discountValue: { type: "NUMBER", description: "Discount rate (e.g. 15 for percentage, or 100 for fixed USD)" },
        usageLimit: { type: "INTEGER", description: "Total number of times coupon can be used storewide" },
        daysValid: { type: "INTEGER", description: "Number of days the coupon will remain active from today" }
      },
      required: ["code", "discountType", "discountValue"]
    }
  },
  {
    name: "toggleFlashSale",
    description: "Add or remove a product from the active flash sale catalog immediately",
    parameters: {
      type: "OBJECT",
      properties: {
        productId: { type: "STRING", description: "MongoDB ID of the product" },
        discountPercentage: { type: "INTEGER", description: "Discount percentage for this flash sale (e.g. 25 for 25% off)" },
        name: { type: "STRING", description: "Name of the Flash Sale campaign" }
      },
      required: ["productId"]
    }
  },
  {
    name: "searchCustomer",
    description: "Look up and search customer user profiles by name or email address",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Customer name or email address query" }
      },
      required: ["query"]
    }
  },
  {
    name: "toggleUserStatus",
    description: "Toggle activation status of a user. Can ban/block or activate/unblock accounts",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "MongoDB ID of the user" }
      },
      required: ["userId"]
    }
  },
  {
    name: "createBlogDraft",
    description: "Draft a new fashion or marketing blog post for the store",
    parameters: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING", description: "Blog title" },
        content: { type: "STRING", description: "Full HTML content/article body text" },
        imageUrl: { type: "STRING", description: "The image URL link to associate with this blog post" },
        category: { type: "STRING", description: "Category: 'LIFESTYLE', 'COLLECTION', 'FABRIC', 'CULTURE', 'NEWS'" }
      },
      required: ["title", "content"]
    }
  },
  {
    name: "createCategory",
    description: "Create a new product category in the store database catalog",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", description: "Name of the category (e.g., Shirts, Pants, Accessories)" },
        description: { type: "STRING", description: "Brief description of the category" },
        imageUrl: { type: "STRING", description: "The image URL link for the category image" }
      },
      required: ["name"]
    }
  },
  {
    name: "listCoupons",
    description: "Retrieve a list of all active discount coupons available in the store",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },
  {
    name: "listCategories",
    description: "List all existing product categories in the store database catalog",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },
  {
    name: "createOrder",
    description: "Create a new customer order with details such as customer email, items, sizes, quantities, and shipping address.",
    parameters: {
      type: "OBJECT",
      properties: {
        customerEmail: { type: "STRING", description: "Optional customer email" },
        couponCode: { type: "STRING", description: "Optional promo coupon code applied to order" },
        paymentMethod: { type: "STRING", description: "Payment method, e.g. 'COD' (default) or 'Card'" },
        orderStatus: { type: "STRING", description: "Initial status, defaults to 'Processing'" },
        paymentStatus: { type: "STRING", description: "Payment status, defaults to 'Pending'" },
        orderItems: {
          type: "ARRAY",
          description: "List of order items with quantities and sizes",
          items: {
            type: "OBJECT",
            properties: {
              productId: { type: "STRING", description: "MongoDB object ID of the product" },
              productName: { type: "STRING", description: "Exact name of the product if productId is not specified" },
              sizeId: { type: "STRING", description: "Size MongoDB ID" },
              sizeName: { type: "STRING", description: "Size name (e.g. 'S', 'M', 'L')" },
              quantity: { type: "INTEGER", description: "Quantity of items" }
            },
            required: ["quantity"]
          }
        },
        shippingAddress: {
          type: "OBJECT",
          description: "Customer shipping details",
          properties: {
            name: { type: "STRING", description: "Recipient name" },
            phone: { type: "STRING", description: "Contact number" },
            street: { type: "STRING", description: "Street address" },
            city: { type: "STRING", description: "City name" },
            pathao_city_id: { type: "STRING", description: "Pathao delivery City ID (optional)" },
            pathao_zone_id: { type: "STRING", description: "Pathao delivery Zone ID (optional)" },
            pathao_area_id: { type: "STRING", description: "Pathao delivery Area ID (optional)" }
          },
          required: ["name", "phone", "street", "city"]
        }
      },
      required: ["orderItems", "shippingAddress"]
    }
  },
  {
    name: "updateOrder",
    description: "Update details of an existing order like status, address, or payment state.",
    parameters: {
      type: "OBJECT",
      properties: {
        orderId: { type: "STRING", description: "MongoDB order ID" },
        orderStatus: { type: "STRING", description: "New order status ('Processing', 'Shipped', 'Delivered', 'Cancelled')" },
        paymentMethod: { type: "STRING", description: "Updated payment method" },
        paymentStatus: { type: "STRING", description: "Updated payment status" },
        shippingAddress: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING" },
            phone: { type: "STRING" },
            street: { type: "STRING" },
            city: { type: "STRING" },
            pathao_city_id: { type: "STRING" },
            pathao_zone_id: { type: "STRING" },
            pathao_area_id: { type: "STRING" }
          }
        }
      },
      required: ["orderId"]
    }
  },
  {
    name: "getOrderDetails",
    description: "Retrieve comprehensive details of a specific order by ID",
    parameters: {
      type: "OBJECT",
      properties: {
        orderId: { type: "STRING", description: "MongoDB order ID" }
      },
      required: ["orderId"]
    }
  },
  {
    name: "listOrders",
    description: "Retrieve a paginated list of orders optionally filtered by status or phone/name search.",
    parameters: {
      type: "OBJECT",
      properties: {
        status: { type: "STRING", description: "Filter by status or 'all'" },
        search: { type: "STRING", description: "Search by phone number, name or order ID" },
        limit: { type: "INTEGER", description: "Number of orders per page" },
        page: { type: "INTEGER", description: "Page number" }
      }
    }
  },
  {
    name: "syncOrderToPathao",
    description: "Send order info to the Pathao Courier API and save consignment ID",
    parameters: {
      type: "OBJECT",
      properties: {
        orderId: { type: "STRING", description: "MongoDB order ID" }
      },
      required: ["orderId"]
    }
  },
  {
    name: "editProduct",
    description: "Modify general properties of an existing product in the catalog.",
    parameters: {
      type: "OBJECT",
      properties: {
        productId: { type: "STRING", description: "MongoDB ID of product" },
        name: { type: "STRING", description: "Updated product name" },
        price: { type: "NUMBER", description: "Updated price" },
        description: { type: "STRING", description: "Updated description" },
        categoryName: { type: "STRING", description: "Updated category name" },
        subcategoryName: { type: "STRING", description: "Updated subcategory name" },
        brand: { type: "STRING" },
        color: { type: "STRING" },
        material: { type: "STRING" },
        gender: { type: "STRING" },
        imageUrl: { type: "STRING", description: "New image URL to overwrite images array" }
      },
      required: ["productId"]
    }
  },
  {
    name: "updateProductSettings",
    description: "Change status flags on a product such as featured, active status, or reviews visibility.",
    parameters: {
      type: "OBJECT",
      properties: {
        productId: { type: "STRING", description: "MongoDB product ID" },
        isFeatured: { type: "BOOLEAN" },
        isActive: { type: "BOOLEAN" },
        showReviews: { type: "BOOLEAN" }
      },
      required: ["productId"]
    }
  },
  {
    name: "editCategory",
    description: "Modify fields of an existing category like name, description, or image.",
    parameters: {
      type: "OBJECT",
      properties: {
        categoryId: { type: "STRING", description: "Category MongoDB ID" },
        name: { type: "STRING", description: "Updated name" },
        description: { type: "STRING", description: "Updated description" },
        imageUrl: { type: "STRING", description: "Updated image URL" }
      },
      required: ["categoryId"]
    }
  },
  {
    name: "listSubcategories",
    description: "List all existing product subcategories along with their parent categories.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },
  {
    name: "createSubcategory",
    description: "Create a new subcategory inside a parent category.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", description: "Subcategory name" },
        categoryName: { type: "STRING", description: "Parent category name" },
        description: { type: "STRING" },
        imageUrl: { type: "STRING" }
      },
      required: ["name", "categoryName"]
    }
  },
  {
    name: "editSubcategory",
    description: "Modify an existing subcategory's properties.",
    parameters: {
      type: "OBJECT",
      properties: {
        subcategoryId: { type: "STRING", description: "Subcategory ID" },
        name: { type: "STRING" },
        categoryName: { type: "STRING", description: "Parent category name" },
        description: { type: "STRING" },
        imageUrl: { type: "STRING" }
      },
      required: ["subcategoryId"]
    }
  },
  {
    name: "listBannerCampaigns",
    description: "List all sliding home banner campaigns in the store.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },
  {
    name: "createBannerCampaign",
    description: "Create a new sliding banner campaign with slides.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", description: "Campaign name" },
        description: { type: "STRING" },
        isActive: { type: "BOOLEAN" },
        slides: {
          type: "ARRAY",
          description: "List of banner slides",
          items: {
            type: "OBJECT",
            properties: {
              image: { type: "STRING", description: "Image URL for slide" },
              link: { type: "STRING", description: "Redirect link" },
              title: { type: "STRING" },
              subtitle: { type: "STRING" }
            },
            required: ["image", "link"]
          }
        }
      },
      required: ["name"]
    }
  },
  {
    name: "editBannerCampaign",
    description: "Update an existing banner campaign's slides or activation status.",
    parameters: {
      type: "OBJECT",
      properties: {
        campaignId: { type: "STRING", description: "Banner campaign ID" },
        name: { type: "STRING" },
        description: { type: "STRING" },
        isActive: { type: "BOOLEAN" },
        slides: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              image: { type: "STRING" },
              link: { type: "STRING" },
              title: { type: "STRING" },
              subtitle: { type: "STRING" }
            },
            required: ["image", "link"]
          }
        }
      },
      required: ["campaignId"]
    }
  },
  {
    name: "listFlashSales",
    description: "List all flash sale campaigns in the store database.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },
  {
    name: "createFlashSaleCampaign",
    description: "Create a new flash sale campaign.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING" },
        description: { type: "STRING" },
        discount: { type: "NUMBER", description: "Discount percentage (e.g. 20 for 20%)" },
        productIds: { type: "ARRAY", items: { type: "STRING" }, description: "IDs of products in flash sale" },
        startDate: { type: "STRING", description: "Start Date ISO string" },
        endDate: { type: "STRING", description: "End Date ISO string" },
        isActive: { type: "BOOLEAN" },
        bannerImage: { type: "STRING" },
        startImmediately: { type: "BOOLEAN" }
      },
      required: ["name", "discount", "productIds", "startDate", "endDate"]
    }
  },
  {
    name: "editFlashSaleCampaign",
    description: "Edit properties of an existing flash sale campaign.",
    parameters: {
      type: "OBJECT",
      properties: {
        campaignId: { type: "STRING" },
        name: { type: "STRING" },
        description: { type: "STRING" },
        discount: { type: "NUMBER" },
        productIds: { type: "ARRAY", items: { type: "STRING" } },
        startDate: { type: "STRING" },
        endDate: { type: "STRING" },
        isActive: { type: "BOOLEAN" },
        bannerImage: { type: "STRING" }
      },
      required: ["campaignId"]
    }
  },
  {
    name: "editCoupon",
    description: "Update fields of a coupon by ID or by matching its code.",
    parameters: {
      type: "OBJECT",
      properties: {
        couponId: { type: "STRING", description: "Optional coupon ID" },
        code: { type: "STRING", description: "Coupon code (e.g. FLASH15)" },
        discountType: { type: "STRING", description: "'percentage' or 'fixed'" },
        discountValue: { type: "NUMBER" },
        usageLimit: { type: "INTEGER" },
        daysValid: { type: "INTEGER" },
        isActive: { type: "BOOLEAN" }
      }
    }
  },
  {
    name: "listBlogs",
    description: "List all blog articles available in the store database.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },
  {
    name: "editBlog",
    description: "Update an existing blog article's content, title, category, image, or status.",
    parameters: {
      type: "OBJECT",
      properties: {
        blogId: { type: "STRING" },
        title: { type: "STRING" },
        content: { type: "STRING" },
        category: { type: "STRING" },
        imageUrl: { type: "STRING" },
        status: { type: "STRING", description: "'DRAFT' or 'PUBLISHED'" }
      },
      required: ["blogId"]
    }
  }
];



const toolPermissions = {
  searchProducts: "products:view",
  updateProductStock: "products:update",
  getRecentOrders: "orders:view",
  createProduct: "products:create",
  updateProductSeo: "products:update",
  updateOrderStatus: "orders:update",
  createCoupon: "coupons:create",
  toggleFlashSale: "flash-sales:update",
  searchCustomer: "users:view",
  toggleUserStatus: "users:update",
  createBlogDraft: "blogs:create",
  createCategory: "categories:create",
  createOrder: "orders:create",
  updateOrder: "orders:update",
  getOrderDetails: "orders:view",
  listOrders: "orders:view",
  syncOrderToPathao: "orders:update",
  editProduct: "products:update",
  updateProductSettings: "products:update",
  editCategory: "categories:update",
  createSubcategory: "categories:create",
  editSubcategory: "categories:update",
  createBannerCampaign: "banner-campaigns:create",
  editBannerCampaign: "banner-campaigns:update",
  createFlashSaleCampaign: "flash-sales:create",
  editFlashSaleCampaign: "flash-sales:update",
  editCoupon: "coupons:update",
  editBlog: "blogs:update",
  listCategories: "categories:view",
  listSubcategories: "categories:view",
  listCoupons: "coupons:view",
  listBlogs: "blogs:view",
  listUsers: "users:view",
  listFlashSales: "flash-sales:view",
  listBannerCampaigns: "banner-campaigns:view",
  getDashboardSummary: "dashboard:view"
};

const hasToolPermission = (user, requiredPermission) => {
  if (!user) return true;
  if (!user.role) return false;
  if (user.role.name === "superadmin" || user.role.permissions?.includes("all")) {
    return true;
  }
  return user.role.permissions?.includes(requiredPermission) || false;
};

export const handleAdminAiChat = asyncHandler(async (req, res) => {
  const { messages, sessionId } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({
      success: false,
      message: "A list of messages is required."
    });
  }

  const apiKey = await getApiKey();
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: "GEMINI_API_KEY is not configured on the server. Please add it to your Settings or environment variables."
    });
  }

  // Format incoming messages into Gemini contents structure with vision support
  // Limit to the most recent conversation turns (up to 15) to maintain context without exceeding payload limits
  const recentMessages = messages.slice(-15);
  const contents = [];
  for (const msg of recentMessages) {
    const textContent = msg.content + (msg.image ? `\n\n[Uploaded Image URL: ${msg.image}]` : "");
    const parts = [{ text: textContent }];
    if (msg.image) {
      try {
        let buffer;
        let mimeType = "image/jpeg"; // default

        if (msg.image.startsWith("data:")) {
          const match = msg.image.match(/^data:([^;]+);base64,(.*)$/);
          if (match) {
            mimeType = match[1];
            buffer = Buffer.from(match[2], 'base64');
          }
        } else if (msg.image.startsWith("/") || msg.image.startsWith("uploads/") || msg.image.startsWith("backend/uploads/")) {
          const relativePath = msg.image.startsWith("/") ? msg.image.substring(1) : msg.image;
          const fullPath = path.join(process.cwd(), relativePath);
          buffer = await fs.readFile(fullPath);
          const ext = path.extname(fullPath).toLowerCase();
          if (ext === ".png") mimeType = "image/png";
          else if (ext === ".webp") mimeType = "image/webp";
          else if (ext === ".gif") mimeType = "image/gif";
        } else {
          const imgResponse = await axios.get(msg.image, { responseType: 'arraybuffer' });
          buffer = Buffer.from(imgResponse.data);
          mimeType = imgResponse.headers['content-type'] || "image/jpeg";
        }

        if (buffer) {
          parts.push({
            inlineData: {
              mimeType: mimeType,
              data: buffer.toString("base64")
            }
          });
        }
      } catch (err) {
        console.error("Failed to load image for Gemini vision processing:", err.message);
      }
    }

    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts
    });
  }

  // Ensure Gemini payload begins with a 'user' turn as required by Gemini API
  const firstUserIdx = contents.findIndex(c => c.role === "user");
  if (firstUserIdx > 0) {
    contents.splice(0, firstUserIdx);
  }

  // Helper: call Gemini API with retry + model fallback
  const MODELS = ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];
  const MAX_RETRIES = 2;

  const callGeminiWithRetry = async (payload) => {
    let lastError = null;
    for (const model of MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const response = await axios.post(url, payload, { timeout: 25000 });
          return response;
        } catch (err) {
          lastError = err;
          const status = err.response?.status;

          // 429 = rate limit — wait short delay (2s, 4s) to avoid request timeouts
          if (status === 429 && attempt < MAX_RETRIES) {
            const delay = 2000 * attempt;
            console.warn(`⏳ Rate limited (429) on ${model}, waiting ${delay / 1000}s before retry (attempt ${attempt}/${MAX_RETRIES})...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          if (status === 429) {
            // Rate limit retries exhausted for this model — fall back immediately to next model
            console.warn(` Model ${model} rate limited (429). Trying next model...`);
            break;
          }

          // Other transient errors (500, 502, 503, 504) — short backoff, then try next model
          if ([500, 502, 503, 504].includes(status) && attempt < MAX_RETRIES) {
            const delay = 1000 * attempt;
            console.warn(`⏳ Gemini ${model} returned ${status}, retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          // Non-retryable error or max retries exhausted — try next model
          break;
        }
      }
    }
    // All models and retries exhausted
    throw lastError;
  };

  try {
    let keepLooping = true;
    let iterations = 0;
    const maxIterations = 5; // Prevent infinite loops
    let finalResponseText = "";
    let toolExecutionLog = [];

    while (keepLooping && iterations < maxIterations) {
      iterations++;

      const payload = {
        contents,
        tools: [{ functionDeclarations: toolDeclarations }],
        systemInstruction: {
          parts: [{
            text: "You are Command AI, a helpful administrator assistant. You have tools to query and manage the e-commerce database. ALWAYS query listCategories() to find out what categories exist in the store before telling the user a category does not exist, or when you are creating a product and need to match a categoryName. Do not assume categories."
          }]
        }
      };

      const response = await callGeminiWithRetry(payload);
      const candidate = response?.data?.candidates?.[0];
      const parts = candidate?.content?.parts;

      if (!parts) {
        throw new Error("No parts returned from Gemini API");
      }

      // Find any tool calls requested by Gemini
      const functionCalls = parts.filter(part => part.functionCall);

      if (functionCalls.length > 0) {
        // Gemini wants to run one or more functions
        const modelContent = {
          role: "model",
          parts: functionCalls
        };
        contents.push(modelContent);

        const responseParts = [];
        for (const call of functionCalls) {
          const { name, args } = call.functionCall;
          const toolFn = localTools[name];

          let result;
          if (toolFn) {
            const requiredPerm = toolPermissions[name];
            if (requiredPerm && !hasToolPermission(req.user, requiredPerm)) {
              result = { success: false, error: `Access denied. You do not have permission (${requiredPerm}) to execute this action.` };
              toolExecutionLog.push({ name, args, status: "denied", result });
            } else {
              toolExecutionLog.push({ name, args, status: "executing" });
              result = await toolFn(args, req.user);
              toolExecutionLog.push({ name, args, status: "completed", result });
            }
          } else {
            result = { error: `Tool ${name} not found` };
          }

          responseParts.push({
            functionResponse: {
              name,
              response: { result }
            }
          });
        }

        // Push the tool results back into the conversation history
        contents.push({
          role: "user",
          parts: responseParts
        });

      } else {
        // No function calls, we received the final text reply
        finalResponseText = parts.map(p => p.text).join("\n");
        keepLooping = false;
      }
    }

    // Persist conversation history to database for the authenticated admin
    let targetSession = null;
    if (req.user?._id) {
      try {
        const lastUserMsg = messages[messages.length - 1];

        // Find or create session
        if (sessionId) {
          targetSession = await AdminAiSession.findOne({ _id: sessionId, user: req.user._id });
        }

        if (!targetSession) {
          // Generate an initial title based on user query
          let autoTitle = "New Chat";
          if (lastUserMsg && lastUserMsg.content) {
            autoTitle = lastUserMsg.content.trim().slice(0, 36);
            if (lastUserMsg.content.trim().length > 36) autoTitle += "...";
          }
          targetSession = await AdminAiSession.create({
            user: req.user._id,
            title: autoTitle,
            lastMessage: (finalResponseText || "").slice(0, 100),
          });
        } else {
          // If session is still titled "New Chat", give it a meaningful title from prompt
          if (targetSession.title === "New Chat" && lastUserMsg && lastUserMsg.content) {
            let autoTitle = lastUserMsg.content.trim().slice(0, 36);
            if (lastUserMsg.content.trim().length > 36) autoTitle += "...";
            targetSession.title = autoTitle;
          }
          targetSession.lastMessage = (finalResponseText || "").slice(0, 100);
          await targetSession.save();
        }

        if (lastUserMsg && lastUserMsg.role === "user") {
          await AdminAiMessage.create({
            session: targetSession._id,
            user: req.user._id,
            role: "user",
            content: lastUserMsg.content || "",
            image: lastUserMsg.image || null,
          });
        }

        await AdminAiMessage.create({
          session: targetSession._id,
          user: req.user._id,
          role: "model",
          content: finalResponseText,
          toolExecutions: toolExecutionLog || [],
        });

        if (toolExecutionLog && toolExecutionLog.length > 0) {
          const toolNames = toolExecutionLog.map((t) => t.tool).join(", ");
          auditLogService.recordLog({
            req,
            user: req.user,
            action: "SYSTEM",
            module: "Chat",
            resourceId: targetSession?._id,
            resourceName: targetSession?.title,
            description: `Admin executed AI Assistant store tools: [${toolNames}]`,
            details: { tools: toolExecutionLog },
            status: "SUCCESS",
          });
        }
      } catch (saveErr) {
        console.error("Failed to persist Admin AI chat history:", saveErr.message);
      }
    }

    res.json({
      success: true,
      reply: finalResponseText,
      toolExecutions: toolExecutionLog,
      sessionId: targetSession ? targetSession._id : null,
      sessionTitle: targetSession ? targetSession.title : "New Chat",
    });

  } catch (err) {
    console.error(" Gemini AI Admin Chat error:", err.message);
    const status = err.response?.status;
    const isQuotaError = err.response?.data?.error?.message?.includes("quota") ||
      err.message?.includes("429") ||
      status === 429;
    const is503 = status === 503;
    let errMsg;
    if (isQuotaError) {
      errMsg = "Gemini API Quota Exceeded (429). You are on the free tier limit (15 RPM). Please wait a minute before retrying, or configure a premium/higher-limit API key.";
    } else if (is503) {
      errMsg = "Gemini API is temporarily unavailable (503). The service may be experiencing high demand. Please try again in a few seconds.";
    } else {
      errMsg = `Failed to communicate with AI Assistant: ${err.response?.data?.error?.message || err.message}`;
    }
    res.status(status || 500).json({
      success: false,
      message: errMsg
    });
  }
});

export const handleAdminAiChatUndo = asyncHandler(async (req, res) => {
  const { tool, args } = req.body;
  if (!tool || !args) {
    return res.status(400).json({ success: false, message: "Tool and arguments are required." });
  }

  const toolFn = localTools[tool];
  if (!toolFn) {
    return res.status(404).json({ success: false, message: `Tool ${tool} not found.` });
  }

  const requiredPerm = toolPermissions[tool];
  if (requiredPerm && !hasToolPermission(req.user, requiredPerm)) {
    return res.status(403).json({ success: false, message: `Access denied. You do not have permission (${requiredPerm}) to revert this action.` });
  }

  try {
    const result = await toolFn(args, req.user);
    return res.json({ success: true, result });
  } catch (err) {
    console.error(" Failed to undo action:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

export const getAdminAiChatSessions = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const sessions = await AdminAiSession.find({ user: userId })
    .sort({ updatedAt: -1 })
    .lean();

  res.json({
    success: true,
    sessions: sessions.map(s => ({
      id: s._id,
      title: s.title || "New Chat",
      lastMessage: s.lastMessage || "",
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }))
  });
});

export const createAdminAiChatSession = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const { title } = req.body;
  const session = await AdminAiSession.create({
    user: userId,
    title: title?.trim() || "New Chat",
  });

  res.status(201).json({
    success: true,
    session: {
      id: session._id,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }
  });
});

export const getAdminAiChatSessionMessages = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { sessionId } = req.params;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const session = await AdminAiSession.findOne({ _id: sessionId, user: userId }).lean();
  if (!session) {
    return res.status(404).json({ success: false, message: "Chat session not found" });
  }

  const messages = await AdminAiMessage.find({ session: sessionId, user: userId })
    .sort({ createdAt: 1 })
    .limit(200)
    .lean();

  res.json({
    success: true,
    session: {
      id: session._id,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    },
    messages: messages.map(m => ({
      id: m._id,
      role: m.role,
      content: m.content,
      image: m.image || null,
      toolExecutions: m.toolExecutions || [],
      createdAt: m.createdAt,
    }))
  });
});

export const deleteAdminAiChatSession = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { sessionId } = req.params;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const session = await AdminAiSession.findOneAndDelete({ _id: sessionId, user: userId });
  if (!session) {
    return res.status(404).json({ success: false, message: "Session not found" });
  }

  await AdminAiMessage.deleteMany({ session: sessionId, user: userId });

  res.json({
    success: true,
    message: "Session and conversation deleted successfully."
  });
});

export const renameAdminAiChatSession = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { sessionId } = req.params;
  const { title } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  if (!title?.trim()) {
    return res.status(400).json({ success: false, message: "Title is required" });
  }

  const session = await AdminAiSession.findOneAndUpdate(
    { _id: sessionId, user: userId },
    { title: title.trim() },
    { new: true }
  );
  if (!session) {
    return res.status(404).json({ success: false, message: "Session not found" });
  }

  res.json({
    success: true,
    session: {
      id: session._id,
      title: session.title,
    }
  });
});

export const getAdminAiChatHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const messages = await AdminAiMessage.find({ user: userId })
    .sort({ createdAt: 1 })
    .limit(200)
    .lean();

  res.json({
    success: true,
    messages: messages.map((m) => ({
      id: m._id,
      role: m.role,
      content: m.content,
      image: m.image || null,
      toolExecutions: m.toolExecutions || [],
      createdAt: m.createdAt,
    })),
  });
});

export const clearAdminAiChatHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  await AdminAiMessage.deleteMany({ user: userId });
  await AdminAiSession.deleteMany({ user: userId });

  res.json({
    success: true,
    message: "Chat history cleared successfully.",
  });
});



