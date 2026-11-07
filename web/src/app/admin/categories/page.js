"use client";

import { useState, useCallback } from "react";
import { useAdminCategories } from "@/app/admin/categories/lib/useAdminCategories";
import { useSubcategories } from "@/app/admin/subcategories/lib/useSubcategories";
import { useSizes } from "@/app/admin/sizes/lib/useSizes";
import { getImageUrl } from "@/utils/imageUtils";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminHeaderButton } from "@/app/admin/_components/AdminPageHeader";
import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from "@/app/admin/_components/AdminCard";
import AdminDeleteModal from "@/app/admin/_components/AdminDeleteModal";
import { swalToast, swalError } from "@/utils/swal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Layers, Maximize2, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFilters } from "@/app/admin/_hooks/useFilters";
import Pagination from "@/components/common/Pagination";

export default function CategoryListPage() {
  const { page, setPage, queryParams } = useFilters({ initialLimit: 30 });
  const { categories, total, pages, isLoading: catLoading, deleteCategory, toggleFeatured } = useAdminCategories(queryParams);
  const {
    subcategories,
    isLoading: subLoading,
    deleteSubcategory,
  } = useSubcategories();
  const { sizes, isLoading: sizeLoading, deleteSize } = useSizes();

  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'category'|'subcategory'|'size', id, name }
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const handleToggleFeatured = useCallback(
    async (id, currentStatus) => {
      setTogglingId(id);
      try {
        await toggleFeatured({ id, isFeatured: !currentStatus });
        swalToast(currentStatus ? "Removed from featured" : "Category marked as featured", "success");
      } catch (err) {
        swalError("Update Failed", "Could not update featured status.");
      } finally {
        setTogglingId(null);
      }
    },
    [toggleFeatured]
  );

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === "category") {
        await deleteCategory(deleteTarget.id);
        swalToast("Category deleted", "success");
      } else if (deleteTarget.type === "subcategory") {
        await deleteSubcategory(deleteTarget.id);
        swalToast("Subcategory deleted", "success");
      } else if (deleteTarget.type === "size") {
        await deleteSize(deleteTarget.id);
        swalToast("Size deleted", "success");
      }
      setDeleteTarget(null);
    } catch (err) {
      swalError("Delete Failed", err.response?.data?.message || "Could not complete delete operation.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (catLoading || subLoading || sizeLoading) {
    return (
      <AdminPageContainer>
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      </AdminPageContainer>
    );
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Categories"
        description="Organize your store taxonomy, assign subcategories, and configure sizing matrices"
        actions={
          <AdminHeaderButton href="/admin/categories/new" icon={Plus}>
            Add Category
          </AdminHeaderButton>
        }
      />

      {/* Main Categories List */}
      <div className="space-y-4">
        {categories?.map((cat) => {
          const catSubs = subcategories?.filter(
            (s) => s.category?._id === cat._id || s.category === cat._id
          ) || [];
          const catSizes = sizes?.filter(
            (s) => s.category?._id === cat._id || s.category === cat._id
          ) || [];

          return (
            <AdminCard key={cat._id} className="transition-all hover:border-border">
              {/* Header: Visual Identity & Global Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-border/40 bg-muted/20">
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-xl overflow-hidden border border-border/60 bg-muted shrink-0 shadow-2xs">
                    {cat.image ? (
                      <img
                        src={getImageUrl(cat.image)}
                        alt={cat.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center text-muted-foreground">
                        <Layers className="size-6 opacity-30" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-base font-semibold text-foreground tracking-tight">
                        {cat.name}
                      </h3>
                      <Badge variant="outline" className="text-[11px] font-mono text-muted-foreground border-border/60">
                        /{cat.slug}
                      </Badge>
                      {cat.isFeatured && (
                        <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[11px]">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {catSubs.length} subcategor{catSubs.length === 1 ? "y" : "ies"} · {catSizes.length} size{catSizes.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleFeatured(cat._id, cat.isFeatured)}
                    disabled={togglingId === cat._id}
                    className={cn(
                      "h-9 px-3 rounded-xl text-xs font-medium gap-1.5",
                      cat.isFeatured ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                    )}
                    title={cat.isFeatured ? "Remove from featured" : "Mark as featured"}
                  >
                    <Star className="size-3.5" fill={cat.isFeatured ? "currentColor" : "none"} />
                    {cat.isFeatured ? "Featured" : "Feature"}
                  </Button>
                  <Button asChild variant="outline" size="sm" className="h-9 px-3 rounded-xl text-xs font-medium gap-1.5">
                    <Link href={`/admin/categories/${cat._id}`}>
                      <Edit2 className="size-3.5" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteTarget({ type: "category", id: cat._id, name: cat.name })}
                    className="h-9 px-3 rounded-xl text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 border-border/60"
                    title="Delete Category"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Subcategories & Sizes 2-Column Grid */}
              <AdminCardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Subcategories */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wider">
                      <Layers className="size-3.5 text-muted-foreground" />
                      Subcategories
                    </div>
                    <Button asChild variant="ghost" size="sm" className="h-7 px-2.5 rounded-lg text-xs font-medium">
                      <Link href={`/admin/subcategories/new?category=${cat._id}`}>
                        <Plus className="size-3 mr-1" /> Add
                      </Link>
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {catSubs.map((sub) => (
                      <div
                        key={sub._id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 bg-muted/30 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <Link href={`/admin/subcategories/${sub._id}`} className="hover:underline">
                          {sub.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ type: "subcategory", id: sub._id, name: sub.name })}
                          className="size-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Delete subcategory"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                    {catSubs.length === 0 && (
                      <p className="text-xs text-muted-foreground italic py-1">No subcategories assigned.</p>
                    )}
                  </div>
                </div>

                {/* Sizes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wider">
                      <Maximize2 className="size-3.5 text-muted-foreground" />
                      Available Sizes
                    </div>
                    <Button asChild variant="ghost" size="sm" className="h-7 px-2.5 rounded-lg text-xs font-medium">
                      <Link href={`/admin/sizes/new?category=${cat._id}`}>
                        <Plus className="size-3 mr-1" /> Add
                      </Link>
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {catSizes.map((s) => (
                      <div
                        key={s._id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 bg-muted/30 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <Link href={`/admin/sizes/${s._id}`} className="hover:underline">
                          {s.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ type: "size", id: s._id, name: s.name })}
                          className="size-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Delete size"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                    {catSizes.length === 0 && (
                      <p className="text-xs text-muted-foreground italic py-1">No sizes assigned.</p>
                    )}
                  </div>
                </div>
              </AdminCardContent>
            </AdminCard>
          );
        })}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="pt-6 flex justify-center">
          <Pagination 
            page={page} 
            totalPages={pages} 
            onPageChange={setPage} 
          />
        </div>
      )}

      {/* Reusable Delete Modal */}
      <AdminDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete ${deleteTarget?.type ? deleteTarget.type.charAt(0).toUpperCase() + deleteTarget.type.slice(1) : "Item"}`}
        itemName={deleteTarget?.name}
        description={`Are you sure you want to delete this ${deleteTarget?.type}? Associated products may be affected.`}
        isLoading={isDeleting}
      />
    </AdminPageContainer>
  );
}
