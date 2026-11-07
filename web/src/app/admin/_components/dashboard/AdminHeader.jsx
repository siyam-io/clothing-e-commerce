"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";
import { Price } from "@/components/common/Price";

export function AdminHeader({ 
  isFetching, 
  todayRevenue = 0, 
  isLoading
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Store Overview
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={cn(
              "size-2 rounded-full bg-emerald-500",
              isLoading ? "animate-ping opacity-75" : "shadow-xs"
            )}
          />
          <p className="text-xs text-muted-foreground">
            {isFetching ? "Syncing real-time store telemetry..." : "Live store data active"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-border/60 bg-card/70 px-4 py-3 shadow-2xs backdrop-blur-md min-w-[200px]">
          <span className="text-xs font-medium text-muted-foreground block mb-0.5">
            Today&apos;s Revenue
          </span>
          {isLoading ? (
            <Skeleton className="h-7 w-28 rounded-md" />
          ) : (
            <div className="flex items-baseline gap-2">
              <Price
                amount={todayRevenue}
                decimals={2}
                className="text-xl sm:text-2xl font-bold text-foreground"
              />
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center">
                <TrendingUp className="size-3 mr-0.5" /> Live
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
