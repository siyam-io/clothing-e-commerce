"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminBlogs } from "@/app/admin/blog/lib/useAdminBlogs";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  BookOpen,
  Clock,
  BarChart3,
  Filter,
  Star,
  FileText
} from "lucide-react";
import { getImageUrl } from "@/utils/imageUtils";
import { swalToast, swalError } from "@/utils/swal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFilters } from "@/app/admin/_hooks/useFilters";
import Pagination from "@/components/common/Pagination";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminHeaderButton } from "@/app/admin/_components/AdminPageHeader";
import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from "@/app/admin/_components/AdminCard";
import AdminDataTable from "@/app/admin/_components/AdminDataTable";
import AdminStatusBadge from "@/app/admin/_components/AdminStatusBadge";
import AdminDeleteModal from "@/app/admin/_components/AdminDeleteModal";

export default function BlogListPage() {
  const { search, setSearch, page, setPage, queryParams } = useFilters({ initialLimit: 30 });
  const { blogs, total, pages, isLoading, deleteBlog, toggleStatus, toggleFeatured } = useAdminBlogs(queryParams, true);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteBlog.mutateAsync(deleteTarget.id);
      swalToast("Blog post deleted successfully", "success");
      setDeleteTarget(null);
    } catch (err) {
      swalError("Delete Failed", "Could not delete blog post.");
    } finally {
      setIsDeleting(false);
    }
  };

  const publishedCount = blogs?.filter((b) => b.status === "PUBLISHED").length || 0;
  const draftCount = blogs?.filter((b) => b.status === "DRAFT").length || 0;
  const totalViews = blogs?.reduce((acc, b) => acc + (b.viewCount || 0), 0) || 0;
  const categoryCount = new Set(blogs?.map((b) => b.category)).size || 0;

  const columns = [
    {
      label: "Article",
      render: (post) => (
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/60">
            {post.featuredImage ? (
              <img
                src={getImageUrl(post.featuredImage)}
                className="size-full object-cover"
                alt=""
              />
            ) : (
              <div className="size-full flex items-center justify-center text-muted-foreground">
                <FileText className="size-4 opacity-40" />
              </div>
            )}
          </div>
          <div>
            <span className="font-semibold text-sm text-foreground tracking-tight line-clamp-1">
              {post.title}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      ),
    },
    {
      label: "Category",
      render: (post) => (
        <Badge variant="outline" className="text-xs font-medium px-2.5 py-0.5 rounded-full border-border/60 bg-muted/30">
          {post.category || "General"}
        </Badge>
      ),
    },
    {
      label: "Status",
      render: (post) => (
        <AdminStatusBadge
          value={post.status === "PUBLISHED" ? "published" : "draft"}
          label={post.status === "PUBLISHED" ? "Published" : "Draft"}
        />
      ),
    },
    {
      label: "Views",
      render: (post) => (
        <span className="text-xs font-medium text-foreground tabular-nums">
          {Number(post.viewCount || 0).toLocaleString()}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <AdminPageContainer>
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </AdminPageContainer>
    );
  }

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Blog & Articles"
        description={`Publish guides, lifestyle updates, and content marketing articles · ${total || 0} total`}
        actions={
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border-border/60 bg-background/80 pl-9 text-xs"
              />
            </div>
            <AdminHeaderButton href="/admin/blog/create" icon={Plus}>
              New Article
            </AdminHeaderButton>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-2xs flex items-center gap-4">
          <div className="size-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <BookOpen className="size-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground block">Published Posts</span>
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">{publishedCount}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-2xs flex items-center gap-4">
          <div className="size-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="size-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground block">Drafts</span>
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">{draftCount}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-2xs flex items-center gap-4">
          <div className="size-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <BarChart3 className="size-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground block">Total Article Views</span>
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">{totalViews.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-2xs flex items-center gap-4">
          <div className="size-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Filter className="size-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground block">Categories</span>
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">{categoryCount}</span>
          </div>
        </div>
      </div>

      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle>All Articles</AdminCardTitle>
        </AdminCardHeader>
        <AdminCardContent className="p-0">
          <AdminDataTable
            columns={columns}
            data={blogs || []}
            emptyTitle="No blog posts found"
            emptyDescription="Create your first blog post to engage visitors and improve organic SEO."
            emptyActionLabel="Create Post"
            onEmptyAction={() => window.location.href = "/admin/blog/create"}
            actions={(post) => (
              <div className="flex items-center gap-1 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => toggleFeatured(post._id, post.isFeatured)}
                  className="size-8 rounded-lg"
                  title={post.isFeatured ? "Remove from featured" : "Mark as featured"}
                >
                  <Star className="size-3.5" fill={post.isFeatured ? "currentColor" : "none"} />
                </Button>
                <Button asChild variant="ghost" size="icon-sm" className="size-8 rounded-lg" title="Edit post">
                  <Link href={`/admin/blog/${post._id}`}>
                    <Edit2 className="size-3.5" />
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleteTarget({ id: post._id, name: post.title })}
                  className="size-8 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                  title="Delete post"
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
        title="Delete Blog Post"
        itemName={deleteTarget?.name}
        description="Are you sure you want to permanently delete this blog post? It will no longer be visible on your website."
        isLoading={isDeleting}
      />
    </AdminPageContainer>
  );
}
