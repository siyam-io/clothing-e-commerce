"use client";

import { useState } from "react";
import Link from "next/link";
import { useSizes } from "@/app/admin/sizes/lib/useSizes";
import { useAdminCategories } from "@/app/admin/categories/lib/useAdminCategories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Edit2, Maximize2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { swalToast, swalError } from "@/utils/swal";
import { useFilters } from "@/app/admin/_hooks/useFilters";
import Pagination from "@/components/common/Pagination";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminHeaderButton } from "@/app/admin/_components/AdminPageHeader";
import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from "@/app/admin/_components/AdminCard";
import AdminDataTable from "@/app/admin/_components/AdminDataTable";
import AdminDeleteModal from "@/app/admin/_components/AdminDeleteModal";

export default function SizesPage() {
  const { page, setPage, category: selectedCategory, setCategory: setSelectedCategory, queryParams } = useFilters({ initialLimit: 30 });
  const { categories, isLoading: categoriesLoading } = useAdminCategories();
  const { sizes, total, pages, isLoading, deleteSize } = useSizes(queryParams);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteSize.mutateAsync(deleteTarget.id);
      swalToast("Size deleted successfully", "success");
      setDeleteTarget(null);
    } catch (err) {
      swalError("Delete Failed", err.response?.data?.message || "Could not delete size.");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      label: "Size Name",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-muted/60 border border-border/60 flex items-center justify-center text-muted-foreground font-semibold text-xs shrink-0">
            {item.name}
          </div>
          <span className="font-semibold text-foreground text-sm tracking-tight">{item.name}</span>
        </div>
      ),
    },
    {
      label: "Description / Measurements",
      render: (item) => (
        <span className="text-xs text-muted-foreground">{item.description || "—"}</span>
      ),
    },
    {
      label: "Parent Category",
      render: (item) => (
        <Badge variant="outline" className="text-xs font-medium px-2.5 py-0.5 rounded-full border-border/60 bg-muted/40">
          {item.category?.name || "Global / Unassigned"}
        </Badge>
      ),
    },
  ];

  if (isLoading || categoriesLoading) {
    return (
      <AdminPageContainer>
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </AdminPageContainer>
    );
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Sizes"
        description={`Manage size variations and fit measurements across product categories · ${total || 0} total`}
        actions={
          <AdminHeaderButton href="/admin/sizes/new" icon={Plus}>
            Add Size
          </AdminHeaderButton>
        }
      />

      {/* Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">Filter by Category:</span>
          <Select
            value={selectedCategory || "all"}
            onValueChange={(val) => setSelectedCategory(val)}
          >
            <SelectTrigger className="h-9 min-w-[200px] bg-background/80 rounded-xl border-border/60 text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border rounded-xl">
              <SelectItem value="all" className="text-xs">All Categories</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat._id} value={cat._id} className="text-xs">
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCategory && selectedCategory !== "all" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCategory("all")}
            className="h-8 px-2.5 rounded-lg text-xs text-muted-foreground hover:text-foreground self-end sm:self-auto"
          >
            Clear Filter
          </Button>
        )}
      </div>

      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle>Sizing Matrix</AdminCardTitle>
        </AdminCardHeader>
        <AdminCardContent className="p-0">
          <AdminDataTable
            columns={columns}
            data={sizes || []}
            emptyTitle="No sizes found"
            emptyDescription="Create your first size option for this category."
            emptyActionLabel="Add Size"
            onEmptyAction={() => window.location.href = "/admin/sizes/new"}
            actions={(item) => (
              <div className="flex items-center gap-1.5 justify-end">
                <Button asChild variant="ghost" size="icon-sm" className="size-8 rounded-lg">
                  <Link href={`/admin/sizes/${item._id}`}>
                    <Edit2 className="size-3.5" />
                  </Link>
                </Button>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon-sm" 
                  onClick={() => setDeleteTarget({ id: item._id, name: item.name })}
                  className="size-8 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
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
        title="Delete Size"
        itemName={deleteTarget?.name}
        description="Are you sure you want to delete this size? Products referencing this size will no longer display it."
        isLoading={isDeleting}
      />
    </AdminPageContainer>
  );
}
