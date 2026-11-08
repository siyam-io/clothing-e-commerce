import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { swalSuccess, swalError, notify } from "@/utils/swal";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { hasPermission } from "@/utils/rbacUtils";

export const useAdminOrders = (params = {}, orderId = null) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { socket } = useChatStore();

  const [newOrderIds, setNewOrderIds] = useState(new Set());
  const [isSocketConnected, setIsSocketConnected] = useState(() => Boolean(socket?.connected));

  const {
    data: allOrdersData,
    isLoading: allOrdersLoading,
    isFetching: isAllFetching,
    refetch: refetchAllOrders,
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

  // =========================================================================
  // ⚡ REAL-TIME SOCKET.IO LISTENER
  // =========================================================================
  useEffect(() => {
    if (!socket) return;

    const onConnect = () => setIsSocketConnected(true);
    const onDisconnect = () => setIsSocketConnected(false);

    let invalidateTimer = null;
    let highlightCleanupTimer = null;
    let pendingOrdersBuffer = [];
    let flushBufferTimer = null;

    const flushOrdersBuffer = () => {
      if (pendingOrdersBuffer.length === 0) return;
      const batch = [...pendingOrdersBuffer];
      pendingOrdersBuffer = [];

      queryClient.setQueriesData({ queryKey: ["adminOrders"] }, (old) => {
        if (!old) return old;
        const currentOrders = Array.isArray(old.orders) ? old.orders : [];
        const existingIds = new Set(currentOrders.map((o) => String(o._id)));

        // Filter out any potential duplicate orders
        const uniqueIncoming = batch.filter((o) => o && o._id && !existingIds.has(String(o._id)));
        if (uniqueIncoming.length === 0) return old;

        const activeFilter = params?.status;
        const matchesFilter = (o) =>
          !activeFilter ||
          activeFilter === "all" ||
          (o.orderStatus && o.orderStatus.toLowerCase() === activeFilter.toLowerCase());

        const filteredIncoming = uniqueIncoming.filter(matchesFilter);
        const pageLimit = Number(params?.limit) || 30;

        // Cap array to pageLimit to prevent virtual DOM bloating & layout freezes
        const nextOrders = [...filteredIncoming, ...currentOrders].slice(0, pageLimit);

        return {
          ...old,
          total: (old.total || 0) + uniqueIncoming.length,
          orders: nextOrders,
        };
      });

      // Update new order IDs in batch (keep at most 10 recent IDs to avoid state thrashing)
      setNewOrderIds((prev) => {
        const next = new Set(prev);
        batch.forEach((o) => {
          if (o?._id) next.add(String(o._id));
        });
        if (next.size > 15) {
          return new Set(Array.from(next).slice(-15));
        }
        return next;
      });

      // Single debounced timer to clean up glowing badges after 8 seconds of quiet
      if (highlightCleanupTimer) clearTimeout(highlightCleanupTimer);
      highlightCleanupTimer = setTimeout(() => {
        setNewOrderIds(new Set());
      }, 8000);
    };

    const handleNewOrder = (incomingOrder) => {
      if (!incomingOrder || !incomingOrder._id) return;

      // Add to micro-batch buffer
      pendingOrdersBuffer.unshift(incomingOrder);

      // Micro-batch flush every 150ms so rapid 10k orders are merged into smooth frame-rate updates
      if (flushBufferTimer) clearTimeout(flushBufferTimer);
      flushBufferTimer = setTimeout(flushOrdersBuffer, 120);

      // Debounce heavy API refetch so we don't bombard backend during bursts
      if (invalidateTimer) clearTimeout(invalidateTimer);
      invalidateTimer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      }, 1500);
    };

    const handleOrderUpdated = (updateData) => {
      if (!updateData?.orderId) return;

      const targetId = String(updateData.orderId);

      queryClient.setQueriesData({ queryKey: ["adminOrders"] }, (old) => {
        if (!old || !Array.isArray(old.orders)) return old;
        return {
          ...old,
          orders: old.orders.map((o) =>
            String(o._id) === targetId
              ? {
                  ...o,
                  orderStatus: updateData.orderStatus || o.orderStatus,
                  paymentResult: updateData.paymentResult
                    ? { ...o.paymentResult, ...updateData.paymentResult }
                    : o.paymentResult,
                  pathaoConsignmentId: updateData.pathaoConsignmentId || o.pathaoConsignmentId,
                  pathaoStatus: updateData.pathaoStatus || o.pathaoStatus,
                }
              : o
          ),
        };
      });

      if (invalidateTimer) clearTimeout(invalidateTimer);
      invalidateTimer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      }, 1500);

      if (orderId && String(orderId) === targetId) {
        queryClient.invalidateQueries({ queryKey: ["adminOrder", orderId] });
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("new_order", handleNewOrder);
    socket.on("order_updated", handleOrderUpdated);
    socket.on("order_status_updated", handleOrderUpdated);

    return () => {
      if (flushBufferTimer) clearTimeout(flushBufferTimer);
      if (invalidateTimer) clearTimeout(invalidateTimer);
      if (highlightCleanupTimer) clearTimeout(highlightCleanupTimer);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("new_order", handleNewOrder);
      socket.off("order_updated", handleOrderUpdated);
      socket.off("order_status_updated", handleOrderUpdated);
    };
  }, [socket, queryClient, params, orderId]);

  const updateOrder = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/orders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      if (orderId) queryClient.invalidateQueries({ queryKey: ["adminOrder", orderId] });
      swalSuccess("Manifest Updated", "Order deployment data synchronized.");
    },
    onError: (err) => {
      swalError("Update Failed", err.response?.data?.message || "Logic conflict.");
    },
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
    },
  });

  const searchAdminProducts = async (query) => {
    const { data } = await api.get("/admin/products", {
      params: { search: query, limit: 5, isActive: "all" },
    });
    return data.products;
  };

  const searchAdminUsers = async (query) => {
    const { data } = await api.get("/users", {
      params: { search: query, limit: 5 },
    });
    return data.users;
  };

  return {
    orders: allOrdersData?.orders || [],
    total: allOrdersData?.total || 0,
    pages: allOrdersData?.pages || 1,
    isLoading: allOrdersLoading,
    isFetching: isAllFetching,
    refetch: refetchAllOrders,
    newOrderIds,
    isSocketConnected,
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
