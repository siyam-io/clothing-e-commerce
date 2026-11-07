"use client";

import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardDescription, AdminCardContent } from "@/app/admin/_components/AdminCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart3, RefreshCw } from "lucide-react";

const MONTHS = [
  { label: "All Months", value: "all" },
  { label: "January", value: "1" },
  { label: "February", value: "2" },
  { label: "March", value: "3" },
  { label: "April", value: "4" },
  { label: "May", value: "5" },
  { label: "June", value: "6" },
  { label: "July", value: "7" },
  { label: "August", value: "8" },
  { label: "September", value: "9" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

export function RevenueChart({ 
  revenue, 
  selectedYear, 
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  isFetching,
  isLoading
}) {
  return (
    <AdminCard className="relative overflow-hidden h-full">
      {(isFetching && !isLoading) && (
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] z-50 flex items-center justify-center animate-in fade-in duration-300">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border shadow-md">
            <RefreshCw className="size-4 text-primary animate-spin" />
            <span className="text-xs font-medium text-foreground">
              Updating chart...
            </span>
          </div>
        </div>
      )}
      
      <AdminCardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-0 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-primary" />
            <AdminCardTitle className="text-base font-semibold">
              Revenue Overview
            </AdminCardTitle>
          </div>
          {isLoading ? (
            <Skeleton className="h-4 w-32 mt-1" />
          ) : (
            <AdminCardDescription className="text-xs text-muted-foreground mt-0.5">
              {selectedMonth === "all"
                ? `Full year: ${selectedYear}`
                : `${MONTHS.find((m) => m.value === selectedMonth)?.label} ${selectedYear}`}
            </AdminCardDescription>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="flex gap-2">
              <Skeleton className="h-9 w-[100px] rounded-lg" />
              <Skeleton className="h-9 w-[120px] rounded-lg" />
            </div>
          ) : (
            <>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => {
                  setSelectedYear(Number(value));
                  setSelectedMonth("all");
                }}
              >
                <SelectTrigger className="w-[100px] h-9 text-xs rounded-lg border-border/70">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((y) => (
                    <SelectItem key={y} value={y.toString()} className="text-xs">
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedMonth}
                onValueChange={(value) => setSelectedMonth(value)}
              >
                <SelectTrigger className="w-[120px] h-9 text-xs rounded-lg border-border/70">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value} className="text-xs">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </AdminCardHeader>

      <AdminCardContent>
        {isLoading ? (
          <Skeleton className="h-[360px] w-full rounded-xl" />
        ) : (
          <div className="h-[360px] w-full min-w-0 font-price">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue.trend || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                  opacity={0.4}
                />
                <XAxis
                  dataKey="_id"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  dy={10}
                  tickFormatter={(val) =>
                    val
                      ? selectedMonth === "all"
                        ? val.split("-")[1]
                        : val.split("-")[2]
                      : ""
                  }
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontFamily: "var(--font-hind-siliguri), sans-serif" }}
                  tickFormatter={(val) => `৳${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    fontSize: "12px",
                    fontFamily: "var(--font-hind-siliguri), var(--font-inter), sans-serif",
                  }}
                  formatter={(val) => [`৳${Number(val).toLocaleString()}`, "Revenue"]}
                  itemStyle={{ color: "var(--primary)", fontWeight: 600 }}
                  labelStyle={{ color: "var(--muted-foreground)", marginBottom: "4px" }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--primary)"
                  fillOpacity={1}
                  fill="url(#colorRev)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </AdminCardContent>
    </AdminCard>
  );
}
