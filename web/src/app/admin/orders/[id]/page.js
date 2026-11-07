"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useAdminOrders } from "@/app/admin/orders/lib/useAdminOrders";
import { swalConfirm, swalToast, swalError } from "@/utils/swal";
import Loader from "@/components/common/Loader";
import { Zap, Truck, Edit2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminBackLink } from "@/app/admin/_components/AdminPageHeader";
import AdminStatusBadge from "@/app/admin/_components/AdminStatusBadge";

// Domain modular components
import OrderItemsManifest from "@/app/admin/orders/components/OrderItemsManifest";
import OrderCustomerDetailsCard from "@/app/admin/orders/components/OrderCustomerDetailsCard";
import PaymentDetailsCard from "@/app/admin/orders/components/PaymentDetailsCard";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const {
    orderDetails: order,
    orderDetailsLoading,
    updateOrder,
    syncToPathao,
  } = useAdminOrders({}, id);
  const [syncing, setSyncing] = useState(false);

  const customerName = useMemo(
    () => order?.user?.name || order?.shippingAddress?.name || "Guest Customer",
    [order],
  );
  const customerEmail = useMemo(
    () => order?.user?.email || order?.shippingAddress?.email || "No email",
    [order],
  );
  const isRegistered = !!order?.user;

  const handleStatusUpdate = async (newStatus) => {
    try {
      await updateOrder({ id: order._id, data: { orderStatus: newStatus } });
      swalToast(`Order updated to ${newStatus}`, "success");
    } catch (err) {
      swalError("Update Failed", err.response?.data?.message || "Could not update order status.");
    }
  };

  const handlePathaoSync = async () => {
    const confirmed = await swalConfirm(
      "Sync Consignment to Pathao?",
      "This will create an official delivery consignment in Pathao Courier.",
    );
    if (confirmed) {
      try {
        setSyncing(true);
        await syncToPathao(order._id);
        swalToast("Successfully synced with Pathao!", "success");
      } catch (err) {
        swalError(
          "Pathao Sync Failed",
          err.response?.data?.message || "Please check delivery address and Pathao credentials.",
        );
      } finally {
        setSyncing(false);
      }
    }
  };

  if (orderDetailsLoading) {
    return (
      <div className="admin-page-container flex items-center justify-center min-h-[50vh]">
        <Loader />
      </div>
    );
  }

  if (!order) {
    return (
      <AdminPageContainer>
        <AdminBackLink href="/admin/orders" label="Back to Orders" />
        <div className="p-16 text-center text-muted-foreground font-medium text-sm">
          Order record not found.
        </div>
      </AdminPageContainer>
    );
  }

  return (
    <AdminPageContainer maxWidth="max-w-6xl">
      <AdminBackLink href="/admin/orders" label="Back to Orders" />

      {/* HEADER & ACTIONS */}
      <AdminPageHeader
        title={`Order #${order._id.slice(-8).toUpperCase()}`}
        description={`Placed on ${new Date(order.createdAt).toLocaleDateString()} at ${new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
        badge={
          <AdminStatusBadge value={order.orderStatus} />
        }
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-10 px-4 rounded-xl text-xs font-medium gap-1.5"
            >
              <Link href={`/admin/orders/${id}/edit`}>
                <Edit2 className="size-3.5" />
                Edit Order
              </Link>
            </Button>

            <Select
              value={order.orderStatus}
              onValueChange={handleStatusUpdate}
            >
              <SelectTrigger className="h-10 min-w-[140px] bg-background/80 border-border/60 rounded-xl text-xs font-medium">
                <SelectValue placeholder="Update Status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border rounded-xl">
                {["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {order.pathaoConsignmentId ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-3.5 h-10 rounded-xl flex items-center gap-2 text-xs font-medium">
                <Truck className="size-3.5" />
                <span>Pathao: {order.pathaoConsignmentId}</span>
              </div>
            ) : (
              <Button
                onClick={handlePathaoSync}
                disabled={
                  syncing ||
                  ["Cancelled", "Delivered"].includes(order.orderStatus)
                }
                size="sm"
                className="h-10 px-4 rounded-xl text-xs font-medium gap-1.5 shadow-2xs"
              >
                {syncing ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Zap className="size-3.5" />
                    Sync to Pathao
                  </>
                )}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Order items breakdown (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <OrderItemsManifest order={order} />
        </div>

        {/* RIGHT: Customer & Payment summary (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <OrderCustomerDetailsCard
            order={order}
            customerName={customerName}
            customerEmail={customerEmail}
            isRegistered={isRegistered}
          />

          <PaymentDetailsCard order={order} />
        </div>
      </div>
    </AdminPageContainer>
  );
}
