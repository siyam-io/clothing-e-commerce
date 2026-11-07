"use client";

import { getImageUrl } from "@/utils/imageUtils";
import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from "@/app/admin/_components/AdminCard";
import { Package, ImageIcon } from "lucide-react";
import { Price } from "@/components/common/Price";

export default function OrderItemsManifest({ order }) {
  if (!order) return null;

  return (
    <AdminCard>
      <AdminCardHeader>
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Package className="size-4" />
          </div>
          <AdminCardTitle>Order Items ({order.orderItems?.length || 0})</AdminCardTitle>
        </div>
      </AdminCardHeader>

      <AdminCardContent className="space-y-4">
        <div className="divide-y divide-border/40">
          {order.orderItems?.map((item, i) => {
            const imgUrl = item.image || item.product?.images?.[0];
            return (
              <div
                key={i}
                className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="size-16 rounded-xl bg-muted overflow-hidden shrink-0 border border-border/60">
                  {imgUrl ? (
                    <img
                      src={getImageUrl(imgUrl)}
                      className="size-full object-cover"
                      alt={item.name}
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="size-5 opacity-40" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm tracking-tight truncate">
                    {item.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    {item.sizeName && (
                      <span className="px-1.5 py-0.5 rounded-md bg-muted text-foreground font-medium text-[11px]">
                        Size: {item.sizeName}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Price amount={item.price || 0} />
                      <span>each</span>
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-muted-foreground font-medium mr-2">
                    ×{item.quantity}
                  </span>
                  <Price
                    amount={(item.price || 0) * (item.quantity || 1)}
                    className="text-sm font-semibold text-foreground"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Financial Calculation Breakdown */}
        <div className="pt-4 mt-2 border-t border-border/40 space-y-2 text-xs">
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Items Subtotal</span>
            <Price amount={order.itemsPrice || 0} className="text-foreground font-medium" />
          </div>

          <div className="flex justify-between items-center text-muted-foreground">
            <span>Delivery Fee</span>
            <Price amount={order.shippingPrice || 0} className="text-foreground font-medium" />
          </div>

          {order.discountAmount > 0 && (
            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium">
              <span>Discount</span>
              <span className="inline-flex items-baseline gap-0.5">
                <span>-</span>
                <Price amount={order.discountAmount} className="text-emerald-600 dark:text-emerald-400" />
              </span>
            </div>
          )}

          <div className="flex justify-between items-center pt-3 border-t border-border/40 text-sm">
            <span className="font-semibold text-foreground">Total Amount</span>
            <Price
              amount={order.totalPrice || 0}
              className="text-lg font-bold text-foreground"
            />
          </div>
        </div>
      </AdminCardContent>
    </AdminCard>
  );
}
