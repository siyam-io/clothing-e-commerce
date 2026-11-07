import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { DashboardService } from "../dashboard.service.js";

describe("DashboardService", () => {
  let dashboardService;
  let mockRepository;

  beforeEach(() => {
    mockRepository = {
      getOrderAnalyticalFacets: jest.fn(),
      getInventoryAlerts: jest.fn(),
      getCategoryDistribution: jest.fn(),
      getEnrichedRecentOrders: jest.fn(),
      getCustomerRoleId: jest.fn(),
      getCustomerGrowth: jest.fn(),
      getRecentCustomers: jest.fn(),
      getSystemCounts: jest.fn(),
      getCustomerSummaryCounts: jest.fn(),
    };

    dashboardService = new DashboardService({ repository: mockRepository });
  });

  describe("resolveDateRange", () => {
    it("should configure daily format when month is specified", () => {
      const range = dashboardService.resolveDateRange(2026, 5);

      expect(range.targetYear).toBe(2026);
      expect(range.targetMonth).toBe(5);
      expect(range.groupByFormat).toBe("%Y-%m-%d");
      expect(range.startDate.getMonth()).toBe(4); // 0-indexed May
      expect(range.startDate.getDate()).toBe(1);
    });

    it("should configure monthly format when month is omitted", () => {
      const range = dashboardService.resolveDateRange(2026, null);

      expect(range.targetYear).toBe(2026);
      expect(range.targetMonth).toBeNull();
      expect(range.groupByFormat).toBe("%Y-%m");
      expect(range.startDate.getMonth()).toBe(0);
      expect(range.endDate.getMonth()).toBe(11);
    });
  });

  describe("calculateRevenueForecast", () => {
    it("should return 0 when target month is not the current month", () => {
      const forecast = dashboardService.calculateRevenueForecast(
        [{ revenue: 10000 }],
        2020,
        1
      );
      expect(forecast).toBe(0);
    });

    it("should project monthly revenue when in current active month", () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const monthlyTrend = [{ revenue: 50000 }];
      const forecast = dashboardService.calculateRevenueForecast(
        monthlyTrend,
        currentYear,
        currentMonth
      );

      expect(forecast).toBeGreaterThan(0);
    });
  });

  describe("calculateRetentionRate", () => {
    it("should return 0 when customer total is 0 or absent", () => {
      expect(dashboardService.calculateRetentionRate([])).toBe(0);
      expect(
        dashboardService.calculateRetentionRate([{ totalCustomers: 0, repeatCustomers: 0 }])
      ).toBe(0);
    });

    it("should compute accurate percentage of repeat buyers", () => {
      const rate = dashboardService.calculateRetentionRate([
        { totalCustomers: 200, repeatCustomers: 50 },
      ]);
      expect(rate).toBe(25);
    });
  });

  describe("getDashboardOverview", () => {
    it("should aggregate all dashboard analytics facets", async () => {
      mockRepository.getOrderAnalyticalFacets.mockResolvedValue({
        totalStats: [{ revenue: 100000, avgTicketSize: 2000 }],
        todayStats: [{ revenue: 5000 }],
        monthlyTrend: [{ _id: "2026-05", revenue: 50000 }],
        retentionStats: [{ totalCustomers: 100, repeatCustomers: 20 }],
        soldCategories: [{ name: "Hoodies", sales: 15, revenue: 30000 }],
      });

      mockRepository.getInventoryAlerts.mockResolvedValue({
        totalProducts: 45,
        outOfStockCount: 2,
        criticalItems: [{ name: "Slim Jeans", stock: 1, status: "LOW" }],
      });

      mockRepository.getCategoryDistribution.mockResolvedValue([
        { name: "Shirts", count: 20 },
      ]);

      mockRepository.getEnrichedRecentOrders.mockResolvedValue([
        { _id: "ord-1", totalPrice: 3000 },
      ]);

      mockRepository.getCustomerRoleId.mockResolvedValue("role-cust-123");
      mockRepository.getCustomerGrowth.mockResolvedValue([{ _id: "2026-05", count: 10 }]);
      mockRepository.getRecentCustomers.mockResolvedValue([{ name: "Alice" }]);
      mockRepository.getCustomerSummaryCounts.mockResolvedValue({ total: 150, newThisMonth: 12 });

      const overview = await dashboardService.getDashboardOverview({ year: "2026", month: "5" });

      expect(overview.revenue.total).toBe(100000);
      expect(overview.inventory.totalProducts).toBe(45);
      expect(overview.analytics.retentionRate).toBe(20);
      expect(overview.customers.total).toBe(150);
      expect(overview.recentOrders.length).toBe(1);
    });
  });

  describe("getSystemCounts", () => {
    it("should retrieve system entity count summary", async () => {
      mockRepository.getSystemCounts.mockResolvedValue({
        orders: 120,
        products: 80,
        categories: 10,
        banners: 3,
        flashSales: 2,
        coupons: 5,
        blogs: 14,
        users: 350,
      });

      const counts = await dashboardService.getSystemCounts();
      expect(counts.orders).toBe(120);
      expect(counts.users).toBe(350);
    });
  });
});

