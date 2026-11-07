"use client";

import Link from "next/link";
import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from "@/app/admin/_components/AdminCard";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ArrowRight, PackageX } from "lucide-react";
import { cn } from "@/lib/utils";

export function InventoryAlerts({ inventory, isLoading }) {
  const criticalItems = inventory?.criticalItems || [];

  return (
    <AdminCard>
      <AdminCardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-500" />
          <AdminCardTitle className="text-base font-semibold">
            Low Stock Alerts
          </AdminCardTitle>
        </div>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline transition-colors"
        >
          Manage Inventory <ArrowRight className="size-3" />
        </Link>
      </AdminCardHeader>
      <AdminCardContent className="space-y-4 pt-1">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center py-2.5 border-b border-border/50 last:border-0">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          ))
        ) : criticalItems.length > 0 ? (
          <div className="divide-y divide-border/50">
            {criticalItems.map((item, i) => {
              const isOut = item.status === "OUT" || item.stock <= 0;
              return (
                <div
                  key={i}
                  className="flex justify-between items-center py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          isOut
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40"
                        )}
                      >
                        {isOut ? "Out of Stock" : "Low Stock"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={cn(
                        "text-lg font-bold tabular-nums",
                        isOut ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {item.stock} left
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <PackageX className="size-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground">
              All inventory levels are currently healthy. No alerts.
            </p>
          </div>
        )}
      </AdminCardContent>
    </AdminCard>
  );
}
