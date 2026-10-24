import { useQuery } from '@tanstack/react-query';
import { fetchSpendingReport } from '../api/ordersApi';
import { ordersKeys } from '../api/queryKeys';
import type { DateRange } from '../types';

/** The report for a period. It waits while the dates are incomplete instead of asking the server a bad question. */
export function useSpendingReport(range: DateRange, enabled: boolean) {
  return useQuery({
    queryKey: ordersKeys.spending(range),
    queryFn: ({ signal }) => fetchSpendingReport(range, signal),
    enabled,
  });
}
