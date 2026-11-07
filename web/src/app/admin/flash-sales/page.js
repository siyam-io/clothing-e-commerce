"use client";

import { useState } from "react";
import { useAdminFlashSales } from "@/app/admin/flash-sales/lib/useAdminFlashSales";
import Link from "next/link";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminHeaderButton } from "@/app/admin/_components/AdminPageHeader";
import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from "@/app/admin/_components/AdminCard";
import AdminDeleteModal from "@/app/admin/_components/AdminDeleteModal";
import AdminStatusBadge from "@/app/admin/_components/AdminStatusBadge";
import { swalToast, swalError } from "@/utils/swal";
import CountdownTimer from "@/components/common/CountdownTimer";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Zap, 
  Clock, 
  Package, 
  Power,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useFilters } from "@/app/admin/_hooks/useFilters";
import Pagination from "@/components/common/Pagination";

export default function FlashSaleListPage() {
  const { page, setPage, queryParams } = useFilters({ initialLimit: 30 });
  const { flashSales, total, pages, isLoading, updateFlashSale, deleteFlashSale } = useAdminFlashSales(queryParams);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleActive = async (saleId, currentActive) => {
    try {
      await updateFlashSale({ id: saleId, data: { isActive: !currentActive } });
      swalToast(`Sale ${!currentActive ? "activated" : "deactivated"}`, "success");
    } catch (err) {
      swalError("Error", "Could not update sale status.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteFlashSale(deleteTarget.id);
      swalToast("Flash sale deleted successfully", "success");
      setDeleteTarget(null);
    } catch (err) {
      swalError("Delete Failed", "Could not delete flash sale.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Flash Sales"
        description={`Configure limited-time flash discount events and product bundles · ${total || 0} total`}
        actions={
          <AdminHeaderButton href="/admin/flash-sales/new" icon={Plus}>
            New Flash Sale
          </AdminHeaderButton>
        }
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {isLoading ? (
            [1, 2, 3].map((n) => (
              <AdminCard key={n} className="min-h-[280px] p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <Skeleton className="size-14 rounded-xl" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-8 w-3/4 rounded-lg" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </AdminCard>
            ))
          ) : flashSales?.length === 0 ? (
            <AdminCard className="col-span-full border-dashed p-12 text-center flex flex-col items-center justify-center">
              <div className="size-12 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
                <Zap className="size-6 opacity-40" />
              </div>
              <h3 className="text-base font-semibold text-foreground tracking-tight">No Flash Sales Created</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                Launch a limited-time flash discount with custom countdown timers to boost sales.
              </p>
              <Button asChild size="sm" className="rounded-xl font-medium">
                <Link href="/admin/flash-sales/new">
                  <Plus className="size-3.5 mr-1.5" /> Create Flash Sale
                </Link>
              </Button>
            </AdminCard>
          ) : (
            flashSales.map((sale) => {
              const now = new Date();
              const start = new Date(sale.startDate);
              const end = new Date(sale.endDate);
              let status = "active";
              let statusLabel = "Active";
              if (!sale.isActive || now > end) {
                status = "inactive";
                statusLabel = now > end ? "Ended" : "Inactive";
              } else if (now < start) {
                status = "pending";
                statusLabel = "Upcoming";
              }

              return (
                <AdminCard key={sale._id} className="flex flex-col justify-between hover:border-border transition-colors">
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="size-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex flex-col items-center justify-center shrink-0">
                          <span className="text-base font-bold tabular-nums leading-none">{sale.discount}%</span>
                          <span className="text-[9px] font-semibold tracking-wider">OFF</span>
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-foreground tracking-tight line-clamp-1">
                            {sale.name}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {sale.products?.length || 0} product{sale.products?.length === 1 ? "" : "s"} included
                          </span>
                        </div>
                      </div>

                      <AdminStatusBadge value={status} label={statusLabel} />
                    </div>

                    {status === "pending" && (
                      <div className="p-3 bg-muted/30 rounded-xl border border-border/40 text-center space-y-1">
                        <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">Starts in:</span>
                        <CountdownTimer targetDate={start} />
                      </div>
                    )}

                    <div className="space-y-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-3.5" /> Starts:
                        </span>
                        <span className="text-foreground font-medium">
                          {start.toLocaleDateString()} {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="size-3.5" /> Ends:
                        </span>
                        <span className="text-foreground font-medium">
                          {end.toLocaleDateString()} {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 p-4 border-t border-border/40 bg-muted/20">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(sale._id, sale.isActive)}
                      className="h-8 px-3 rounded-lg text-xs font-medium gap-1.5"
                    >
                      <Power className="size-3" />
                      {sale.isActive ? "Deactivate" : "Activate"}
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button asChild variant="outline" size="sm" className="h-8 px-3 rounded-lg text-xs font-medium gap-1.5">
                        <Link href={`/admin/flash-sales/${sale._id}`}>
                          <Edit2 className="size-3" /> Edit
                        </Link>
                      </Button>
                      <Button 
                        type="button"
                        variant="outline" 
                        size="icon-sm" 
                        onClick={() => setDeleteTarget({ id: sale._id, name: sale.name })}
                        className="size-8 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 border-border/60"
                        title="Delete sale"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </AdminCard>
              );
            })
          )}
        </div>

        {pages > 1 && (
          <div className="flex justify-center pt-6">
            <Pagination 
              page={page} 
              totalPages={pages} 
              onPageChange={setPage} 
            />
          </div>
        )}
      </div>

      <AdminDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Flash Sale"
        itemName={deleteTarget?.name}
        description="Are you sure you want to delete this flash sale? Associated products will revert to their regular pricing."
        isLoading={isDeleting}
      />
    </AdminPageContainer>
  );
}
