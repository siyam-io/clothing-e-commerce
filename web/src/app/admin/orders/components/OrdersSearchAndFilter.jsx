"use client";

import { useEffect, useState } from "react";
import {
  Search,
  RotateCcw,
  Clock,
  RefreshCw,
  Truck,
  CheckCircle2,
  XCircle,
  Inbox,
  X,
} from "lucide-react";
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
  const [prevSearch, setPrevSearch] = useState(search);

  if (prevSearch !== search) {
    setPrevSearch(search);
    setLocalSearch(search || "");
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== search && onSearchChange) {
        onSearchChange(localSearch);
      }
    }, 250);
    return () => clearTimeout(handler);
  }, [localSearch, search, onSearchChange]);

  const statuses = [
    { label: "All Orders", value: "all", icon: Inbox },
    { label: "Pending", value: "Pending", icon: Clock },
    { label: "Processing", value: "Processing", icon: RefreshCw },
    { label: "Shipped", value: "Shipped", icon: Truck },
    { label: "Delivered", value: "Delivered", icon: CheckCircle2 },
    { label: "Cancelled", value: "Cancelled", icon: XCircle },
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
    <div className="space-y-4">
      {/* Status Filter Pills with Icons & Concentric Radius */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {statuses.map((s) => {
          const isActive = (status || "all") === s.value;
          const Icon = s.icon;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => onStatusChange(s.value)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-[color,background-color,border-color,box-shadow,transform] active:scale-[0.97] border",
                isActive
                  ? "bg-foreground text-background border-foreground shadow-sm font-bold"
                  : "bg-background/80 text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("size-3.5", isActive ? "text-background" : "text-muted-foreground")} />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search Order ID, customer name, or phone..."
            className="pl-9 pr-8 h-10 rounded-xl bg-background/90 border-border/70 text-xs sm:text-sm focus-visible:ring-1 focus-visible:ring-primary/30"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch("");
                if (onSearchChange) onSearchChange("");
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 size-5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              title="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select value={sort || "-createdAt"} onValueChange={onSortChange}>
            <SelectTrigger className="h-10 min-w-[160px] bg-background/90 border-border/70 rounded-xl text-xs font-semibold focus-visible:ring-1">
              <SelectValue placeholder="Sort orders" />
            </SelectTrigger>
            <SelectContent className="bg-card/95 backdrop-blur-xl border-border rounded-xl shadow-lg">
              <SelectItem value="-createdAt" className="text-xs font-medium">Newest First</SelectItem>
              <SelectItem value="createdAt" className="text-xs font-medium">Oldest First</SelectItem>
              <SelectItem value="-totalPrice" className="text-xs font-medium">Amount: High to Low</SelectItem>
              <SelectItem value="totalPrice" className="text-xs font-medium">Amount: Low to High</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-10 px-3 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 gap-1.5 cursor-pointer transition-[color,background-color,transform] active:scale-[0.98]"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
