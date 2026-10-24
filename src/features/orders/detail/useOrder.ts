import { useQuery } from '@tanstack/react-query';
import { fetchOrder } from '../api/ordersApi';
import { ordersKeys } from '../api/queryKeys';
import { isActiveOrder } from '../status/statusLook';

export const ORDER_POLL_INTERVAL_MS = 15_000;

/**
 * One order in full. While it can still change it refreshes by itself; the query library pauses that
 * while the tab is hidden, and it stops for good once the order is cancelled or completed.
 */
export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ordersKeys.detail(orderId),
    queryFn: ({ signal }) => fetchOrder(orderId, signal),
    enabled: orderId !== '',
    staleTime: 0,
    refetchInterval: (query) => {
      const order = query.state.data;
      return order !== undefined && isActiveOrder(order.status) ? ORDER_POLL_INTERVAL_MS : false;
    },
    refetchIntervalInBackground: false,
  });
}
