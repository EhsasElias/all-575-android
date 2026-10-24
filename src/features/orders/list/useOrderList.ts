import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchOrdersPage, type Cursor } from '../api/ordersApi';
import { ordersKeys } from '../api/queryKeys';

const FIRST_PAGE: Cursor = null;

/** The customer's orders, newest first, one cursor page at a time. */
export function useOrderList() {
  return useInfiniteQuery({
    queryKey: ordersKeys.list(),
    queryFn: ({ pageParam, signal }) => fetchOrdersPage(pageParam, signal),
    initialPageParam: FIRST_PAGE,
    getNextPageParam: (lastPage): Cursor => lastPage.meta.next_cursor,
    select: (data) => data.pages.flatMap((page) => page.data),
    // A list that was open a minute ago may already be wrong: an order was paid, cancelled or delivered.
    staleTime: 0,
  });
}
