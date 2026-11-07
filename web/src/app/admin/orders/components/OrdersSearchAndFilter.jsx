"use client";

import { useEffect, useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function OrdersSearchAndFilter({
  status,
  onStatusChange,
  search,
  onSearchChange,
  sort,
  onSortChange,
}) {
  const [localSearch, setLocalSearch] = useState(search || "");

  useEffect(() => {
    setLocalSearch(search || "");
  }, [search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== search && onSearchChange) {
        onSearchChange(localSearch);
      }
    }, 250);
    return () => clearTimeout(handler);
  }, [localSearch, search, onSearchChange]);

  const statuses = [
    { label: "All Orders", value: "all" },
    { label: "Pending", value: "Pending" },
    { label: "Processing", value: "Processing" },
    { label: "Shipped", value: "Shipped" },
    { label: "Delivered", value: "Delivered" },
    { label: "Cancelled", value: "Cancelled" },
  ];

  const hasActiveFilters = Boolean(
    localSearch || (status && status !== "all") || (sort && sort !== "-createdAt")
  );

  const handleReset = () => {
    setLocalSearch("");
    if (onSearchChange) onSearchChange("");
    if (onStatusChange) onStatusChange("all");
    if (onSortChange) onSortChange("-createdAt");
  };

  return (
    <div className="space-y-3.5">
      {/* Status Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {statuses.map((s) => {
          const isActive = (status || "all") === s.value;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => onStatusChange(s.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer",
                isActive
                  ? "bg-foreground text-background shadow-2xs font-semibold"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by Order ID, customer, or phone..."
            className="pl-9 pr-4 h-10 rounded-xl bg-background/80 border-border/60 text-xs sm:text-sm focus-visible:ring-1"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={sort || "-createdAt"} onValueChange={onSortChange}>
            <SelectTrigger className="h-10 min-w-[150px] bg-background/80 border-border/60 rounded-xl text-xs font-medium">
              <SelectValue placeholder="Sort orders" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border rounded-xl">
              <SelectItem value="-createdAt" className="text-xs">Newest First</SelectItem>
              <SelectItem value="createdAt" className="text-xs">Oldest First</SelectItem>
              <SelectItem value="-totalPrice" className="text-xs">Amount: High to Low</SelectItem>
              <SelectItem value="totalPrice" className="text-xs">Amount: Low to High</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-10 px-3 rounded-xl text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
