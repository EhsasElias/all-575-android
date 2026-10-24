import { useQuery } from '@tanstack/react-query';
import type { LineAvailability } from './cartTypes';
import { fetchDeliveryAddressId, fetchLineStock, stockByVariant } from './lineStock';
import { cartQueryKey } from './queryKeys';

const NOTHING_KNOWN: ReadonlyMap<number, LineAvailability> = new Map();

/**
 * Per-line stock for the customer's delivery address, or nothing when they have no address yet (or the lookup
 * fails: the cart still works, and checkout checks stock again).
 */
export function useLineAvailability(enabled: boolean): ReadonlyMap<number, LineAvailability> {
  const address = useQuery({
    queryKey: ['cart-delivery-address'],
    queryFn: ({ signal }) => fetchDeliveryAddressId(signal),
    enabled,
    // An address added since the last visit should count right away.
    staleTime: 0,
  });
  const addressId = address.data ?? null;

  const stock = useQuery({
    queryKey: [...cartQueryKey, 'stock', addressId],
    queryFn: ({ signal }) => (addressId === null ? [] : fetchLineStock(addressId, signal)),
    enabled: enabled && addressId !== null,
    select: stockByVariant,
  });

  return stock.data ?? NOTHING_KNOWN;
}
