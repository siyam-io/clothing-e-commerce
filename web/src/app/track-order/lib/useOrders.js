import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { getGuestId } from "@/utils/guestId";
import { useAuthStore } from "@/store/authStore";

export const useOrders = (orderId = null, phone = null, options = {}) => {
  const { user, isLoading: authLoading } = useAuthStore();
  const guestId = getGuestId();
  const userId = user?._id || guestId;

  const { data: myOrders, isLoading: myOrdersLoading } = useQuery({
    queryKey: ["myOrders", userId, phone],
    queryFn: async () => {
      const url = phone ? `/orders/myorders?phone=${phone}` : "/orders/myorders";
      const { data } = await api.get(url);
      return data;
    },
    enabled: Boolean(options.fetchMyOrders && (!!userId || !!phone) && !authLoading),
    staleTime: 1000 * 60 * 5,
  });

  const { data: orderDetails, isLoading: orderDetailsLoading, isError: isDetailsError } = useQuery({
    queryKey: ["order", orderId, userId, phone],
    queryFn: async () => {
      const url = phone ? `/orders/${orderId}?phone=${phone}` : `/orders/${orderId}`;
      const { data } = await api.get(url);
      return data;
    },
    enabled: !!orderId,
  });

  return {
    myOrders: myOrders || [],
    isLoading: myOrdersLoading,
    orderDetails,
    orderDetailsLoading,
    isError: isDetailsError,
  };
};
