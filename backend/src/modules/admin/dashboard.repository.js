import Order from "../order/order.model.js";
import Product from "../product/product.model.js";
import User from "../user/user.model.js";
import Role from "../role/role.model.js";
import Category from "../category/category.model.js";
import BannerCampaign from "../bannerCampaign/bannerCampaign.model.js";
import FlashSale from "../flashSale/flashSale.model.js";
import Coupon from "../coupon/coupon.model.js";
import Blog from "../blog/blog.model.js";

/**
 * Data access repository encapsulating analytical aggregations for the admin dashboard.
 */
export class DashboardRepository {
  /**
   * @param {Object} [models]
   */
  constructor(models = {}) {
    this.orderModel = models.orderModel || Order;
    this.productModel = models.productModel || Product;
    this.userModel = models.userModel || User;
    this.roleModel = models.roleModel || Role;
    this.categoryModel = models.categoryModel || Category;
    this.bannerModel = models.bannerModel || BannerCampaign;
    this.flashSaleModel = models.flashSaleModel || FlashSale;
    this.couponModel = models.couponModel || Coupon;
    this.blogModel = models.blogModel || Blog;
  }

  /**
   * Fetch primary analytical facets over orders collection.
   */
  async getOrderAnalyticalFacets({ startDate, endDate, groupByFormat, today }) {
    const pipeline = [
      {
        $facet: {
          totalStats: [
            { $match: { "paymentResult.status": { $in: ["Completed", "COD"] } } },
            {
              $group: {
                _id: null,
                revenue: { $sum: { $toDouble: "$totalPrice" } },
                count: { $sum: 1 },
                avgTicketSize: { $avg: { $toDouble: "$totalPrice" } },
              },
            },
          ],
          todayStats: [
            { $addFields: { convertedDate: { $toDate: "$createdAt" } } },
            {
              $match: {
                convertedDate: { $gte: today },
                "paymentResult.status": { $in: ["Completed", "COD"] },
              },
            },
            {
              $group: {
                _id: null,
                revenue: { $sum: { $toDouble: "$totalPrice" } },
                count: { $sum: 1 },
              },
            },
          ],
          monthlyTrend: [
            { $addFields: { convertedDate: { $toDate: "$createdAt" } } },
            {
              $match: {
                convertedDate: { $gte: startDate, $lte: endDate },
                "paymentResult.status": { $in: ["Completed", "COD"] },
              },
            },
            {
              $group: {
                _id: { $dateToString: { format: groupByFormat, date: "$convertedDate" } },
                revenue: { $sum: { $toDouble: "$totalPrice" } },
                orderCount: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          retentionStats: [
            { $match: { user: { $exists: true, $ne: null } } },
            { $group: { _id: "$user", orderCount: { $sum: 1 } } },
            {
              $group: {
                _id: null,
                totalCustomers: { $sum: 1 },
                repeatCustomers: { $sum: { $cond: [{ $gt: ["$orderCount", 1] }, 1, 0] } },
              },
            },
          ],
          soldCategories: [
            { $match: { "paymentResult.status": { $in: ["Completed", "COD"] } } },
            { $unwind: "$orderItems" },
            {
              $lookup: {
                from: "products",
                localField: "orderItems.product",
                foreignField: "_id",
                as: "product",
              },
            },
            { $unwind: "$product" },
            {
              $group: {
                _id: "$product.category",
                sales: { $sum: "$orderItems.quantity" },
                revenue: {
                  $sum: { $multiply: ["$orderItems.quantity", "$orderItems.price"] },
                },
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "_id",
                foreignField: "_id",
                as: "cat",
              },
            },
            { $unwind: "$cat" },
            { $project: { name: "$cat.name", sales: 1, revenue: 1 } },
            { $sort: { sales: -1 } },
            { $limit: 5 },
          ],
        },
      },
    ];

    const results = await this.orderModel.aggregate(pipeline, { allowDiskUse: true });
    return results[0] || {};
  }

  /**
   * Aggregate stock levels and inventory deficit counts.
   */
  async getInventoryAlerts() {
    const results = await this.productModel.aggregate([
      { $project: { name: 1, totalStock: { $sum: "$sizes.stock" } } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          outOfStockCount: { $sum: { $cond: [{ $eq: ["$totalStock", 0] }, 1, 0] } },
          lowStockCount: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ["$totalStock", 0] }, { $lt: ["$totalStock", 10] }] },
                1,
                0,
              ],
            },
          },
          criticalItems: {
            $push: {
              $cond: [
                { $lt: ["$totalStock", 10] },
                {
                  name: "$name",
                  stock: "$totalStock",
                  status: { $cond: [{ $eq: ["$totalStock", 0] }, "OUT", "LOW"] },
                },
                "$$REMOVE",
              ],
            },
          },
        },
      },
    ]);

    return results[0] || { totalProducts: 0, outOfStockCount: 0, criticalItems: [] };
  }

  /**
   * Aggregate product catalog distribution across categories.
   */
  async getCategoryDistribution() {
    return this.productModel.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "catInfo",
        },
      },
      { $unwind: { path: "$catInfo", preserveNullAndEmptyArrays: true } },
      { $project: { name: { $ifNull: ["$catInfo.name", "Uncategorized"] }, count: 1 } },
    ]);
  }

  /**
   * Retrieve recent orders enriched with user identity details.
   */
  async getEnrichedRecentOrders(limit = 5) {
    const rawOrders = await this.orderModel.find({}).sort("-createdAt").limit(limit).lean();
    const userIds = rawOrders.map((o) => o.user).filter(Boolean);
    const users = await this.userModel
      .find({ _id: { $in: userIds } })
      .select("name email avatar")
      .lean();

    const userMap = users.reduce((acc, u) => {
      acc[String(u._id)] = u;
      return acc;
    }, {});

    return rawOrders.map((order) => ({
      ...order,
      user: order.user ? userMap[String(order.user)] : { name: order.shippingAddress?.name || "Guest User" },
    }));
  }

  /**
   * Resolve customer role ID.
   */
  async getCustomerRoleId() {
    const customerRole = await this.roleModel.findOne({ name: "customer" }).lean();
    return customerRole ? customerRole._id : null;
  }

  /**
   * Aggregate customer registration velocity over timeframe.
   */
  async getCustomerGrowth(roleId, startDate, endDate, groupByFormat) {
    return this.userModel.aggregate([
      {
        $match: {
          role: roleId,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: groupByFormat, date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  /**
   * Retrieve recent customer signups.
   */
  async getRecentCustomers(roleId, limit = 5) {
    return this.userModel
      .find({ role: roleId })
      .sort("-createdAt")
      .limit(limit)
      .select("name email avatar createdAt")
      .lean();
  }

  /**
   * Retrieve overall entity document counts across the system.
   */
  async getSystemCounts() {
    const [
      orders,
      products,
      categories,
      banners,
      flashSales,
      coupons,
      blogs,
      users,
    ] = await Promise.all([
      this.orderModel.countDocuments(),
      this.productModel.countDocuments(),
      this.categoryModel.countDocuments(),
      this.bannerModel.countDocuments(),
      this.flashSaleModel.countDocuments(),
      this.couponModel.countDocuments(),
      this.blogModel.countDocuments(),
      this.userModel.countDocuments(),
    ]);

    return { orders, products, categories, banners, flashSales, coupons, blogs, users };
  }

  /**
   * Count customers in total and registered this calendar month.
   */
  async getCustomerSummaryCounts(roleId, monthStart) {
    const [total, newThisMonth] = await Promise.all([
      this.userModel.countDocuments({ role: roleId }),
      this.userModel.countDocuments({ role: roleId, createdAt: { $gte: monthStart } }),
    ]);
    return { total, newThisMonth };
  }
}

export default new DashboardRepository();

