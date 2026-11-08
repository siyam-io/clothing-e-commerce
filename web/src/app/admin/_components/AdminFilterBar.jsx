"use client";

import { useEffect, useState } from "react";
import { Search, X, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminFilterBar({
  searchQuery = "",
  onSearchChange,
  placeholder = "Search records...",
  statusFilter,
  onStatusChange,
  statusOptions = [],
  children,
  onReset,
  totalCount,
  isLoading = false,
  className,
}) {
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  const [localSearch, setLocalSearch] = useState(searchQuery || "");

  // Sync external search changes during render
  if (searchQuery !== prevSearchQuery) {
    setPrevSearchQuery(searchQuery);
    setLocalSearch(searchQuery || "");
  }

  // 250ms debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== searchQuery && onSearchChange) {
        onSearchChange(localSearch);
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [localSearch, searchQuery, onSearchChange]);

  const hasActiveFilters = Boolean(
    localSearch || (statusFilter && statusFilter !== "all")
  );

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-2xs",
        className
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder={placeholder}
            className="pl-9 pr-9 h-10 rounded-xl bg-background/80 border-border/60 text-sm focus-visible:ring-1"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch("");
                if (onSearchChange) onSearchChange("");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {statusOptions?.length > 0 && onStatusChange && (
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {statusOptions.map((opt) => {
              const active = (statusFilter || "all") === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onStatusChange(opt.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0",
                    active
                      ? "bg-foreground text-background shadow-xs font-semibold"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  {opt.label}
                  {opt.count !== undefined && (
                    <span
                      className={cn(
                        "ml-1.5 px-1.5 py-0.2 rounded-md text-[10px]",
                        active ? "bg-background/20 text-inherit" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {opt.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {children}
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
        {totalCount !== undefined && (
          <span className="text-xs text-muted-foreground font-medium">
            {isLoading ? "Updating..." : `${Number(totalCount).toLocaleString()} record${totalCount === 1 ? "" : "s"}`}
          </span>
        )}

        {hasActiveFilters && onReset && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setLocalSearch("");
              onReset();
            }}
            className="h-9 px-3 rounded-xl text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}

export default AdminFilterBar;
