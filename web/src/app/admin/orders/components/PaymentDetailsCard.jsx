"use client";

import { useState } from "react";
import {
  AdminCard,
  AdminCardHeader,
  AdminCardTitle,
  AdminCardContent,
} from "@/app/admin/_components/AdminCard";
import AdminStatusBadge from "@/app/admin/_components/AdminStatusBadge";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { swalConfirm, swalToast } from "@/utils/swal";

export default function PaymentDetailsCard({
  order,
  onUpdatePaymentStatus = null,
  isUpdating = false,
}) {
  const [copiedTxn, setCopiedTxn] = useState(false);

  if (!order) return null;

  const isPaid =
    order.isPaid ||
    order.paymentResult?.status?.toLowerCase() === "completed" ||
    order.paymentResult?.status?.toLowerCase() === "paid";

  const paymentMethod = order.paymentMethod || "COD";
  const transactionId =
    order.paymentResult?.transactionId ||
    order.paymentResult?.val_id ||
    order.paymentResult?.bkashPaymentID ||
    null;

  const handleCopyTxn = () => {
    if (!transactionId) return;
    navigator.clipboard.writeText(transactionId);
    setCopiedTxn(true);
    swalToast("Copied transaction ID", "success");
    setTimeout(() => setCopiedTxn(false), 2000);
  };

  const handleMarkPaid = async () => {
    const confirmed = await swalConfirm(
      "Confirm Payment Settlement?",
      "Mark this order as fully paid/collected."
    );
    if (confirmed && onUpdatePaymentStatus) {
      onUpdatePaymentStatus("Completed");
    }
  };

  return (
    <AdminCard>
      <AdminCardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CreditCard className="size-4" />
            </div>
            <AdminCardTitle className="text-sm font-bold">
              Payment Settlement
            </AdminCardTitle>
          </div>

          <AdminStatusBadge
            value={isPaid ? "paid" : "unpaid"}
            label={isPaid ? "Paid" : "Unpaid / Due"}
          />
        </div>
      </AdminCardHeader>

      <AdminCardContent className="space-y-3.5 text-xs">
        {/* Payment Method */}
        <div className="flex justify-between items-center pb-2.5 border-b border-border/40">
          <span className="text-muted-foreground font-medium">Payment Gateway</span>
          <span className="font-bold text-foreground uppercase tracking-wider text-[11px] px-2 py-0.5 rounded-md bg-muted/50 border border-border/60">
            {paymentMethod}
          </span>
        </div>

        {/* Payment Status row */}
        <div className="flex justify-between items-center pb-2.5 border-b border-border/40">
          <span className="text-muted-foreground font-medium">Settlement State</span>
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            {isPaid ? (
              <>
                <ShieldCheck className="size-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">
                  Fully Verified
                </span>
              </>
            ) : (
              <>
                <Clock className="size-3.5 text-amber-500" />
                <span className="text-amber-600 dark:text-amber-400">
                  Cash on Delivery Pending
                </span>
              </>
            )}
          </span>
        </div>

        {/* Transaction ID */}
        {transactionId ? (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium text-[11px]">
                Transaction ID
              </span>
              <button
                type="button"
                onClick={handleCopyTxn}
                className="flex items-center gap-1 text-[10px] text-primary hover:underline cursor-pointer"
              >
                {copiedTxn ? (
                  <>
                    <Check className="size-2.5 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-2.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <span className="font-mono text-xs text-foreground bg-muted/40 p-2 rounded-xl border border-border/60 block break-all select-all font-semibold">
              {transactionId}
            </span>
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground py-1">
            No gateway transaction reference recorded (Direct COD or Cash tender).
          </div>
        )}

        {/* Mark as Paid Action if unpaid */}
        {!isPaid && onUpdatePaymentStatus && (
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMarkPaid}
              disabled={isUpdating}
              className="w-full h-9 rounded-xl text-xs font-semibold gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
            >
              {isUpdating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              Mark Payment Collected / Paid
            </Button>
          </div>
        )}
      </AdminCardContent>
    </AdminCard>
  );
}
