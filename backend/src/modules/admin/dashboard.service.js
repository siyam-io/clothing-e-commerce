import { DashboardRepository } from "./dashboard.repository.js";

/**
 * Service managing analytics calculations, forecasting, and dashboard aggregations.
 */
export class DashboardService {
  /**
   * @param {Object} [dependencies]
   * @param {DashboardRepository} [dependencies.repository]
   */
  constructor(dependencies = {}) {
    this.repository = dependencies.repository || new DashboardRepository();
  }

  /**
   * Resolve boundary dates and date formatting for trend aggregations.
   */
  resolveDateRange(year, month) {
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const targetMonth = month && month !== "all" ? parseInt(month, 10) : null;

    if (targetMonth) {
      return {
        targetYear,
        targetMonth,
        startDate: new Date(targetYear, targetMonth - 1, 1),
        endDate: new Date(targetYear, targetMonth, 0, 23, 59, 59, 999),
        groupByFormat: "%Y-%m-%d",
      };
    }

    return {
      targetYear,
      targetMonth: null,
      startDate: new Date(targetYear, 0, 1),
      endDate: new Date(targetYear, 11, 31, 23, 59, 59, 999),
      groupByFormat: "%Y-%m",
    };
  }

  /**
   * Calculate linear projected revenue for the current active month.
   */
  calculateRevenueForecast(monthlyTrend = [], targetYear, targetMonth) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (targetYear !== currentYear || targetMonth !== currentMonth) {
      return 0;
    }

    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    const currentDay = Math.max(1, now.getDate());
    const revenueSoFar = monthlyTrend.reduce((acc, curr) => acc + (curr.revenue || 0), 0);

    return Math.round((revenueSoFar / currentDay) * daysInMonth);
  }

  /**
   * Compute percentage of customers who placed more than one order.
   */
  calculateRetentionRate(retentionStats) {
    const stats = retentionStats?.[0];
    if (!stats || !stats.totalCustomers) {
      return 0;
    }
    return Math.round((stats.repeatCustomers / stats.totalCustomers) * 100);
  }

  /**
   * Aggregate complete dashboard metrics payload.
   */
  async getDashboardOverview({ year, month }) {
    const range = this.resolveDateRange(year, month);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [stats, inventoryStats, categoryStats, enrichedOrders, roleId] = await Promise.all([
      this.repository.getOrderAnalyticalFacets({ ...range, today }),
      this.repository.getInventoryAlerts(),
      this.repository.getCategoryDistribution(),
      this.repository.getEnrichedRecentOrders(5),
      this.repository.getCustomerRoleId(),
    ]);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const [userGrowth, recentCustomers, customerCounts] = await Promise.all([
      this.repository.getCustomerGrowth(roleId, range.startDate, range.endDate, range.groupByFormat),
      this.repository.getRecentCustomers(roleId, 5),
      this.repository.getCustomerSummaryCounts(roleId, monthStart),
    ]);

    const forecast = this.calculateRevenueForecast(stats.monthlyTrend, range.targetYear, range.targetMonth);
    const retentionRate = this.calculateRetentionRate(stats.retentionStats);

    return {
      revenue: {
        total: stats.totalStats?.[0]?.revenue || 0,
        avgOrder: stats.totalStats?.[0]?.avgTicketSize || 0,
        today: stats.todayStats?.[0]?.revenue || 0,
        trend: stats.monthlyTrend || [],
        forecast,
      },
      inventory: {
        totalProducts: inventoryStats.totalProducts || 0,
        outOfStock: inventoryStats.outOfStockCount || 0,
        criticalItems: inventoryStats.criticalItems?.slice(0, 5) || [],
      },
      analytics: {
        mostSoldCategories: stats.soldCategories || [],
        retentionRate,
      },
      categories: categoryStats,
      customers: {
        total: customerCounts.total,
        newThisMonth: customerCounts.newThisMonth,
        growth: userGrowth,
        recent: recentCustomers,
      },
      recentOrders: enrichedOrders,
    };
  }

  /**
   * Retrieve high-level executive dashboard counters.
   */
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    const range = {
      startDate: new Date(currentYear, 0, 1),
      endDate: new Date(currentYear, 11, 31, 23, 59, 59, 999),
      groupByFormat: "%Y-%m",
      today,
    };

    const [stats, inventory, roleId] = await Promise.all([
      this.repository.getOrderAnalyticalFacets(range),
      this.repository.getInventoryAlerts(),
      this.repository.getCustomerRoleId(),
    ]);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const customerCounts = await this.repository.getCustomerSummaryCounts(roleId, monthStart);

    const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
    const monthRecord = stats.monthlyTrend?.find((t) => t._id === currentMonthStr);
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const currentDay = Math.max(1, today.getDate());
    const revenueForecast = Math.round(((monthRecord?.revenue || 0) / currentDay) * daysInMonth);

    return {
      revenue: {
        total: stats.totalStats?.[0]?.revenue || 0,
        avgOrder: stats.totalStats?.[0]?.avgTicketSize || 0,
        today: stats.todayStats?.[0]?.revenue || 0,
        forecast: revenueForecast,
      },
      inventory: {
        totalProducts: inventory.totalProducts || 0,
        outOfStock: inventory.outOfStockCount || 0,
      },
      customers: customerCounts,
    };
  }

  /**
   * System-wide document count summary.
   */
  async getSystemCounts() {
    return this.repository.getSystemCounts();
  }

  /**
   * Recent orders list with customer names and photos.
   */
  async getRecentOrders(limit = 5) {
    return this.repository.getEnrichedRecentOrders(limit);
  }

  /**
   * Products approaching depletion.
   */
  async getInventoryAlerts() {
    const stats = await this.repository.getInventoryAlerts();
    return { criticalItems: stats.criticalItems?.slice(0, 5) || [] };
  }

  /**
   * Historical revenue trend points.
   */
  async getRevenueTrend({ year, month }) {
    const range = this.resolveDateRange(year, month);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const facets = await this.repository.getOrderAnalyticalFacets({ ...range, today });
    return facets.monthlyTrend || [];
  }

  /**
   * Category metrics and top performing departments.
   */
  async getCategoryStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const range = this.resolveDateRange();

    const [categories, facets] = await Promise.all([
      this.repository.getCategoryDistribution(),
      this.repository.getOrderAnalyticalFacets({ ...range, today }),
    ]);

    return {
      categories,
      mostSoldCategories: facets.soldCategories || [],
    };
  }

  /**
   * Customer acquisition trend.
   */
  async getCustomerGrowth({ year, month }) {
    const range = this.resolveDateRange(year, month);
    const roleId = await this.repository.getCustomerRoleId();

    const [growth, recent] = await Promise.all([
      this.repository.getCustomerGrowth(roleId, range.startDate, range.endDate, range.groupByFormat),
      this.repository.getRecentCustomers(roleId, 5),
    ]);

    return { growth, recent };
  }

  /**
   * Calculate customer repeat purchase retention metric.
   */
  async getRetentionRate() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const range = this.resolveDateRange();
    const facets = await this.repository.getOrderAnalyticalFacets({ ...range, today });

    return { retentionRate: this.calculateRetentionRate(facets.retentionStats) };
  }
}

export default new DashboardService();

