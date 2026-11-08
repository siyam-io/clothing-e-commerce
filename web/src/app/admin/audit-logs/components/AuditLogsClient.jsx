"use client";

import { useState, useMemo, useCallback } from "react";
import { useAdminAuditLogs } from "../lib/useAdminAuditLogs";
import AuditLogDetailModal from "./AuditLogDetailModal";
import AdminPageContainer from "@/app/admin/_components/AdminPageContainer";
import AdminPageHeader, { AdminHeaderStat } from "@/app/admin/_components/AdminPageHeader";
import { AdminDataTable } from "@/app/admin/_components/AdminDataTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Clock,
  Server,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MODULE_OPTIONS = [
  { value: "all", label: "All Modules" },
  { value: "Order", label: "Orders" },
  { value: "Product", label: "Products" },
  { value: "Category", label: "Categories" },
  { value: "Auth", label: "Auth & Security" },
  { value: "User", label: "Users" },
  { value: "Role", label: "Roles & RBAC" },
  { value: "Coupon", label: "Coupons" },
  { value: "FlashSale", label: "Flash Sales" },
  { value: "Banner", label: "Banner Campaigns" },
  { value: "Blog", label: "Blog & Articles" },
  { value: "Settings", label: "Store Settings" },
  { value: "System", label: "System Operations" },
];

const ACTION_OPTIONS = [
  { value: "all", label: "All Actions" },
  { value: "STATUS_CHANGE", label: "Status Change" },
  { value: "DISPATCH", label: "Courier Dispatch" },
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "CONFIG_UPDATE", label: "Config Update" },
  { value: "BULK_ACTION", label: "Bulk Action" },
  { value: "CANCEL", label: "Cancellation" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "SUCCESS", label: "Success" },
  { value: "FAILED", label: "Failed" },
  { value: "WARNING", label: "Warning" },
];

export default function AuditLogsClient() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState("all");
  const [selectedAction, setSelectedAction] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [activeLog, setActiveLog] = useState(null);

  // Memoized query parameters for backend
  const queryParams = useMemo(() => {
    const params = { page, limit: 20 };
    if (search.trim()) params.search = search.trim();
    if (selectedModule !== "all") params.module = selectedModule;
    if (selectedAction !== "all") params.action = selectedAction;
    if (selectedStatus !== "all") params.status = selectedStatus;
    return params;
  }, [page, search, selectedModule, selectedAction, selectedStatus]);

  const {
    logs,
    pagination,
    stats,
    isLoading,
    isFetching,
    refetch,
    refetchStats,
  } = useAdminAuditLogs(queryParams);

  const handleRefresh = useCallback(() => {
    refetch();
    refetchStats();
  }, [refetch, refetchStats]);

  const handleResetFilters = useCallback(() => {
    setSearch("");
    setSelectedModule("all");
    setSelectedAction("all");
    setSelectedStatus("all");
    setPage(1);
  }, []);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    selectedModule !== "all" ||
    selectedAction !== "all" ||
    selectedStatus !== "all";

  // Helpers for module badge coloring
  const getModuleBadgeClass = (module) => {
    switch (String(module).toUpperCase()) {
      case "ORDER":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "COURIER":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "AUTH":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "PRODUCT":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "CATEGORY":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
      case "BLOG":
        return "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20";
      case "SYSTEM":
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
      case "USER":
        return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20";
      case "SETTINGS":
        return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "SUCCESS":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            <CheckCircle2 className="size-3" /> Success
          </span>
        );
      case "FAILED":
      case "FAILURE":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
            <XCircle className="size-3" /> Failed
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
            <AlertTriangle className="size-3" /> Warning
          </span>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Table Columns
  const columns = useMemo(
    () => [
      {
        key: "createdAt",
        label: "Timestamp",
        width: "160px",
        render: (item) => {
          if (!item.createdAt) return "—";
          const date = new Date(item.createdAt);
          return (
            <div className="flex flex-col">
              <span className="font-mono text-xs font-semibold text-foreground">
                {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          );
        },
      },
      {
        key: "user",
        label: "Actor / Admin",
        width: "200px",
        render: (item) => (
          <div className="flex items-center gap-2.5">
            <Avatar className="size-8 rounded-lg border border-border/60">
              <AvatarImage src={item.user?.avatar} alt={item.userName} />
              <AvatarFallback className="text-[11px] font-bold bg-primary/10 text-primary rounded-lg">
                {(item.userName || "Admin").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">
                {item.userName || "System"}
              </span>
              <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[140px]">
                {item.userRole || "admin"}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "module",
        label: "Module",
        width: "120px",
        render: (item) => (
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold border uppercase",
              getModuleBadgeClass(item.module)
            )}
          >
            {item.module || "SYSTEM"}
          </span>
        ),
      },
      {
        key: "action",
        label: "Action",
        width: "140px",
        render: (item) => (
          <Badge
            variant="outline"
            className="text-[11px] font-mono font-medium tracking-tight bg-background/50 border-border/80"
          >
            {item.action}
          </Badge>
        ),
      },
      {
        key: "description",
        label: "Description & Resource",
        render: (item) => (
          <div className="flex flex-col gap-0.5 py-0.5">
            <span className="text-xs font-medium text-foreground line-clamp-2">
              {item.description}
            </span>
            {(item.resourceId || item.resourceName) && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                <span className="opacity-75">Target:</span>
                <span className="text-foreground/90 font-medium">
                  {item.resourceName || item.resourceId}
                </span>
              </div>
            )}
          </div>
        ),
      },
      {
        key: "status",
        label: "Status",
        width: "110px",
        render: (item) => getStatusBadge(item.status),
      },
      {
        key: "ipAddress",
        label: "IP Address",
        width: "120px",
        render: (item) => (
          <span className="font-mono text-[11px] text-muted-foreground">
            {item.ipAddress || "127.0.0.1"}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <AdminPageContainer>
      {/* Header */}
      <AdminPageHeader
        title="Audit Logs"
        description="Comprehensive audit trails of all administrative actions, status updates, and security events."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Audit Logs" },
        ]}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isFetching}
          className="h-10 rounded-xl gap-2 font-medium"
        >
          <RefreshCw className={cn("size-4", isFetching && "animate-spin text-primary")} />
          <span>Refresh</span>
        </Button>
      </AdminPageHeader>

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Logs */}
        <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Total Logged Events</span>
            <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {(stats?.totalLogs ?? 0).toLocaleString()}
            </div>
          </div>
          <div className="size-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <History className="size-5" />
          </div>
        </div>

        {/* Card 2: Today's Actions */}
        <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Actions Today</span>
            <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {(stats?.todayLogs ?? 0).toLocaleString()}
            </div>
          </div>
          <div className="size-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Clock className="size-5" />
          </div>
        </div>

        {/* Card 3: Security & Failures */}
        <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Security / Failed Events</span>
            <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {(stats?.failureLogs ?? stats?.failedCount ?? 0).toLocaleString()}
            </div>
          </div>
          <div className="size-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <ShieldAlert className="size-5" />
          </div>
        </div>

        {/* Card 4: Top Active Module */}
        <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md p-4 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Primary Module</span>
            <div className="text-lg font-bold tracking-tight text-foreground truncate max-w-[150px]">
              {stats?.topModules?.[0]?.module || stats?.topModules?.[0]?._id || "ORDERS"}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {stats?.topModules?.[0]?.count ? `${stats.topModules[0].count} events` : "Active"}
            </span>
          </div>
          <div className="size-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Layers className="size-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by action, description, admin name, order ID..."
              className="pl-9 pr-4 h-10 rounded-xl bg-background/80 border-border/60 text-sm focus-visible:ring-1"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Module Filter */}
            <select
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setPage(1);
              }}
              className="h-10 px-3 py-1.5 rounded-xl border border-border/60 bg-background/80 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {MODULE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Action Filter */}
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPage(1);
              }}
              className="h-10 px-3 py-1.5 rounded-xl border border-border/60 bg-background/80 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="h-10 px-3 py-1.5 rounded-xl border border-border/60 bg-background/80 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Reset Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-10 px-3 rounded-xl text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <AdminDataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        emptyTitle="No audit logs recorded yet"
        emptyDescription={
          hasActiveFilters
            ? "No logs matched your current search filters. Try clearing filters."
            : "Administrative actions and status updates will automatically appear here."
        }
        onRowClick={(item) => setActiveLog(item)}
        actions={(item) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setActiveLog(item);
            }}
            className="h-8 px-2.5 rounded-lg text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <Eye className="size-3.5" />
            <span>Inspect</span>
          </Button>
        )}
        pagination={{
          page: pagination.page,
          totalPages: pagination.pages,
          total: pagination.total,
          onPageChange: (newPage) => setPage(newPage),
        }}
      />

      {/* Detailed Inspection Modal */}
      <AuditLogDetailModal
        log={activeLog}
        isOpen={Boolean(activeLog)}
        onClose={() => setActiveLog(null)}
      />
    </AdminPageContainer>
  );
}

