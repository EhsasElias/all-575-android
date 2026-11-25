import { useQuery } from '@tanstack/react-query';
import type { LineAvailability } from './cartTypes';
import { fetchLineStock, stockByVariant } from './lineStock';
import { cartQueryKey } from './queryKeys';

const NOTHING_KNOWN: ReadonlyMap<number, LineAvailability> = new Map();

/**
 * Inventory is available across active branches independently of delivery zones.
 * Read it as soon as the server cart loads, even when no delivery address exists.
 */
export function useLineAvailability(enabled: boolean): ReadonlyMap<number, LineAvailability> {
  const stock = useQuery({
    queryKey: [...cartQueryKey, 'stock', 'global'],
    queryFn: ({ signal }) => fetchLineStock(signal),
    enabled,
    staleTime: 0,
    select: stockByVariant,
  });

  return stock.data ?? NOTHING_KNOWN;
}
