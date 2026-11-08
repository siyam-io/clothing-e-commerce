"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useAdminOrders } from "@/app/admin/orders/lib/useAdminOrders";
import { swalToast, swalError } from "@/utils/swal";
import { downloadOrderReceipt } from "@/utils/orderReceipt";
import Loader from "@/components/common/Loader";
import {
  Zap,
  Truck,
  Edit2,
  Loader2,
  FileDown,
  Printer,
  Copy,
  Check,
  Store,
  Globe,
  Trash2,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import { AdminBackLink } from "@/app/admin/_components/AdminPageHeader";
import AdminStatusBadge from "@/app/admin/_components/AdminStatusBadge";
import AdminDeleteModal from "@/app/admin/_components/AdminDeleteModal";

// Modular Order Components
import OrderLifecycleStepper from "@/app/admin/orders/components/OrderLifecycleStepper";
import OrderItemsManifest from "@/app/admin/orders/components/OrderItemsManifest";
import OrderCustomerDetailsCard from "@/app/admin/orders/components/OrderCustomerDetailsCard";
import PaymentDetailsCard from "@/app/admin/orders/components/PaymentDetailsCard";
import OrderLogisticsCard from "@/app/admin/orders/components/OrderLogisticsCard";
import PosReceiptModal from "@/app/admin/orders/components/pos/PosReceiptModal";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const {
    orderDetails: order,
    orderDetailsLoading,
    updateOrder,
    syncToPathao,
    deleteOrder,
  } = useAdminOrders({}, id);

  const [isUpdating, setIsUpdating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const customerName = useMemo(
    () => order?.user?.name || order?.shippingAddress?.name || "Guest Customer",
    [order]
  );
  const customerEmail = useMemo(
    () => order?.user?.email || order?.shippingAddress?.email || "No email",
    [order]
  );
  const isRegistered = Boolean(order?.user);

  // Status progression update
  const handleStatusChange = async (newStatus) => {
    try {
      setIsUpdating(true);
      await updateOrder.mutateAsync({
        id: order._id,
        data: { orderStatus: newStatus },
      });
      swalToast(`Order updated to ${newStatus}`, "success");
    } catch (err) {
      swalError(
        "Update Failed",
        err.response?.data?.message || "Could not update order status."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Payment status update
  const handleUpdatePaymentStatus = async (status) => {
    try {
      setIsUpdating(true);
      await updateOrder.mutateAsync({
        id: order._id,
        data: {
          paymentResult: {
            ...(order.paymentResult || {}),
            status: status,
          },
        },
      });
      swalToast(`Payment status updated to ${status}`, "success");
    } catch (err) {
      swalError(
        "Update Failed",
        err.response?.data?.message || "Could not update payment status."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Pathao Courier Sync
  const handlePathaoSync = async () => {
    try {
      setIsSyncing(true);
      await syncToPathao.mutateAsync(order._id);
      swalToast("Consignment synced with Pathao successfully!", "success");
    } catch (err) {
      swalError(
        "Pathao Sync Failed",
        err.response?.data?.message || "Please check delivery address and credentials."
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Download PDF Invoice
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await downloadOrderReceipt(order._id, order.shippingAddress?.phone);
      swalToast("Invoice downloaded successfully", "success");
    } catch (err) {
      swalError("Download Failed", err.message || "Could not generate invoice.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Delete Order
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteOrder.mutateAsync(order._id);
      swalToast("Order deleted successfully", "success");
      router.push("/admin/orders");
    } catch (err) {
      swalError(
        "Delete Failed",
        err.response?.data?.message || "Could not delete order."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order._id);
    setCopiedId(true);
    swalToast("Copied Order ID", "success");
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (orderDetailsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
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

  const isPosSale = order.paymentMethod?.toLowerCase().includes("pos") || order.isDirectBuy;
  const shortId = order._id?.slice(-8).toUpperCase();

  return (
    <AdminPageContainer maxWidth="max-w-6xl">
      <AdminBackLink href="/admin/orders" label="Back to Orders" />

      {/* EXECUTIVE ORDER HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              Order #{shortId}
              <button
                type="button"
                onClick={handleCopyOrderId}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
                title="Copy Full Order ID"
              >
                {copiedId ? (
                  <Check className="size-4 text-emerald-500" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>
            </h1>

            <AdminStatusBadge value={order.orderStatus} />

            <Badge
              variant="outline"
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border-border/60 flex items-center gap-1.5"
            >
              {isPosSale ? (
                <>
                  <Store className="size-3 text-primary" />
                  POS In-Store
                </>
              ) : (
                <>
                  <Globe className="size-3 text-blue-500" />
                  Online Storefront
                </>
              )}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground">
            Placed on{" "}
            <span className="text-foreground font-medium">
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>{" "}
            at{" "}
            <span className="text-foreground font-medium">
              {new Date(order.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </p>
        </div>

        {/* TOP QUICK ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Download Official PDF Invoice */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="h-9 px-3.5 rounded-xl text-xs font-semibold gap-1.5 border-border/60 bg-background/80 hover:bg-muted text-foreground cursor-pointer shadow-2xs"
          >
            {downloadingPdf ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FileDown className="size-3.5 text-primary" />
            )}
            PDF Invoice
          </Button>

          {/* Print 80mm POS Thermal Receipt */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowReceiptModal(true)}
            className="h-9 px-3.5 rounded-xl text-xs font-semibold gap-1.5 border-border/60 bg-background/80 hover:bg-muted text-foreground cursor-pointer shadow-2xs"
          >
            <Printer className="size-3.5 text-primary" />
            POS Receipt
          </Button>

          {/* Edit in POS */}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 px-3.5 rounded-xl text-xs font-semibold gap-1.5 bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 shadow-2xs cursor-pointer"
          >
            <Link href={`/admin/pos?orderId=${id}`}>
              <Edit2 className="size-3.5" />
              Edit in POS
            </Link>
          </Button>

          {/* Delete Order */}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowDeleteModal(true)}
            className="size-9 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 cursor-pointer"
            title="Delete Order"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* LIFECYCLE PROGRESS PIPELINE */}
      <OrderLifecycleStepper
        currentStatus={order.orderStatus}
        onStatusChange={handleStatusChange}
        isUpdating={isUpdating}
      />

      {/* MAIN TWO-COLUMN DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-1">
        {/* LEFT COLUMN: Order Items & Financial Calculation (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <OrderItemsManifest order={order} />
        </div>

        {/* RIGHT COLUMN: Customer, Payment & Logistics (4 Cols) */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Customer Profile Card */}
          <OrderCustomerDetailsCard
            order={order}
            customerName={customerName}
            customerEmail={customerEmail}
            isRegistered={isRegistered}
          />

          {/* Payment Details Card with Mark as Paid */}
          <PaymentDetailsCard
            order={order}
            onUpdatePaymentStatus={handleUpdatePaymentStatus}
            isUpdating={isUpdating}
          />

          {/* Logistics & Pathao Courier Card */}
          <OrderLogisticsCard
            order={order}
            onSyncPathao={handlePathaoSync}
            isSyncing={isSyncing}
          />
        </aside>
      </div>

      {/* 80mm Thermal Receipt Modal */}
      {showReceiptModal && (
        <PosReceiptModal
          order={order}
          onClose={() => setShowReceiptModal(false)}
          storeName="STORE ATELIER"
        />
      )}

      {/* Confirm Order Delete Modal */}
      <AdminDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Order"
        itemName={`Order #${shortId}`}
        description="Are you sure you want to permanently remove this order? This action cannot be undone."
        isLoading={isDeleting}
      />
    </AdminPageContainer>
  );
}
