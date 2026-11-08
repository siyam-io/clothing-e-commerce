"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
  dict,
}) {
  // Calculate page range with a delta of 1 (e.g., 1 ... 4 5 6 ... 10)
  const pages = useMemo(() => {
    if (!totalPages || totalPages <= 1) return [];
    const range = [];
    const delta = 1; 

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= page - delta && i <= page + delta)
      ) {
        range.push(i);
      } else if (i === page - delta - 1 || i === page + delta + 1) {
        range.push("...");
      }
    }
    return range;
  }, [page, totalPages]);

  // Don't render if there's no need for pagination
  if (!totalPages || totalPages <= 1) return null;

  return (
    <nav
      role="navigation"
      aria-label={dict?.navigation || "Pagination"}
      className={cn("mx-auto flex w-full justify-center py-8", className)}
    >
      <ul className="flex flex-row items-center gap-1 sm:gap-2">
        {/* Previous Button */}
        <li>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-auto sm:px-4 gap-1 text-muted-foreground hover:text-foreground"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline-block">
              {dict?.previous || "Previous"}
            </span>
          </Button>
        </li>

        {/* Page Numbers */}
        {pages.map((p, index) => {
          if (p === "...") {
            return (
              <li key={`ellipsis-${index}`} className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground/50" />
                <span className="sr-only">More pages</span>
              </li>
            );
          }

          const isActive = p === page;

          return (
            <li key={p}>
              <Button
                variant={isActive ? "default" : "ghost"}
                size="icon"
                className={cn(
                  "h-8 w-8 sm:h-9 sm:w-9 text-sm transition-all",
                  isActive 
                    ? "pointer-events-none shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={isActive ? "page" : undefined}
              >
                {p}
              </Button>
            </li>
          );
        })}

        {/* Next Button */}
        <li>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-auto sm:px-4 gap-1 text-muted-foreground hover:text-foreground"
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Go to next page"
          >
            <span className="hidden sm:inline-block">
              {dict?.next || "Next"}
            </span>
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </Button>
        </li>
      </ul>
    </nav>
  );
}