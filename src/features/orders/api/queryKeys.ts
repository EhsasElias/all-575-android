import type { DateRange } from '../types';

/** Every query of this feature starts with `orders`, so signing out or a bulk invalidation can reach them all. */
export const ordersKeys = {
  list: () => ['orders', 'list'] as const,
  detail: (orderId: string) => ['orders', 'detail', orderId] as const,
  review: (orderId: string, productSlug: string) =>
    ['orders', 'review', orderId, productSlug] as const,
  spending: (range: DateRange) => ['orders', 'spending', range.from, range.to] as const,
};
