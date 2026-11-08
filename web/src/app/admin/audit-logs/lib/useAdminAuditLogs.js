import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { hasPermission } from "@/utils/rbacUtils";

export const useAdminAuditLogs = (params = {}) => {
  const { user } = useAuthStore();
  const roleName = String(user?.role?.name || user?.role || "").toLowerCase();
  const isAllowed =
    !!user &&
    (roleName === "admin" ||
      roleName === "superadmin" ||
      hasPermission(user, ["audit:view", "settings:view", "dashboard:view", "all"]));

  // Fetch paginated audit logs list
  const {
    data: responseData,
    isLoading,
    isFetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ["adminAuditLogs", params],
    queryFn: async () => {
      const { data } = await api.get("/admin/audit-logs", { params });
      return data;
    },
    staleTime: 1000 * 30,
    enabled: isAllowed,
  });

  // Fetch audit log metrics / stats
  const {
    data: statsResponse,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["adminAuditLogsStats"],
    queryFn: async () => {
      const { data } = await api.get("/admin/audit-logs/stats");
      return data;
    },
    staleTime: 1000 * 60,
    enabled: isAllowed,
  });

  return {
    logs: responseData?.logs || [],
    pagination: {
      page: responseData?.pagination?.page || responseData?.currentPage || 1,
      limit: responseData?.pagination?.limit || 20,
      total: responseData?.pagination?.total ?? responseData?.total ?? 0,
      pages: responseData?.pagination?.pages || responseData?.pages || 1,
    },
    stats: {
      totalLogs: statsResponse?.stats?.totalLogs ?? 0,
      todayLogs: statsResponse?.stats?.todayLogs ?? 0,
      failureLogs:
        statsResponse?.stats?.failureLogs ??
        statsResponse?.stats?.failedCount ??
        0,
      topModules: statsResponse?.stats?.topModules || [],
      topActions: statsResponse?.stats?.topActions || [],
    },
    isLoading,
    isFetching,
    statsLoading,
    refetch,
    refetchStats,
    error,
  };
};

