"use client";

import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from "@/app/admin/_components/AdminCard";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieIcon } from "lucide-react";

// HSL based semantic palette
const COLORS = [
  "hsl(var(--primary))",
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
];

export function CategoryPie({ categories = [], isFetching, isLoading }) {
  return (
    <AdminCard className="relative overflow-hidden h-full flex flex-col">
      {(isFetching && !isLoading) && (
        <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px] z-50 animate-in fade-in duration-300" />
      )}
      <AdminCardHeader className="pb-2 flex flex-row items-center gap-2">
        <PieIcon className="size-4 text-primary" />
        <AdminCardTitle className="text-base font-semibold">
          Sales by Category
        </AdminCardTitle>
      </AdminCardHeader>
      <AdminCardContent className="flex-1 flex flex-col justify-between pt-2">
        {isLoading ? (
          <div className="flex flex-col items-center gap-6 py-4">
            <Skeleton className="size-44 rounded-full" />
            <div className="w-full space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-8" />
                </div>
              ))}
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-xs">
            No category sales recorded
          </div>
        ) : (
          <>
            <div className="h-[220px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="count"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    stroke="none"
                  >
                    {categories.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                      fontSize: "12px",
                    }}
                    formatter={(val) => [`${val} orders`, "Volume"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {categories.slice(0, 4).map((cat, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center text-xs py-1.5 border-b border-border/40 last:border-0"
                >
                  <span className="flex items-center gap-2 text-foreground font-medium truncate">
                    <span
                      className="size-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span className="text-muted-foreground font-semibold tabular-nums shrink-0 ml-2">
                    {cat.count}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </AdminCardContent>
    </AdminCard>
  );
}
