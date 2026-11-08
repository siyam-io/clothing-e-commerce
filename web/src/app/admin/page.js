"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { 
  useDashboardStats,
  useDashboardInventoryAlerts,
  useDashboardRevenueTrend,
  useDashboardCategoryStats,
  useDashboardCustomerGrowth,
  useDashboardRetention
} from "@/app/admin/_hooks/useAdminDashboard";
import { AdminHeader } from "@/app/admin/_components/dashboard/AdminHeader";
import { StatsCards } from "@/app/admin/_components/dashboard/StatsCards";
import { hasPermission } from "@/utils/rbacUtils";
import { useAuthStore } from "@/store/authStore";
import { getFirstAllowedRoute } from "@/utils/adminRoutes";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminPageContainer } from "@/app/admin/_components/AdminPageContainer";

// Dynamically import heavy components for better first load performance
const RevenueChart = dynamic(() => import("@/app/admin/_components/dashboard/RevenueChart").then(mod => mod.RevenueChart), {
  ssr: false,
  loading: () => <div className="min-h-[300px] md:min-h-[480px] w-full bg-card animate-pulse rounded-[3rem] border border-border" />
});

const CategoryPie = dynamic(() => import("@/app/admin/_components/dashboard/CategoryPie").then(mod => mod.CategoryPie), {
  ssr: false,
  loading: () => <div className="min-h-[300px] md:min-h-[400px] w-full bg-card animate-pulse rounded-[3rem] border border-border" />
});

const OperationsHub = dynamic(() => import("@/app/admin/_components/dashboard/OperationsHub").then(mod => mod.OperationsHub), {
  ssr: false,
  loading: () => <div className="min-h-[280px] w-full bg-card animate-pulse rounded-2xl border border-border" />
});

const InventoryAlerts = dynamic(() => import("@/app/admin/_components/dashboard/InventoryAlerts").then(mod => mod.InventoryAlerts), {
  ssr: false
});

const TopSellingCategories = dynamic(() => import("@/app/admin/_components/dashboard/TopSellingCategories").then(mod => mod.TopSellingCategories), {
  ssr: false
});

const UserGrowthChart = dynamic(() => import("@/app/admin/_components/dashboard/UserGrowthChart").then(mod => mod.UserGrowthChart), {
  ssr: false
});

const UsersTable = dynamic(() => import("@/app/admin/_components/dashboard/UsersTable").then(mod => mod.UsersTable), {
  ssr: false
});

export default function Dashboard() {
  const [revYear, setRevYear] = useState(new Date().getFullYear());
  const [revMonth, setRevMonth] = useState("all");
  
  const [userYear, setUserYear] = useState(new Date().getFullYear());
  const [userMonth, setUserMonth] = useState("all");

  // 🚀 Segmented parallel fetch calls for instant progressive rendering
  const { data: statsData, isLoading: statsLoading, isFetching: statsFetching } = useDashboardStats();
  const { data: inventoryAlertsData, isLoading: inventoryAlertsLoading } = useDashboardInventoryAlerts();
  const { data: trendData, isLoading: trendLoading, isFetching: trendFetching } = useDashboardRevenueTrend({ year: revYear, month: revMonth });
  const { data: categoryStatsData, isLoading: categoryStatsLoading, isFetching: categoryStatsFetching } = useDashboardCategoryStats();
  const { data: customerGrowthData, isLoading: customerGrowthLoading, isFetching: customerGrowthFetching } = useDashboardCustomerGrowth({ year: userYear, month: userMonth });
  const { data: retentionData, isLoading: retentionLoading } = useDashboardRetention();

  // Mapped formats for premium component compatibility
  const revenue = {
    today: statsData?.revenue?.today || 0,
    total: statsData?.revenue?.total || 0,
    avgOrder: statsData?.revenue?.avgOrder || 0,
    forecast: statsData?.revenue?.forecast || 0,
    trend: trendData || []
  };

  const inventory = {
    totalProducts: statsData?.inventory?.totalProducts || 0,
    outOfStock: statsData?.inventory?.outOfStock || 0,
    criticalItems: inventoryAlertsData?.criticalItems || []
  };

  const categories = categoryStatsData?.categories || [];
  const analytics = {
    mostSoldCategories: categoryStatsData?.mostSoldCategories || [],
    retentionRate: retentionData?.retentionRate || 0
  };

  const customers = {
    total: statsData?.customers?.total || 0,
    newThisMonth: statsData?.customers?.newThisMonth || 0,
    growth: customerGrowthData?.growth || [],
    recent: customerGrowthData?.recent || []
  };

  const { user } = useAuthStore();
  const router = useRouter();
  const canViewDashboard = hasPermission(user, ["dashboard:view", "reports:view", "all"]);

  useEffect(() => {
    if (!canViewDashboard) {
      const targetRoute = getFirstAllowedRoute(user, hasPermission);
      if (targetRoute && targetRoute !== "/admin") {
        router.replace(targetRoute);
      }
    }
  }, [canViewDashboard, user, router]);

  if (!canViewDashboard) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <AdminPageContainer className="space-y-6 pb-12">
      {/* 1. HEADER */}
      <AdminHeader 
        isFetching={statsFetching} 
        todayRevenue={revenue.today} 
        isLoading={statsLoading}
      />

      {/* 2. KPI GRID */}
      <StatsCards 
        revenue={revenue} 
        customers={{ ...customers, retentionRate: analytics.retentionRate }} 
        inventory={inventory} 
        recentOrdersCount={statsData?.revenue?.count || 0} 
        isLoading={statsLoading}
      />

      {/* 3. MAIN ANALYTICS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 min-h-[480px]">
          <RevenueChart 
            revenue={revenue}
            selectedYear={revYear}
            setSelectedYear={setRevYear}
            selectedMonth={revMonth}
            setSelectedMonth={setRevMonth}
            isFetching={trendFetching}
            isLoading={trendLoading}
          />
        </div>
        <div className="lg:col-span-1">
          <CategoryPie 
            categories={categories} 
            isFetching={categoryStatsFetching} 
            isLoading={categoryStatsLoading}
          />
        </div>
      </div>

      {/* 4. USER GROWTH & TOP CATEGORIES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <UserGrowthChart 
            data={customers.growth}
            selectedYear={userYear}
            setSelectedYear={setUserYear}
            selectedMonth={userMonth}
            setSelectedMonth={setUserMonth}
            isFetching={customerGrowthFetching}
            isLoading={customerGrowthLoading}
          />
        </div>
        <div className="lg:col-span-1">
          <TopSellingCategories 
            categories={analytics.mostSoldCategories} 
            isLoading={categoryStatsLoading}
          />
        </div>
      </div>

      {/* 5. DATA TABLES & OPERATIONS HUB */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <OperationsHub isLoading={statsLoading} />
        <UsersTable users={customers.recent} isLoading={customerGrowthLoading} />
      </div>

      {/* 6. INVENTORY ALERTS */}
      <InventoryAlerts inventory={inventory} isLoading={inventoryAlertsLoading} />
    </AdminPageContainer>
  );
}
