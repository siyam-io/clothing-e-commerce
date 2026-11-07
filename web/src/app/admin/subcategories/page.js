"use client";

import { useState } from "react";
import Link from "next/link";
import { useSubcategories } from "@/app/admin/subcategories/lib/useSubcategories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Edit2, Layers } from "lucide-react";
import { swalToast, swalError } from "@/utils/swal";
import { useFilters } from "@/app/admin/_hooks/useFilters";
import Pagination from "@/components/common/Pagination";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminHeaderButton } from "@/app/admin/_components/AdminPageHeader";
import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from "@/app/admin/_components/AdminCard";
import AdminDataTable from "@/app/admin/_components/AdminDataTable";
import AdminDeleteModal from "@/app/admin/_components/AdminDeleteModal";

export default function Subcategories() {
  const { page, setPage, queryParams } = useFilters({ initialLimit: 30 });
  const { subcategories, total, pages, isLoading, deleteSubcategory } = useSubcategories(queryParams);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteSubcategory.mutateAsync(deleteTarget.id);
      swalToast("Subcategory deleted", "success");
      setDeleteTarget(null);
    } catch (err) {
      swalError("Delete Failed", err.response?.data?.message || "Could not delete subcategory.");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      label: "Subcategory Name",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-muted/60 border border-border/60 flex items-center justify-center text-muted-foreground shrink-0">
            <Layers className="size-4" />
          </div>
          <div>
            <span className="font-semibold text-foreground text-sm tracking-tight">{item.name}</span>
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 max-w-sm">{item.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      label: "Slug",
      render: (item) => (
        <span className="font-mono text-xs text-muted-foreground">/{item.slug}</span>
      ),
    },
    {
      label: "Parent Category",
      render: (item) => (
        <Badge variant="outline" className="text-xs font-medium px-2.5 py-0.5 rounded-full border-border/60 bg-muted/40">
          {item.category?.name || "Uncategorized"}
        </Badge>
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
        title="Subcategories"
        description={`Manage departmental segments and subcategory classifications · ${total || 0} total`}
        actions={
          <AdminHeaderButton href="/admin/subcategories/new" icon={Plus}>
            Add Subcategory
          </AdminHeaderButton>
        }
      />

      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle>All Subcategories</AdminCardTitle>
        </AdminCardHeader>
        <AdminCardContent className="p-0">
          <AdminDataTable
            columns={columns}
            data={subcategories || []}
            emptyTitle="No subcategories found"
            emptyDescription="Create your first subcategory to organize products within parent categories."
            emptyActionLabel="Add Subcategory"
            onEmptyAction={() => window.location.href = "/admin/subcategories/new"}
            actions={(item) => (
              <div className="flex items-center gap-1.5 justify-end">
                <Button asChild variant="ghost" size="icon-sm" className="size-8 rounded-lg">
                  <Link href={`/admin/subcategories/${item._id}`}>
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
        title="Delete Subcategory"
        itemName={deleteTarget?.name}
        description="Are you sure you want to delete this subcategory? Associated products may be unassigned."
        isLoading={isDeleting}
      />
    </AdminPageContainer>
  );
}
