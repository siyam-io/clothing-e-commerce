"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminCoupons } from "@/app/admin/coupons/lib/useAdminCoupons";
import { swalToast, swalError } from "@/utils/swal";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Ticket, 
  Eye,
  Power
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFilters } from "@/app/admin/_hooks/useFilters";
import Pagination from "@/components/common/Pagination";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminHeaderButton } from "@/app/admin/_components/AdminPageHeader";
import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from "@/app/admin/_components/AdminCard";
import AdminDataTable from "@/app/admin/_components/AdminDataTable";
import AdminStatusBadge from "@/app/admin/_components/AdminStatusBadge";
import AdminDeleteModal from "@/app/admin/_components/AdminDeleteModal";
import { Price } from "@/components/common/Price";

export default function CouponListPage() {
  const { page, setPage, queryParams } = useFilters({ initialLimit: 30 });
  const { coupons, total, pages, isLoading, deleteCoupon, updateCoupon } = useAdminCoupons(queryParams);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCoupon(deleteTarget.id);
      swalToast("Coupon deleted successfully", "success");
      setDeleteTarget(null);
    } catch (err) {
      swalError("Delete Failed", err.response?.data?.message || "Could not delete coupon.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await updateCoupon({ id: item._id, data: { isActive: !item.isActive } });
      swalToast(`Coupon ${item.isActive ? "deactivated" : "activated"}`, "success");
    } catch (err) {
      swalError("Update Failed", err.response?.data?.message || "Could not update coupon status.");
    }
  };

  const columns = [
    {
      label: "Coupon Code",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Ticket className="size-4" />
          </div>
          <div>
            <span className="font-mono font-semibold text-sm text-foreground tracking-wider uppercase">
              {item.code}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span>Min. spend:</span>
              <Price amount={item.minPurchase || 0} />
            </span>
          </div>
        </div>
      ),
    },
    {
      label: "Discount",
      render: (item) => (
        <div>
          <span className="font-semibold text-sm text-foreground flex items-center gap-1">
            {item.discountType === "percentage" ? (
              `${item.discountValue}% off`
            ) : (
              <>
                <Price amount={item.discountValue || 0} />
                <span>off</span>
              </>
            )}
          </span>
          <span className="block text-[11px] text-muted-foreground capitalize">
            {item.discountType} discount
          </span>
        </div>
      ),
    },
    {
      label: "Usage",
      render: (item) => {
        const limit = item.usageLimit || 0;
        const count = item.usedCount || 0;
        const percent = limit > 0 ? Math.min(Math.round((count / limit) * 100), 100) : 0;
        return (
          <div className="w-28 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground tabular-nums">
                {count} / {limit > 0 ? limit : "∞"}
              </span>
              {limit > 0 && (
                <span className="text-muted-foreground text-[11px] tabular-nums">{percent}%</span>
              )}
            </div>
            {limit > 0 && (
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            )}
          </div>
        );
      },
    },
    {
      label: "Expires On",
      render: (item) => (
        <span className="text-xs text-muted-foreground">
          {item.endDate
            ? new Date(item.endDate).toLocaleDateString()
            : "No expiry date"}
        </span>
      ),
    },
    {
      label: "Status",
      render: (item) => (
        <AdminStatusBadge
          value={item.isActive ? "active" : "inactive"}
          label={item.isActive ? "Active" : "Inactive"}
        />
      ),
    },
  ];

  if (isLoading) {
    return (
      <AdminPageContainer>
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </AdminPageContainer>
    );
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Coupons"
        description={`Create and manage discount codes, minimum spend rules, and usage limits · ${total || 0} total`}
        actions={
          <AdminHeaderButton href="/admin/coupons/new" icon={Plus}>
            Add Coupon
          </AdminHeaderButton>
        }
      />

      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle>Promotional Coupons</AdminCardTitle>
        </AdminCardHeader>
        <AdminCardContent className="p-0">
          <AdminDataTable
            columns={columns}
            data={coupons || []}
            emptyTitle="No coupons found"
            emptyDescription="Create your first promotional discount coupon to boost conversions."
            emptyActionLabel="Add Coupon"
            onEmptyAction={() => window.location.href = "/admin/coupons/new"}
            actions={(item) => (
              <div className="flex items-center gap-1 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleToggleActive(item)}
                  className="size-8 rounded-lg"
                  title={item.isActive ? "Deactivate coupon" : "Activate coupon"}
                >
                  <Power className="size-3.5" />
                </Button>
                <Button asChild variant="ghost" size="icon-sm" className="size-8 rounded-lg" title="View details">
                  <Link href={`/admin/coupons/${item._id}`}>
                    <Eye className="size-3.5" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="icon-sm" className="size-8 rounded-lg" title="Edit coupon">
                  <Link href={`/admin/coupons/${item._id}/edit`}>
                    <Edit2 className="size-3.5" />
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleteTarget({ id: item._id, name: item.code })}
                  className="size-8 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                  title="Delete coupon"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            )}
            pagination={{
              page,
              totalPages: pages || 1,
              total,
              onPageChange: setPage,
            }}
          />
        </AdminCardContent>
      </AdminCard>

      <AdminDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Coupon"
        itemName={deleteTarget?.name}
        description="Are you sure you want to permanently delete this coupon code? Customers will no longer be able to apply it at checkout."
        isLoading={isDeleting}
      />
    </AdminPageContainer>
  );
}
