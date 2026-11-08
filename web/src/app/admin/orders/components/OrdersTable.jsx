/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Eye,
  Edit2,
  Trash2,
  Store,
  Globe,
  Copy,
  Check,
  ChevronDown,
  ShoppingBag,
} from "lucide-react";
import DataTable from "@/app/admin/_components/DataTable";
import Pagination from "@/components/common/Pagination";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/common/Price";
import { getImageUrl } from "@/utils/imageUtils";

export default function OrdersTable({
  orders,
  page,
  pages,
  onPageChange,
  isAllFetching,
  onQuickStatusUpdate,
  onDeleteOrder,
  newOrderIds,
}) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyId = (e, id) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const columns = useMemo(
    () => [
      {
        label: "Order & Items",
        render: (item) => {
          const isNew = newOrderIds && newOrderIds.has(String(item._id));
          const isPos = item.deliveryZone === "pos" || (!item.shippingPrice && !item.deliveryZone);
          const firstItem = item.orderItems?.[0];
          const totalUnits = item.orderItems?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 0;
          const thumb = firstItem?.image || firstItem?.product?.images?.[0];

          return (
            <div className="flex items-center gap-3">
              {/* Product Thumbnail / Stack */}
              <div className="relative size-10 rounded-xl bg-muted/40 border border-border/40 overflow-hidden shrink-0 flex items-center justify-center">
                {thumb ? (
                  <img
                    src={getImageUrl(thumb)}
                    alt="Order item"
                    className="size-full object-cover outline outline-1 outline-black/5 dark:outline-white/10 -outline-offset-1"
                  />
                ) : (
                  <ShoppingBag className="size-4 text-muted-foreground/40" />
                )}
                {totalUnits > 1 && (
                  <span className="absolute bottom-0 right-0 px-1 py-0.2 bg-black/80 text-white text-[8px] font-mono tabular-nums font-bold rounded-tl-md">
                    +{totalUnits}
                  </span>
                )}
              </div>

              {/* Order ID & Tags */}
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link
                    href={`/admin/orders/${item._id}`}
                    className="font-mono text-xs font-bold text-foreground hover:text-primary transition-colors tabular-nums"
                  >
                    #{item?._id?.slice(-8).toUpperCase()}
                  </Link>

                  <button
                    type="button"
                    onClick={(e) => handleCopyId(e, item._id)}
                    className="size-5 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                    title="Copy full ID"
                  >
                    {copiedId === item._id ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </button>

                  {isNew && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-2xs animate-pulse">
                      NEW
                    </span>
                  )}
                </div>

                {/* Channel Indicator */}
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9px] font-bold uppercase tracking-wider border",
                      isPos
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25"
                    )}
                  >
                    {isPos ? <Store className="size-2.5" /> : <Globe className="size-2.5" />}
                    <span>{isPos ? "POS Terminal" : "Online Store"}</span>
                  </span>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        label: "Customer",
        render: (item) => {
          const isMember = Boolean(item.user && (item.user._id || item.user.id));
          const name = item?.user?.name || item?.shippingAddress?.name || "Guest Checkout";
          const phone = item?.shippingAddress?.phone || item?.user?.phone || "No phone";

          return (
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-foreground text-xs sm:text-sm tracking-tight truncate max-w-[170px]">
                  {name}
                </p>
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider",
                    isMember
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isMember ? "Member" : "Guest"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono tabular-nums truncate max-w-[170px]">
                {phone}
              </p>
            </div>
          );
        },
      },
      {
        label: "Date",
        render: (item) => {
          const dateObj = item.createdAt ? new Date(item.createdAt) : null;
          const isValid = dateObj && !isNaN(dateObj.getTime());
          return (
            <div className="text-xs text-muted-foreground space-y-0.5 font-mono tabular-nums">
              <span className="font-semibold text-foreground block">
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
        render: (item) => {
          const method = item.paymentMethod || "Cash";
          return (
            <div className="space-y-1">
              <Price
                amount={item?.totalPrice || 0}
                decimals={2}
                className="text-sm font-bold text-foreground tabular-nums font-mono"
              />
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/40">
                {method}
              </span>
            </div>
          );
        },
      },
      {
        label: "Status",
        render: (item) => (
          <div className="relative inline-block">
            <select
              value={item.orderStatus}
              onChange={(e) => onQuickStatusUpdate(item._id, e.target.value)}
              className={cn(
                "h-8 rounded-xl pl-3 pr-7 text-xs font-bold border transition-[color,background-color,border-color,transform] cursor-pointer appearance-none outline-none shadow-2xs active:scale-95",
                item.orderStatus === "Delivered" &&
                "text-emerald-700 dark:text-emerald-400 border-emerald-500/35 bg-emerald-500/10 hover:bg-emerald-500/15",
                item.orderStatus === "Cancelled" &&
                "text-rose-700 dark:text-rose-400 border-rose-500/35 bg-rose-500/10 hover:bg-rose-500/15",
                item.orderStatus === "Pending" &&
                "text-amber-700 dark:text-amber-400 border-amber-500/35 bg-amber-500/10 hover:bg-amber-500/15",
                item.orderStatus === "Processing" &&
                "text-blue-700 dark:text-blue-400 border-blue-500/35 bg-blue-500/10 hover:bg-blue-500/15",
                item.orderStatus === "Shipped" &&
                "text-indigo-700 dark:text-indigo-400 border-indigo-500/35 bg-indigo-500/10 hover:bg-indigo-500/15"
              )}
            >
              {["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((s) => (
                <option key={s} value={s} className="bg-card text-foreground font-medium">
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="size-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-70" />
          </div>
        ),
      },
    ],
    [newOrderIds, onQuickStatusUpdate, copiedId]
  );

  return (
    <div className="relative">
      {isAllFetching && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/80 animate-pulse z-10" />
      )}
      <DataTable
        columns={columns}
        data={orders || []}
        className="border-none shadow-none rounded-none"
        rowClassName={(item) =>
          cn(
            "transition-colors",
            newOrderIds && newOrderIds.has(String(item._id))
              ? "bg-emerald-500/10 dark:bg-emerald-500/15 border-l-4 border-l-emerald-500 font-medium"
              : "hover:bg-muted/30"
          )
        }
        actions={(item) => (
          <div className="flex items-center gap-1.5 justify-end">
            <Button
              asChild
              variant="ghost"
              size="icon-sm"
              className="size-8 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-transform active:scale-90"
              title="View Order Details"
            >
              <Link href={`/admin/orders/${item._id}`}>
                <Eye className="size-3.5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon-sm"
              className="size-8 rounded-xl text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-transform active:scale-90"
              title="Edit in POS Terminal"
            >
              <Link href={`/admin/pos?orderId=${item._id}`}>
                <Edit2 className="size-3.5" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onDeleteOrder(item._id)}
              className="size-8 rounded-xl text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-transform active:scale-90"
              title="Delete Order"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        )}
      />

      {pages > 1 && (
        <div className="flex items-center justify-center p-4 border-t border-border/40">
          <Pagination page={page} totalPages={pages} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
}
