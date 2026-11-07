"use client";

import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from "@/app/admin/_components/AdminCard";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag } from "lucide-react";
import { Price } from "@/components/common/Price";

export function TopSellingCategories({ categories = [], isLoading }) {
  if (isLoading) {
    return (
      <AdminCard className="h-full">
        <AdminCardHeader className="pb-3">
          <Skeleton className="h-5 w-36" />
        </AdminCardHeader>
        <AdminCardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </AdminCardContent>
      </AdminCard>
    );
  }

  const maxSales = categories.length > 0 ? Math.max(...categories.map(c => c.sales)) : 0;

  return (
    <AdminCard className="h-full flex flex-col">
      <AdminCardHeader className="pb-3 flex flex-row items-center gap-2">
        <Tag className="size-4 text-primary" />
        <AdminCardTitle className="text-base font-semibold">
          Top Selling Categories
        </AdminCardTitle>
      </AdminCardHeader>
      <AdminCardContent className="space-y-5 flex-1 pt-1">
        {categories.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-xs">
            No sales data recorded yet
          </div>
        ) : (
          categories.slice(0, 5).map((cat, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-baseline">
                <div className="min-w-0 pr-2">
                  <h4 className="text-sm font-medium text-foreground truncate">{cat.name}</h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Price amount={cat.revenue || 0} />
                    <span>Revenue</span>
                  </p>
                </div>
                <div className="text-sm font-semibold text-foreground shrink-0 tabular-nums">
                  {cat.sales} <span className="text-xs font-normal text-muted-foreground">units</span>
                </div>
              </div>
              <Progress 
                value={maxSales > 0 ? (cat.sales / maxSales) * 100 : 0} 
                className="h-2 bg-muted" 
              />
            </div>
          ))
        )}
      </AdminCardContent>
    </AdminCard>
  );
}
