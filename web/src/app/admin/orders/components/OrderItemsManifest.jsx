"use client";

import Link from "next/link";
import { getImageUrl } from "@/utils/imageUtils";
import {
  AdminCard,
  AdminCardHeader,
  AdminCardTitle,
  AdminCardContent,
} from "@/app/admin/_components/AdminCard";
import { Package, ImageIcon, Tag, ExternalLink } from "lucide-react";
import { Price } from "@/components/common/Price";
import { Badge } from "@/components/ui/badge";

export default function OrderItemsManifest({ order }) {
  if (!order) return null;

  return (
    <AdminCard>
      <AdminCardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Package className="size-4" />
            </div>
            <div>
              <AdminCardTitle className="text-sm font-bold">
                Order Manifest ({order.orderItems?.length || 0}{" "}
                {order.orderItems?.length === 1 ? "Line Item" : "Line Items"})
              </AdminCardTitle>
            </div>
          </div>

          <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {order.orderItems?.reduce((acc, it) => acc + (it.quantity || 1), 0) || 0} Total Units
          </Badge>
        </div>
      </AdminCardHeader>

      <AdminCardContent className="space-y-4">
        {/* Products List */}
        <div className="divide-y divide-border/40">
          {order.orderItems?.map((item, i) => {
            const imgUrl = item.image || item.product?.images?.[0];
            const productId = item.product?._id || item.product;

            return (
              <div
                key={i}
                className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 group"
              >
                {/* Thumbnail */}
                <div className="size-16 sm:size-20 rounded-2xl bg-muted overflow-hidden shrink-0 border border-border/60 relative shadow-2xs">
                  {imgUrl ? (
                    <img
                      src={getImageUrl(imgUrl)}
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      alt={item.name}
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="size-6 opacity-40" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    {productId ? (
                      <Link
                        href={`/admin/products/${productId}`}
                        className="font-bold text-foreground text-sm tracking-tight truncate hover:text-primary transition-colors inline-flex items-center gap-1"
                      >
                        {item.name}
                        <ExternalLink className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ) : (
                      <span className="font-bold text-foreground text-sm tracking-tight truncate">
                        {item.name}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {item.sizeName && (
                      <span className="px-2 py-0.5 rounded-md bg-muted/80 text-foreground font-semibold text-[11px] border border-border/50">
                        Size: {item.sizeName}
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1">
                      <Price amount={item.price || 0} />
                      <span className="text-muted-foreground/70">/ unit</span>
                    </span>
                  </div>
                </div>

                {/* Pricing & Qty */}
                <div className="text-right shrink-0">
                  <span className="text-xs text-muted-foreground font-medium mr-2 tabular-nums">
                    × {item.quantity || 1}
                  </span>
                  <Price
                    amount={(item.price || 0) * (item.quantity || 1)}
                    className="text-sm sm:text-base font-bold text-foreground tabular-nums"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Financial Calculation Ledger */}
        <div className="pt-4 mt-2 border-t border-border/40 space-y-2.5 text-xs">
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Items Subtotal</span>
            <Price amount={order.itemsPrice || 0} className="text-foreground font-semibold" />
          </div>

          <div className="flex justify-between items-center text-muted-foreground">
            <span>Delivery & Logistics Fee</span>
            <Price amount={order.shippingPrice || 0} className="text-foreground font-semibold" />
          </div>

          {order.discountAmount > 0 && (
            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <Tag className="size-3" />
                Discount Applied
                {order.couponCode && (
                  <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                    {order.couponCode}
                  </Badge>
                )}
              </span>
              <span className="inline-flex items-baseline gap-0.5">
                <span>-</span>
                <Price amount={order.discountAmount} className="text-emerald-600 dark:text-emerald-400 font-bold" />
              </span>
            </div>
          )}

          <div className="flex justify-between items-center pt-3 border-t border-border/60 text-sm">
            <div>
              <span className="font-bold text-foreground text-sm block">
                Total Order Value
              </span>
              <span className="text-[11px] text-muted-foreground">
                All applicable fees & VAT inclusive
              </span>
            </div>
            <Price
              amount={order.totalPrice || 0}
              className="text-xl sm:text-2xl font-black text-foreground tabular-nums"
            />
          </div>
        </div>
      </AdminCardContent>
    </AdminCard>
  );
}
