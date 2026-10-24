import { skipToken, useQuery } from '@tanstack/react-query';
import { resolveDeliveryZone, type Address, type DeliveryZone } from './api';
import { checkoutKeys } from './queryKeys';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

/** The delivery fee and free-delivery threshold of the address's zone. Only used to explain the fee, so a failure is silent. */
export function useDeliveryZone(address: Address | null): DeliveryZone | null {
  const query = useQuery({
    queryKey: checkoutKeys.zone(address?.id ?? null),
    queryFn: address === null ? skipToken : ({ signal }) => resolveDeliveryZone(address, signal),
    staleTime: FIVE_MINUTES_MS,
    retry: false,
  });
  return query.data ?? null;
}
