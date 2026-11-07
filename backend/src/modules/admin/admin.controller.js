import dashboardService from "./dashboard.service.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

/**
 * Controller handling executive administrative aggregations and analytical metrics.
 */
export class AdminController {
  /**
   * @param {import("./dashboard.service.js").DashboardService} [service]
   */
  constructor(service = dashboardService) {
    this.service = service;
  }

  /**
   * Get full dashboard analytical overview.
   */
  getDashboardData = asyncHandler(async (req, res) => {
    const { year, month } = req.query;
    const data = await this.service.getDashboardOverview({ year, month });
    res.status(200).json(data);
  });

  /**
   * Get system entity count counters.
   */
  getAdminCounts = asyncHandler(async (req, res) => {
    const counts = await this.service.getSystemCounts();
    res.status(200).json(counts);
  });

  /**
   * Get high-level summary cards.
   */
  getDashboardStats = asyncHandler(async (req, res) => {
    const stats = await this.service.getDashboardStats();
    res.status(200).json(stats);
  });

  /**
   * Get enriched recent customer orders.
   */
  getDashboardRecentOrders = asyncHandler(async (req, res) => {
    const orders = await this.service.getRecentOrders(5);
    res.status(200).json(orders);
  });

  /**
   * Get inventory stock threshold warnings.
   */
  getDashboardInventoryAlerts = asyncHandler(async (req, res) => {
    const alerts = await this.service.getInventoryAlerts();
    res.status(200).json(alerts);
  });

  /**
   * Get revenue trajectory points.
   */
  getDashboardRevenueTrend = asyncHandler(async (req, res) => {
    const { year, month } = req.query;
    const trend = await this.service.getRevenueTrend({ year, month });
    res.status(200).json(trend);
  });

  /**
   * Get category sales and catalog distribution.
   */
  getDashboardCategoryStats = asyncHandler(async (req, res) => {
    const stats = await this.service.getCategoryStats();
    res.status(200).json(stats);
  });

  /**
   * Get customer acquisition progression.
   */
  getDashboardCustomerGrowth = asyncHandler(async (req, res) => {
    const { year, month } = req.query;
    const growth = await this.service.getCustomerGrowth({ year, month });
    res.status(200).json(growth);
  });

  /**
   * Get customer repeat purchase retention rate.
   */
  getDashboardRetention = asyncHandler(async (req, res) => {
    const retention = await this.service.getRetentionRate();
    res.status(200).json(retention);
  });
}

const adminController = new AdminController();

export const getDashboardData = adminController.getDashboardData;
export const getAdminCounts = adminController.getAdminCounts;
export const getDashboardStats = adminController.getDashboardStats;
export const getDashboardRecentOrders = adminController.getDashboardRecentOrders;
export const getDashboardInventoryAlerts = adminController.getDashboardInventoryAlerts;
export const getDashboardRevenueTrend = adminController.getDashboardRevenueTrend;
export const getDashboardCategoryStats = adminController.getDashboardCategoryStats;
export const getDashboardCustomerGrowth = adminController.getDashboardCustomerGrowth;
export const getDashboardRetention = adminController.getDashboardRetention;

export default adminController;
