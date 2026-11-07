"use client";

import Link from "next/link";
import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from "@/app/admin/_components/AdminCard";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/app/admin/_components/StatusBadge";
import { ArrowRight, Calendar, Clock, ShoppingCart } from "lucide-react";
import { Price } from "@/components/common/Price";

const formatDateTime = (dateString) => {
  if (!dateString) return { date: "N/A", time: "N/A" };
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString("en-GB", { 
    day: "2-digit", 
    month: "short", 
    year: "numeric" 
  });
  const formattedTime = date.toLocaleTimeString("en-US", { 
    hour: "2-digit", 
    minute: "2-digit", 
    hour12: true 
  });
  return { date: formattedDate, time: formattedTime };
};

export function RecentOrders({ recentOrders, isLoading }) {
  return (
    <AdminCard>
      <AdminCardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="size-4 text-primary" />
          <AdminCardTitle className="text-base font-semibold">
            Recent Orders
          </AdminCardTitle>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline transition-colors"
        >
          View All <ArrowRight className="size-3" />
        </Link>
      </AdminCardHeader>
      <AdminCardContent className="space-y-3 pt-1">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/20 border border-border/50">
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          ))
        ) : recentOrders?.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted-foreground">
            No recent orders found
          </div>
        ) : (
          recentOrders.slice(0, 5).map((order) => {
            const { date, time } = formatDateTime(order.createdAt);
            return (
              <div
                key={order._id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-muted/20 hover:bg-muted/40 border border-border/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-semibold text-xs shrink-0">
                    {order.user?.name?.charAt(0).toUpperCase() || "G"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {order.user?.name || "Guest Customer"}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      #{order._id.slice(-6).toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="text-right space-y-1 shrink-0 ml-3">
                  <div className="flex items-center gap-2 justify-end">
                    <Price
                      amount={order.totalPrice || 0}
                      className="text-sm font-semibold text-foreground"
                    />
                    <StatusBadge value={order.orderStatus} />
                  </div>
                  <div className="flex items-center gap-2 justify-end text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" /> {date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" /> {time}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </AdminCardContent>
    </AdminCard>
  );
}
