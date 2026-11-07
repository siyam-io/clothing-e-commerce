"use client";

import Link from "next/link";
import { Eye, Edit2, Trash2 } from "lucide-react";
import DataTable from "@/app/admin/_components/DataTable";
import Pagination from "@/components/common/Pagination";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/common/Price";

export default function OrdersTable({
  orders,
  page,
  pages,
  onPageChange,
  isAllFetching,
  onQuickStatusUpdate,
  onDeleteOrder,
}) {
  const columns = [
    {
      label: "Order",
      render: (item) => (
        <Link
          href={`/admin/orders/${item._id}`}
          className="font-mono text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          #{item?._id?.slice(-8).toUpperCase()}
        </Link>
      ),
    },
    {
      label: "Customer",
      render: (item) => (
        <div>
          <p className="font-semibold text-foreground text-sm tracking-tight">
            {item?.user?.name || item?.shippingAddress?.name || "Guest Checkout"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {item?.shippingAddress?.phone || item?.user?.email || "No phone provided"}
          </p>
        </div>
      ),
    },
    {
      label: "Date",
      render: (item) => {
        const dateObj = item.createdAt ? new Date(item.createdAt) : null;
        const isValid = dateObj && !isNaN(dateObj.getTime());
        return (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {isValid
                ? dateObj.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </span>
            {isValid && (
              <span className="block text-[11px] text-muted-foreground">
                {dateObj.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span>
            )}
          </div>
        );
      },
    },
    {
      label: "Total Amount",
      render: (item) => (
        <Price
          amount={item?.totalPrice || 0}
          decimals={2}
          className="text-sm font-semibold text-foreground"
        />
      ),
    },
    {
      label: "Status",
      render: (item) => (
        <select
          value={item.orderStatus}
          onChange={(e) => onQuickStatusUpdate(item._id, e.target.value)}
          className={cn(
            "h-8 rounded-lg px-2.5 text-xs font-medium border transition-colors cursor-pointer outline-none bg-background shadow-2xs",
            item.orderStatus === "Delivered" && "text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
            item.orderStatus === "Cancelled" && "text-rose-700 dark:text-rose-400 border-rose-500/30 bg-rose-500/10",
            item.orderStatus === "Pending" && "text-amber-700 dark:text-amber-400 border-amber-500/30 bg-amber-500/10",
            item.orderStatus === "Processing" && "text-blue-700 dark:text-blue-400 border-blue-500/30 bg-blue-500/10",
            item.orderStatus === "Shipped" && "text-blue-700 dark:text-blue-400 border-blue-500/30 bg-blue-500/10"
          )}
        >
          {["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((s) => (
            <option key={s} value={s} className="bg-background text-foreground">
              {s}
            </option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <div className={cn("transition-opacity duration-200", isAllFetching && "opacity-60")}>
      <DataTable
        columns={columns}
        data={orders || []}
        className="border-none shadow-none rounded-none"
        actions={(item) => (
          <div className="flex items-center gap-1.5 justify-end">
            <Button asChild variant="ghost" size="icon-sm" className="size-8 rounded-lg" title="View Order">
              <Link href={`/admin/orders/${item._id}`}>
                <Eye className="size-3.5" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon-sm" className="size-8 rounded-lg" title="Edit Order">
              <Link href={`/admin/orders/${item._id}/edit`}>
                <Edit2 className="size-3.5" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onDeleteOrder(item._id)}
              className="size-8 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
              title="Delete Order"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        )}
      />

      {pages > 1 && (
        <div className="p-4 border-t border-border/40 bg-muted/10">
          <Pagination
            page={page}
            totalPages={pages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
