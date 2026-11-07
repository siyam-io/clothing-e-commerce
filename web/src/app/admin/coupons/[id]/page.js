"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminCoupons } from "@/app/admin/coupons/lib/useAdminCoupons";
import Loader from "@/components/common/Loader";
import Link from "next/link";
import { 
  Ticket, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Edit2, 
  Power,
  Calendar,
  User as UserIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/common/Pagination";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminBackLink } from "@/app/admin/_components/AdminPageHeader";
import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from "@/app/admin/_components/AdminCard";
import AdminDataTable from "@/app/admin/_components/AdminDataTable";
import AdminStatusBadge from "@/app/admin/_components/AdminStatusBadge";
import { swalToast, swalError } from "@/utils/swal";
import { Price } from "@/components/common/Price";

export default function CouponDetailPage() {
  const { id } = useParams();
  const [usagePage, setUsagePage] = useState(1);
  const { getCoupon, updateCoupon } = useAdminCoupons();
  const { data: coupon, isLoading: isCouponLoading } = getCoupon(id, { page: usagePage, limit: 10 });

  if (isCouponLoading) {
    return (
      <div className="admin-page-container flex items-center justify-center min-h-[50vh]">
        <Loader />
      </div>
    );
  }

  const pagination = coupon?.usagePagination;

  const handleToggleActive = async () => {
    try {
      await updateCoupon({ id, data: { isActive: !coupon.isActive } });
      swalToast(`Coupon ${coupon.isActive ? "deactivated" : "activated"}`, "success");
    } catch (err) {
      swalError("Update Failed", err.response?.data?.message || "Could not update status.");
    }
  };

  const usageColumns = [
    {
      label: "Customer",
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border/60">
            <UserIcon className="size-4" />
          </div>
          <div>
            <span className="font-semibold text-xs text-foreground">{item.user?.name || "Guest Checkout"}</span>
            <span className="block text-[11px] text-muted-foreground">{item.user?.email || "—"}</span>
          </div>
        </div>
      ),
    },
    {
      label: "Order",
      render: (item) => (
        <Link
          href={`/admin/orders/${item.order?._id || item.order}`}
          className="font-mono text-xs font-semibold text-primary hover:underline"
        >
          #{String(item.order?._id || item.order).slice(-8).toUpperCase()}
        </Link>
      ),
    },
    {
      label: "Discount Given",
      render: (item) => (
        <Price
          amount={item.discountAmount || coupon?.discountValue || 0}
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400"
        />
      ),
    },
    {
      label: "Used On",
      render: (item) => (
        <span className="text-xs text-muted-foreground">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
  ];

  return (
    <AdminPageContainer maxWidth="max-w-6xl">
      <AdminBackLink href="/admin/coupons" label="Back to Coupons" />

      <AdminPageHeader
        title={`Coupon: ${coupon?.code || ""}`}
        description={`Created on ${new Date(coupon?.createdAt).toLocaleDateString()} · ${coupon?.discountType === "percentage" ? `${coupon?.discountValue}% discount` : `৳${coupon?.discountValue} fixed discount`}`}
        badge={
          <AdminStatusBadge
            value={coupon?.isActive ? "active" : "inactive"}
            label={coupon?.isActive ? "Active" : "Inactive"}
          />
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleActive}
              className="h-10 px-4 rounded-xl text-xs font-medium gap-1.5"
            >
              <Power className="size-3.5" />
              {coupon?.isActive ? "Deactivate" : "Activate"}
            </Button>
            <Button asChild size="sm" className="h-10 px-4 rounded-xl text-xs font-medium gap-1.5 shadow-2xs">
              <Link href={`/admin/coupons/${id}/edit`}>
                <Edit2 className="size-3.5" />
                Edit Coupon
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium">Times Used</span>
            <Users className="size-4" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {coupon?.usedCount || 0}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1">
            Max limit: {coupon?.usageLimit || "Unlimited"}
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium">Discount Value</span>
            <Ticket className="size-4" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {coupon?.discountType === "percentage" ? (
              `${coupon?.discountValue}%`
            ) : (
              <Price amount={coupon?.discountValue || 0} />
            )}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1 capitalize">
            {coupon?.discountType} discount
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium">Minimum Spend</span>
            <ShoppingBag className="size-4" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            <Price amount={coupon?.minPurchase || 0} />
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1">
            Required order total
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium">Expires On</span>
            <Calendar className="size-4" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            {coupon?.endDate ? new Date(coupon.endDate).toLocaleDateString() : "Never"}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1">
            Valid until midnight
          </p>
        </div>
      </div>

      {/* Redemption / Usage History */}
      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle>Redemption History</AdminCardTitle>
        </AdminCardHeader>
        <AdminCardContent className="p-0">
          <AdminDataTable
            columns={usageColumns}
            data={coupon?.usages || []}
            emptyTitle="No Redemptions Yet"
            emptyDescription="This coupon code has not been redeemed in any completed order."
            pagination={{
              page: usagePage,
              totalPages: pagination?.pages || 1,
              total: pagination?.total,
              onPageChange: setUsagePage,
            }}
          />
        </AdminCardContent>
      </AdminCard>
    </AdminPageContainer>
  );
}
