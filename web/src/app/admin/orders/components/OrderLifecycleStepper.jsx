"use client";

import { useState } from "react";
import {
  Clock,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { swalConfirm } from "@/utils/swal";

const ORDER_STEPS = [
  {
    status: "Pending",
    label: "Order Placed",
    description: "Awaiting review",
    icon: Clock,
  },
  {
    status: "Processing",
    label: "Processing",
    description: "Packaging & QA",
    icon: Package,
  },
  {
    status: "Shipped",
    label: "Dispatched",
    description: "In transit with courier",
    icon: Truck,
  },
  {
    status: "Delivered",
    label: "Delivered",
    description: "Completed & received",
    icon: CheckCircle2,
  },
];

const STATUS_ORDER = ["Pending", "Processing", "Shipped", "Delivered"];

export default function OrderLifecycleStepper({
  currentStatus = "Pending",
  onStatusChange,
  isUpdating = false,
}) {
  const isCancelled = currentStatus === "Cancelled";
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  const getNextStatus = () => {
    if (currentIndex >= 0 && currentIndex < STATUS_ORDER.length - 1) {
      return STATUS_ORDER[currentIndex + 1];
    }
    return null;
  };

  const nextStatus = getNextStatus();

  const handleAdvance = async () => {
    if (!nextStatus) return;
    const confirmed = await swalConfirm(
      `Advance order to ${nextStatus}?`,
      `This will update the order status and notify the customer via email/SMS.`
    );
    if (confirmed) {
      onStatusChange(nextStatus);
    }
  };

  const handleCancel = async () => {
    const confirmed = await swalConfirm(
      "Cancel this order?",
      "Cancelled orders restore inventory back to stock."
    );
    if (confirmed) {
      onStatusChange("Cancelled");
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-2xs space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Order Fulfillment Pipeline
          </span>
          <p className="text-sm font-semibold text-foreground mt-0.5">
            Current Stage:{" "}
            <span
              className={
                isCancelled
                  ? "text-rose-600 dark:text-rose-400 font-bold"
                  : "text-primary font-bold"
              }
            >
              {currentStatus}
            </span>
          </p>
        </div>

        {/* Quick Lifecycle Advance Button */}
        <div className="flex items-center gap-2">
          {!isCancelled && nextStatus && (
            <Button
              type="button"
              size="sm"
              onClick={handleAdvance}
              disabled={isUpdating}
              className="h-9 px-4 rounded-xl text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
            >
              {isUpdating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ArrowRight className="size-3.5" />
              )}
              Advance to {nextStatus}
            </Button>
          )}

          {/* Manual Status Dropdown */}
          <Select
            value={currentStatus}
            onValueChange={(val) => onStatusChange(val)}
            disabled={isUpdating}
          >
            <SelectTrigger className="h-9 min-w-[130px] rounded-xl text-xs font-medium bg-background border-border/60">
              <SelectValue placeholder="Change Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border bg-card">
              {["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map(
                (s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {s}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>

          {!isCancelled && currentStatus !== "Delivered" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isUpdating}
              className="h-9 px-3 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/10 cursor-pointer"
            >
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      {/* Stepper Pipeline */}
      {isCancelled ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400">
          <XCircle className="size-5 shrink-0" />
          <div className="flex-1 min-w-0 text-xs">
            <p className="font-bold">This order was cancelled</p>
            <p className="opacity-90">
              Reserved stock was returned to inventory. Customer has been notified.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onStatusChange("Pending")}
            disabled={isUpdating}
            className="h-8 rounded-lg text-xs font-semibold gap-1.5 border-rose-500/30 text-rose-600 hover:bg-rose-500/20"
          >
            <RotateCcw className="size-3" />
            Reopen Order
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {ORDER_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = currentIndex > idx;
            const isCurrent = currentIndex === idx;

            return (
              <div
                key={step.status}
                className={`relative p-3.5 rounded-xl border transition-all ${
                  isCurrent
                    ? "border-primary/50 bg-primary/10 shadow-2xs"
                    : isCompleted
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-border/40 bg-muted/20 opacity-60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : isCompleted
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <Icon className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-bold truncate ${
                        isCurrent
                          ? "text-primary font-bold"
                          : isCompleted
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground font-medium"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

