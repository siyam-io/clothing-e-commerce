import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { swalSuccess, swalError, notify } from "@/utils/swal";
import { useAuthStore } from "@/store/authStore";
import { hasPermission } from "@/utils/rbacUtils";

export const useAdminOrders = (params = {}, orderId = null) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const {
    data: allOrdersData,
    isLoading: allOrdersLoading,
    isFetching: isAllFetching,
  } = useQuery({
    queryKey: ["adminOrders", params],
    queryFn: async () => {
      const { data } = await api.get("/admin/orders", { params });
      return data;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!user && hasPermission(user, ["orders:view", "all"]),
  });

  const { data: orderDetails, isLoading: orderDetailsLoading } = useQuery({
    queryKey: ["adminOrder", orderId],
    queryFn: async () => {
      const { data } = await api.get(`/admin/orders/${orderId}`);
      return data;
    },
    enabled: !!orderId && !!user && hasPermission(user, ["orders:view", "all"]),
  });

  const updateOrder = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/orders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      if (orderId) queryClient.invalidateQueries({ queryKey: ["adminOrder", orderId] });
      swalSuccess("Manifest Updated", "Order deployment data synchronized.");
    },
    onError: (err) => {
      swalError("Update Failed", err.response?.data?.message || "Logic conflict.");
    }
  });

  const syncToPathao = useMutation({
    mutationFn: (id) => api.post(`/admin/orders/${id}/sync-pathao`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      if (orderId) queryClient.invalidateQueries({ queryKey: ["adminOrder", orderId] });
      swalSuccess("Pathao Synced", "Consignment generated successfully.");
    },
    onError: (err) => {
      swalError("Sync Failed", err.response?.data?.message || "Pathao API rejected the protocol.");
    },
  });

  const createAdminOrder = useMutation({
    mutationFn: async (orderData) => {
      const { data } = await api.post("/admin/orders", orderData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      notify.success("Order Created", "Transaction recorded successfully.");
    },
    onError: (err) => {
      swalError("Creation Failed", err.response?.data?.message || "Internal system error.");
    },
  });

  const deleteOrder = useMutation({
    mutationFn: (id) => api.delete(`/admin/orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      swalSuccess("Order Deleted", "The order was successfully deleted.");
    },
    onError: (err) => {
      swalError("Delete Failed", err.response?.data?.message || "Could not delete order.");
    }
  });

  const searchAdminProducts = async (query) => {
    const { data } = await api.get("/admin/products", { 
      params: { search: query, limit: 5, isActive: "all" } 
    });
    return data.products;
  };

  const searchAdminUsers = async (query) => {
    const { data } = await api.get("/users", { 
      params: { search: query, limit: 5 } 
    });
    return data.users;
  };

  return {
    orders: allOrdersData?.orders || [],
    total: allOrdersData?.total || 0,
    pages: allOrdersData?.pages || 1,
    isLoading: allOrdersLoading,
    isFetching: isAllFetching,
    orderDetails,
    orderDetailsLoading,
    updateOrder: updateOrder.mutateAsync,
    isUpdating: updateOrder.isPending,
    syncToPathao: syncToPathao.mutateAsync,
    isSyncing: syncToPathao.isPending,
    createAdminOrder: createAdminOrder.mutateAsync,
    isCreating: createAdminOrder.isPending,
    deleteOrder: deleteOrder.mutateAsync,
    isDeleting: deleteOrder.isPending,
    searchAdminProducts,
    searchAdminUsers,
  };
};
