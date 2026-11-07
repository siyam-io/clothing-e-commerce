"use client";

import { useState, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useAdminUsers } from "@/app/admin/users/lib/useAdminUsers";
import { useAuthStore } from "@/store/authStore";
import { useFilters } from "@/app/admin/_hooks/useFilters";
import { AdminPageContainer } from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminHeaderStat } from "@/app/admin/_components/AdminPageHeader";
import { AdminCard, AdminCardContent } from "@/app/admin/_components/AdminCard";
import { AdminDataTable } from "@/app/admin/_components/AdminDataTable";
import { AdminFilterBar } from "@/app/admin/_components/AdminFilterBar";
import { AdminDeleteModal } from "@/app/admin/_components/AdminDeleteModal";
import { getImageUrl } from "@/utils/imageUtils";
import { notify } from "@/utils/swal";
import { 
  Users as UsersIcon, 
  Trash2, 
  Edit3, 
  Eye,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function UsersContent() {
  const { 
    search, 
    setSearch, 
    sort, 
    setSort, 
    page: currentPage, 
    setPage, 
    queryParams 
  } = useFilters({
    initialLimit: 30,
    initialSort: "-createdAt"
  });

  const { user: currentUser } = useAuthStore();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { 
    users, 
    total, 
    pages: totalPages, 
    isLoading, 
    isFetching,
    deleteUser,
    updateUser
  } = useAdminUsers(queryParams);

  const handleSearch = useCallback((val) => {
    setSearch(val);
    setPage(1);
  }, [setSearch, setPage]);

  const handleToggleStatus = async (item) => {
    if (item._id === currentUser?._id) {
      return notify.error("Action Denied", "You cannot block your own account.");
    }
    if (item.role?.name === "superadmin") {
      return notify.error("Action Denied", "Superadmin status cannot be modified.");
    }
    const isBlocking = item.isActive !== false;
    const action = isBlocking ? "Block" : "Activate";
    const isConfirmed = await notify.confirm(
      `${action} User?`,
      `Are you sure you want to ${action.toLowerCase()} this account?`
    );
    if (isConfirmed) {
      try {
        await updateUser.mutateAsync({ id: item._id, data: { isActive: !isBlocking } });
        notify.success(`User successfully ${isBlocking ? "blocked" : "activated"}`);
      } catch (err) {
        notify.error("Error", "Could not update user status.");
      }
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteUser.mutateAsync(deleteTarget._id);
      notify.success("User deleted successfully");
      setDeleteTarget(null);
    } catch (err) {
      notify.error("Error", "Could not delete user.");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      label: "User",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="relative size-10 rounded-full overflow-hidden border border-border/60 bg-muted shrink-0 flex items-center justify-center font-semibold text-xs text-foreground">
            {item.avatar ? (
              <img
                src={getImageUrl(item.avatar)}
                alt={item.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              item.name?.charAt(0).toUpperCase() || "U"
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {item.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {item.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      label: "Role",
      render: (item) => {
        const roleName = item.role?.name || "Customer";
        return (
          <Badge
            variant="outline"
            className={cn(
              "px-2.5 py-0.5 text-xs font-medium rounded-full capitalize",
              roleName === "superadmin" 
                ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40"
                : roleName === "admin"
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40"
                  : "bg-muted text-muted-foreground border-border/60"
            )}
          >
            {roleName}
          </Badge>
        );
      },
    },
    {
      label: "Status",
      render: (item) => (
        <Badge
          variant="outline"
          className={cn(
            "px-2.5 py-0.5 text-xs font-medium rounded-full",
            item.isActive !== false
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40"
              : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40"
          )}
        >
          {item.isActive !== false ? "Active" : "Blocked"}
        </Badge>
      ),
    },
    {
      label: "Joined Date",
      render: (item) => {
        const date = item.createdAt ? new Date(item.createdAt) : null;
        return (
          <span className="text-xs text-muted-foreground">
            {date && !isNaN(date.getTime()) 
              ? date.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "N/A"}
          </span>
        );
      },
    },
    {
      label: "Actions",
      className: "text-right",
      render: (item) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Button 
            asChild 
            variant="ghost" 
            size="icon" 
            className="size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
            title="View Details"
          >
            <Link href={`/admin/users/${item._id}`}>
              <Eye className="size-4" />
            </Link>
          </Button>
          <Button 
            asChild 
            variant="ghost" 
            size="icon" 
            className="size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Edit User"
          >
            <Link href={`/admin/users/${item._id}/edit`}>
              <Edit3 className="size-4" />
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleToggleStatus(item)}
            className={cn(
              "size-8 rounded-lg transition-colors",
              item.isActive !== false 
                ? "text-muted-foreground hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30" 
                : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            )}
            title={item.isActive !== false ? "Block User" : "Activate User"}
          >
            {item.isActive !== false ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setDeleteTarget(item)}
            disabled={item.role?.name === "admin" || item.role?.name === "superadmin"}
            className="size-8 rounded-lg hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 text-muted-foreground"
            title="Delete User"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminPageContainer className="space-y-6">
      <AdminPageHeader
        title="Users"
        description="Manage customer accounts, roles, and platform permissions"
        actions={<AdminHeaderStat label="Total users" value={total || 0} />}
      />

      <AdminCard>
        <div className="p-4 sm:p-5 border-b border-border/60">
          <AdminFilterBar
            searchPlaceholder="Search users by name or email..."
            onSearchChange={handleSearch}
            showReset={Boolean(search)}
            onReset={() => handleSearch("")}
            totalCount={total}
            entityName="users"
          />
        </div>

        <AdminCardContent className="p-0">
          <AdminDataTable
            columns={columns}
            data={users || []}
            isLoading={isLoading}
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
            emptyTitle="No users found"
            emptyMessage="No customer accounts match your search criteria."
          />
        </AdminCardContent>
      </AdminCard>

      <AdminDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Delete User Account"
        description={`Are you sure you want to permanently delete "${deleteTarget?.name}"? All associated order records will remain, but login access will be removed.`}
      />
    </AdminPageContainer>
  );
}

export default function UserListPage() {
  return (
    <Suspense
      fallback={
        <AdminPageContainer className="space-y-6">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </AdminPageContainer>
      }
    >
      <UsersContent />
    </Suspense>
  );
}
