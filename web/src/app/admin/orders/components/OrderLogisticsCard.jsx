"use client";

import { useState } from "react";
import {
  AdminCard,
  AdminCardHeader,
  AdminCardTitle,
  AdminCardContent,
} from "@/app/admin/_components/AdminCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Truck,
  Copy,
  Check,
  ExternalLink,
  Zap,
  Loader2,
  MapPin,
  Compass,
} from "lucide-react";
import { swalToast, swalConfirm } from "@/utils/swal";

export default function OrderLogisticsCard({
  order,
  onSyncPathao,
  isSyncing = false,
}) {
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [copiedConsignment, setCopiedConsignment] = useState(false);

  if (!order) return null;

  const hasPathao = Boolean(order.pathaoConsignmentId);
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://yourdomain.com";

  const trackingUrl = `${origin}/track-order?orderId=${order._id}${
    order.shippingAddress?.phone
      ? `&phone=${encodeURIComponent(order.shippingAddress.phone)}`
      : ""
  }`;

  const handleCopyConsignment = () => {
    if (!order.pathaoConsignmentId) return;
    navigator.clipboard.writeText(order.pathaoConsignmentId);
    setCopiedConsignment(true);
    swalToast("Copied consignment ID", "success");
    setTimeout(() => setCopiedConsignment(false), 2000);
  };

  const handleCopyTrackingLink = () => {
    navigator.clipboard.writeText(trackingUrl);
    setCopiedTracking(true);
    swalToast("Copied customer tracking link", "success");
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const handlePathaoSyncClick = async () => {
    const confirmed = await swalConfirm(
      "Sync Consignment to Pathao?",
      "This will create an official delivery consignment in Pathao Courier."
    );
    if (confirmed && onSyncPathao) {
      onSyncPathao();
    }
  };

  return (
    <AdminCard>
      <AdminCardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Truck className="size-4" />
            </div>
            <AdminCardTitle className="text-sm font-bold">
              Logistics & Courier
            </AdminCardTitle>
          </div>

          <Badge
            variant="outline"
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              hasPathao
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                : "bg-muted text-muted-foreground border-border/60"
            }`}
          >
            {hasPathao ? "Pathao Dispatched" : "Standard Logistics"}
          </Badge>
        </div>
      </AdminCardHeader>

      <AdminCardContent className="space-y-3.5 text-xs">
        {/* Pathao Consignment status */}
        {hasPathao ? (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Truck className="size-3.5" />
                Pathao Consignment
              </span>
              <button
                type="button"
                onClick={handleCopyConsignment}
                className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                {copiedConsignment ? (
                  <>
                    <Check className="size-2.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-2.5" /> Copy ID
                  </>
                )}
              </button>
            </div>

            <div className="font-mono text-xs font-bold text-foreground bg-background/80 p-2 rounded-lg border border-border/50 flex items-center justify-between">
              <span>{order.pathaoConsignmentId}</span>
              <span className="text-[10px] font-sans font-medium text-muted-foreground">
                {order.pathaoStatus || "In Transit"}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Pathao Delivery</span>
              <span className="text-[11px] text-muted-foreground font-semibold">
                Not Synced Yet
              </span>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handlePathaoSyncClick}
              disabled={
                isSyncing || ["Cancelled", "Delivered"].includes(order.orderStatus)
              }
              className="w-full h-9 rounded-xl text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Generating Consignment...
                </>
              ) : (
                <>
                  <Zap className="size-3.5" />
                  Dispatch Consignment to Pathao
                </>
              )}
            </Button>
          </div>
        )}

        {/* Customer Tracking Portal Link */}
        <div className="pt-2 border-t border-border/40 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium text-[11px] flex items-center gap-1">
              <Compass className="size-3 text-primary" />
              Customer Tracking Link
            </span>
            <button
              type="button"
              onClick={handleCopyTrackingLink}
              className="flex items-center gap-1 text-[10px] font-medium text-primary hover:underline cursor-pointer"
            >
              {copiedTracking ? (
                <>
                  <Check className="size-2.5 text-emerald-500" /> Copied
                </>
              ) : (
                <>
                  <Copy className="size-2.5" /> Copy Link
                </>
              )}
            </button>
          </div>

          <a
            href={trackingUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/60 hover:bg-muted/70 text-foreground transition-colors group"
          >
            <span className="font-mono text-[11px] truncate text-muted-foreground group-hover:text-foreground">
              /track-order?orderId={order._id?.slice(-8).toUpperCase()}
            </span>
            <ExternalLink className="size-3 text-muted-foreground shrink-0 ml-2" />
          </a>
        </div>
      </AdminCardContent>
    </AdminCard>
  );
}

