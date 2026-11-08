"use client";

import { useState, useCallback, Suspense, useMemo } from "react";
import { useAdminOrders } from "@/app/admin/orders/lib/useAdminOrders";
import { useFilters } from "@/app/admin/_hooks/useFilters";
import TableSkeleton from "@/components/common/TableSkeleton";
import OrdersSearchAndFilter from "./components/OrdersSearchAndFilter";
import OrdersTable from "./components/OrdersTable";
import { Store, RefreshCw, Zap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { swalToast, swalError } from "@/utils/swal";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, {
  AdminHeaderButton,
  AdminHeaderStat,
} from "@/app/admin/_components/AdminPageHeader";
import { AdminCard, AdminCardContent } from "@/app/admin/_components/AdminCard";
import AdminDeleteModal from "@/app/admin/_components/AdminDeleteModal";

function AdminOrdersContent() {
  const { search, setSearch, sort, setSort, page, setPage, queryParams } =
    useFilters({
      initialLimit: 30,
      initialSort: "-createdAt",
    });

  const [status, setStatus] = useState("all");
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const finalQueryParams = useMemo(
    () => ({
      ...queryParams,
      status: status !== "all" ? status : undefined,
    }),
    [queryParams, status]
  );

  const {
    orders,
    total,
    pages,
    isLoading,
    isAllFetching,
    refetch,
    newOrderIds,
    isSocketConnected,
    updateOrder,
    deleteOrder,
  } = useAdminOrders(finalQueryParams);

  const handleQuickStatusUpdate = async (id, newStatus) => {
    try {
      await updateOrder({ id, data: { orderStatus: newStatus } });
      swalToast(`Order updated to ${newStatus}`, "success");
    } catch (err) {
      swalError("Update Failed", err.response?.data?.message || "Could not update order status.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await deleteOrder(deleteTargetId);
      swalToast("Order deleted successfully", "success");
      setDeleteTargetId(null);
    } catch (err) {
      swalError("Delete Failed", err.response?.data?.message || "Could not delete order.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSearch = useCallback(
    (val) => {
      setSearch(val);
      setPage(1);
    },
    [setSearch, setPage]
  );

  const handleFilterStatusChange = (newStatus) => {
    setStatus(newStatus);
    setPage(1);
  };

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Orders"
        description="Monitor online and in-store customer orders, fulfillment status, and payments in real time"
        actions={
          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            {/* Live Socket Status Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-border/60 bg-card/80 backdrop-blur-md shadow-2xs">
              <span className="relative flex size-2">
                <span
                  className={cn(
                    "absolute inline-flex h-full w-full rounded-full opacity-75",
                    isSocketConnected ? "animate-ping bg-emerald-400" : "bg-amber-400"
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex size-2 rounded-full",
                    isSocketConnected ? "bg-emerald-500" : "bg-amber-500"
                  )}
                />
              </span>
              <span className="text-muted-foreground font-mono tabular-nums text-[11px]">
                {isSocketConnected ? "Live Socket" : "Connecting..."}
              </span>
            </div>

            {/* Glowing New Orders Badge */}
            {newOrderIds && newOrderIds.size > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse shadow-sm">
                <Zap className="size-3" />
                <span>+{newOrderIds.size} New</span>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-8 gap-1.5 text-xs rounded-xl border-border/70 bg-card hover:bg-muted text-foreground transition-[background-color,transform] active:scale-95 shadow-2xs"
              disabled={isAllFetching}
              title="Force Refresh Orders"
            >
              <RefreshCw className={cn("size-3.5", isAllFetching && "animate-spin")} />
              <span className="hidden sm:inline">Sync</span>
            </Button>

            <AdminHeaderStat label="Total Orders" value={total || 0} />

            <AdminHeaderButton
              href="/admin/orders/new"
              icon={Plus}
              className="bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-[0.98] shadow-sm"
            >
              New Order (POS)
            </AdminHeaderButton>
          </div>
        }
      />

      <AdminCard className="rounded-2xl border-border/70 shadow-sm backdrop-blur-xl bg-card/90 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border/40 bg-muted/15">
          <OrdersSearchAndFilter
            status={status}
            onStatusChange={handleFilterStatusChange}
            search={search}
            onSearchChange={handleSearch}
            sort={sort}
            onSortChange={setSort}
          />
        </div>

        <AdminCardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rowCount={8} colCount={5} />
            </div>
          ) : (
            <OrdersTable
              orders={orders}
              page={page}
              pages={pages}
              onPageChange={setPage}
              isAllFetching={isAllFetching}
              onQuickStatusUpdate={handleQuickStatusUpdate}
              onDeleteOrder={(id) => setDeleteTargetId(id)}
              newOrderIds={newOrderIds}
            />
          )}
        </AdminCardContent>
      </AdminCard>

      <AdminDeleteModal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Order"
        description="Are you sure you want to permanently delete this order? All inventory and payment records associated with this order will be permanently affected."
        isLoading={isDeleting}
      />
    </AdminPageContainer>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <AdminPageContainer>
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </AdminPageContainer>
      }
    >
      <AdminOrdersContent />
    </Suspense>
  );
}
