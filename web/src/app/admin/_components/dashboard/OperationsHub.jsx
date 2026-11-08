"use client";

import Link from "next/link";
import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from "@/app/admin/_components/AdminCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  ArrowRight,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  Store,
  PlusCircle,
  Zap,
  Ticket,
  Radio,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chatStore";

export function OperationsHub({ isLoading }) {
  const socket = useChatStore((s) => s.socket);
  const isSocketActive = Boolean(socket?.connected);

  const fulfillmentStages = [
    {
      label: "Pending",
      subLabel: "Verification Needed",
      href: "/admin/orders?status=pending",
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20",
      badge: "In Queue",
    },
    {
      label: "Processing",
      subLabel: "Warehouse Packing",
      href: "/admin/orders?status=processing",
      icon: Package,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20",
      badge: "In Packing",
    },
    {
      label: "Shipped",
      subLabel: "Courier in Transit",
      href: "/admin/orders?status=shipped",
      icon: Truck,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20",
      badge: "Pathao Logistics",
    },
    {
      label: "Delivered",
      subLabel: "Completed Sales",
      href: "/admin/orders?status=delivered",
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20",
      badge: "Fulfilled",
    },
  ];

  const quickActions = [
    {
      title: "POS Terminal",
      desc: "Fast in-store checkout",
      href: "/admin/pos",
      icon: Store,
      accent: "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/20",
    },
    {
      title: "Add Product",
      desc: "Create catalog item",
      href: "/admin/products/new",
      icon: PlusCircle,
      accent: "text-blue-500 bg-blue-500/10 hover:bg-blue-500/15 border-blue-500/20",
    },
    {
      title: "Flash Sale",
      desc: "Time-limited promo",
      href: "/admin/flash-sales",
      icon: Zap,
      accent: "text-amber-500 bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/20",
    },
    {
      title: "Coupons",
      desc: "Voucher codes",
      href: "/admin/coupons",
      icon: Ticket,
      accent: "text-rose-500 bg-rose-500/10 hover:bg-rose-500/15 border-rose-500/20",
    },
  ];

  if (isLoading) {
    return (
      <AdminCard>
        <AdminCardHeader className="flex flex-row items-center justify-between pb-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-20" />
        </AdminCardHeader>
        <AdminCardContent className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-24 rounded-xl" />
        </AdminCardContent>
      </AdminCard>
    );
  }

  return (
    <AdminCard className="flex flex-col justify-between">
      <div>
        <AdminCardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            <AdminCardTitle className="text-base font-semibold">
              Operations & Fulfillment Hub
            </AdminCardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span
                className={cn(
                  "absolute inline-flex h-full w-full rounded-full opacity-75",
                  isSocketActive ? "animate-ping bg-emerald-400" : "bg-amber-400"
                )}
              />
              <span
                className={cn(
                  "relative inline-flex size-2 rounded-full",
                  isSocketActive ? "bg-emerald-500" : "bg-amber-500"
                )}
              />
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {isSocketActive ? "Live Socket Active" : "Connecting..."}
            </span>
          </div>
        </AdminCardHeader>

        <AdminCardContent className="space-y-4 pt-1">
          {/* 1. Fulfillment Pipeline Stages */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Fulfillment Workflow
              </span>
              <Link
                href="/admin/orders"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
              >
                All Orders <ArrowRight className="size-3" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {fulfillmentStages.map((stage) => {
                const Icon = stage.icon;
                return (
                  <Link
                    key={stage.label}
                    href={stage.href}
                    className={cn(
                      "p-3 rounded-xl border transition-all flex flex-col justify-between group",
                      stage.bg
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className={cn("p-1.5 rounded-lg bg-background/80", stage.color)}>
                        <Icon className="size-4" />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-0.5">
                        Filter <ArrowRight className="size-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-bold text-foreground">
                        {stage.label}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {stage.subLabel}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 2. Executive Quick Actions */}
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Quick Operations
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {quickActions.map((act) => {
                const Icon = act.icon;
                return (
                  <Link
                    key={act.title}
                    href={act.href}
                    className={cn(
                      "p-2.5 rounded-xl border transition-all flex flex-col items-center text-center group",
                      act.accent
                    )}
                  >
                    <Icon className="size-4 mb-1 transition-transform group-hover:scale-110" />
                    <span className="text-xs font-semibold text-foreground">
                      {act.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate w-full">
                      {act.desc}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 3. Live System Telemetry */}
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-500" />
              <span className="font-medium text-foreground">
                Pathao Logistics & Payment Gateway
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-mono text-muted-foreground">Operational</span>
            </div>
          </div>
        </AdminCardContent>
      </div>
    </AdminCard>
  );
}

