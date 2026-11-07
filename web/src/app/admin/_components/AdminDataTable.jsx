"use client";

import { useState } from "react";
import { getImageUrl } from "@/utils/imageUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ImageIcon } from "lucide-react";
import AdminEmptyState from "./AdminEmptyState";
import { cn } from "@/lib/utils";

export const TableImageCell = ({ src, alt = "Preview", className }) => {
  const [error, setError] = useState(false);
  const imageUrl = src ? getImageUrl(src) : null;

  if (!imageUrl || error) {
    return (
      <div className={cn("size-10 rounded-xl bg-muted/80 border border-border/60 flex items-center justify-center text-muted-foreground shrink-0", className)}>
        <ImageIcon className="size-4 opacity-50" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      loading="lazy"
      className={cn(
        "size-10 object-cover rounded-xl border border-border/60 bg-muted shrink-0 transition-transform duration-200 hover:scale-105",
        className
      )}
      onError={() => setError(true)}
    />
  );
};

export function AdminDataTable({
  columns = [],
  data = [],
  actions,
  isLoading = false,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  pagination,
  onRowClick,
  className,
}) {
  const totalCols = columns.length + (actions ? 1 : 0);

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-2xs">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="bg-muted/50 border-b border-border/60">
              <TableRow className="hover:bg-transparent border-border/40">
                {columns.map((col, idx) => (
                  <TableHead
                    key={col.key || idx}
                    className={cn(
                      "px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      col.headerClassName
                    )}
                    style={{ width: col.width }}
                  >
                    {col.label}
                  </TableHead>
                ))}
                {actions && (
                  <TableHead className="px-4 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/30">
              {isLoading ? (
                // Skeleton loading state with matched heights
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <TableRow key={`skeleton-row-${rIdx}`} className="border-border/30">
                    {columns.map((col, cIdx) => (
                      <TableCell key={`skeleton-cell-${cIdx}`} className="px-4 py-3.5">
                        <Skeleton className="h-5 w-full max-w-[140px] rounded-md" />
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell className="px-4 py-3.5 text-right">
                        <Skeleton className="h-8 w-16 ml-auto rounded-lg" />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : data && data.length > 0 ? (
                data.map((item, rowIdx) => (
                  <TableRow
                    key={item._id || item.id || rowIdx}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={cn(
                      "group transition-colors hover:bg-muted/40 border-border/30",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {columns.map((col, colIdx) => (
                      <TableCell
                        key={col.key || colIdx}
                        className={cn(
                          "px-4 py-3.5 text-sm text-foreground align-middle",
                          col.align === "right" && "text-right",
                          col.align === "center" && "text-center",
                          col.className
                        )}
                      >
                        {col.render ? (
                          col.render(item, rowIdx)
                        ) : col.key === "image" ? (
                          <TableImageCell src={item[col.key]} alt={item.name || item.title || "Image"} />
                        ) : (
                          item[col.key] ?? "—"
                        )}
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell className="px-4 py-3.5 text-right text-sm align-middle">
                        <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                          {actions(item, rowIdx)}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={totalCols} className="p-0">
                    <AdminEmptyState
                      title={emptyTitle || "No records found"}
                      description={emptyDescription || "No matching data available in this view."}
                      actionLabel={emptyActionLabel}
                      onAction={onEmptyAction}
                      className="border-none bg-transparent my-6"
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-1">
          <div className="text-xs text-muted-foreground">
            Page <span className="font-medium text-foreground">{pagination.page}</span> of{" "}
            <span className="font-medium text-foreground">{pagination.totalPages}</span>
            {pagination.total && (
              <span className="ml-2">({pagination.total.toLocaleString()} total items)</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => pagination.onPageChange(1)}
              className="size-8 rounded-lg"
              title="First page"
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="size-8 rounded-lg"
              title="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={pagination.page >= pagination.totalPages || isLoading}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="size-8 rounded-lg"
              title="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={pagination.page >= pagination.totalPages || isLoading}
              onClick={() => pagination.onPageChange(pagination.totalPages)}
              className="size-8 rounded-lg"
              title="Last page"
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDataTable;
