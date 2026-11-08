"use client";

import { AdminCard, AdminCardContent } from "@/app/admin/_components/AdminCard";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, Package, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Price } from "@/components/common/Price";

export function StatsCards({ revenue, customers, inventory, recentOrdersCount, isLoading }) {
  const stats = [
    {
      label: "Total Sales",
      value: revenue ? <Price amount={revenue.total} /> : null,
      icon: <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/50 dark:border-emerald-800/40",
      description: "Total revenue this year",
    },
    {
      label: "Sales Forecast",
      value: revenue?.forecast ? <Price amount={revenue.forecast} /> : <Price amount={0} />,
      icon: <TrendingUp className="size-4 text-blue-600 dark:text-blue-400" />,
      iconBg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200/50 dark:border-blue-800/40",
      description: "Predicted month-end revenue",
    },
    {
      label: "Retention Rate",
      value: `${customers?.retentionRate || 0}%`,
      icon: <Users className="size-4 text-purple-600 dark:text-purple-400" />,
      iconBg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200/50 dark:border-purple-800/40",
      description: "Returning customers rate",
    },
    {
      label: "Total Products",
      value: inventory?.totalProducts?.toLocaleString() || "0",
      icon: <Package className="size-4 text-amber-600 dark:text-amber-400" />,
      iconBg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200/50 dark:border-amber-800/40",
      description: "Active catalog items",
    },
    {
      label: "Total Orders",
      value: (recentOrdersCount || 0).toLocaleString(),
      icon: <ShoppingCart className="size-4 text-primary" />,
      iconBg: "bg-primary/10 border-primary/20",
      description: "Completed & COD orders",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, i) => (
        <AdminCard key={i} className="transition-all hover:shadow-md">
          <AdminCardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </span>
              <div className={cn("size-8 rounded-lg flex items-center justify-center border", stat.iconBg)}>
                {stat.icon}
              </div>
            </div>
            <div className="mt-3">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-7 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold tracking-normal text-foreground tabular-nums font-price">
                    {stat.value || "0"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </>
              )}
            </div>
          </AdminCardContent>
        </AdminCard>
      ))}
    </div>
  );
}
