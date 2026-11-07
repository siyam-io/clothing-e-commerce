"use client";

import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from "@/app/admin/_components/AdminCard";
import AdminStatusBadge from "@/app/admin/_components/AdminStatusBadge";
import { CreditCard } from "lucide-react";

export default function PaymentDetailsCard({ order }) {
  if (!order) return null;

  const isPaid = order.isPaid || order.paymentResult?.status?.toLowerCase() === "completed";
  const paymentMethod = order.paymentMethod || "COD";

  return (
    <AdminCard>
      <AdminCardHeader>
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CreditCard className="size-4" />
          </div>
          <AdminCardTitle>Payment Information</AdminCardTitle>
        </div>
      </AdminCardHeader>

      <AdminCardContent className="space-y-3.5 text-xs">
        <div className="flex justify-between items-center pb-2.5 border-b border-border/40">
          <span className="text-muted-foreground font-medium">Payment Status</span>
          <AdminStatusBadge
            value={isPaid ? "paid" : "unpaid"}
            label={isPaid ? "Paid" : "Unpaid / Pending"}
          />
        </div>

        <div className="flex justify-between items-center pb-2.5 border-b border-border/40">
          <span className="text-muted-foreground font-medium">Payment Method</span>
          <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
            {paymentMethod}
          </span>
        </div>

        {order.paymentResult?.transactionId && (
          <div className="space-y-1 pt-1">
            <span className="text-muted-foreground font-medium block text-[11px]">Transaction ID</span>
            <span className="font-mono text-xs text-foreground bg-muted/40 p-2 rounded-lg border border-border/60 block break-all select-all">
              {order.paymentResult.transactionId}
            </span>
          </div>
        )}
      </AdminCardContent>
    </AdminCard>
  );
}
