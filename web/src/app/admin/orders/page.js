"use client";

import { useState, useCallback, Suspense, useMemo } from "react";
import { useAdminOrders } from "@/app/admin/orders/lib/useAdminOrders";
import { useFilters } from "@/app/admin/_hooks/useFilters";
import TableSkeleton from "@/components/common/TableSkeleton";
import OrdersSearchAndFilter from "./components/OrdersSearchAndFilter";
import OrdersTable from "./components/OrdersTable";
import { Store } from "lucide-react";
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
    [queryParams, status],
  );

  const { orders, total, pages, isLoading, isAllFetching, updateOrder, deleteOrder } =
    useAdminOrders(finalQueryParams);

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
    [setSearch, setPage],
  );

  const handleFilterStatusChange = (newStatus) => {
    setStatus(newStatus);
    setPage(1);
  };

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Orders"
        description="Monitor online and in-store customer orders, shipment status, and payments"
        actions={
          <div className="flex items-center gap-3">
            <AdminHeaderStat label="Total Orders" value={total || 0} />
            <AdminHeaderButton href="/admin/pos" icon={Store}>
              POS Terminal
            </AdminHeaderButton>
          </div>
        }
      />

      <AdminCard>
        <div className="p-4 sm:p-5 border-b border-border/40 bg-muted/20">
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
