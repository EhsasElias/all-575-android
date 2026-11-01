import { useInfiniteQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { fetchOrdersPage, type Cursor } from '../api/ordersApi';
import { ordersKeys } from '../api/queryKeys';

const FIRST_PAGE: Cursor = null;

/** The customer's orders, newest first, one cursor page at a time. */
export function useOrderList() {
  const [params] = useSearchParams();
  const filters = {
    status: params.get('status') ?? undefined,
    q: params.get('q') ?? undefined,
    from: params.get('from') ?? undefined,
    to: params.get('to') ?? undefined,
    product: params.get('product') ?? undefined,
    seller: params.get('seller') ?? undefined,
    branch: params.get('branch') ?? undefined,
    payment_method: params.get('payment_method') ?? undefined,
    min_price: params.get('min_price') ?? undefined,
    max_price: params.get('max_price') ?? undefined,
  };
  return useInfiniteQuery({
    queryKey: [...ordersKeys.list(), filters],
    queryFn: ({ pageParam, signal }) => fetchOrdersPage(pageParam, signal, filters),
    initialPageParam: FIRST_PAGE,
    getNextPageParam: (lastPage): Cursor => lastPage.meta.next_cursor,
    select: (data) => data.pages.flatMap((page) => page.data),
    // A list that was open a minute ago may already be wrong: an order was paid, cancelled or delivered.
    staleTime: 0,
  });
}
