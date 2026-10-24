import { useQuery } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { useSession } from '@/shared/session';
import { guestCartStore } from './guestCartStore';
import { serverCartQuery } from './serverCart';

const countOf = (cart: { itemsCount: number }): number => cart.itemsCount;

/**
 * How many items are in the cart, for the badge on the cart tab. Signed in, it is the server's `items_count`
 * (fetched in the background, 0 until it arrives); as a guest it is the count on this device.
 */
export function useCartItemCount(): number {
  const { status } = useSession();
  const guestCount = useSyncExternalStore(guestCartStore.subscribe, guestCartStore.getItemCount);
  const { data: serverCount } = useQuery({
    ...serverCartQuery,
    enabled: status === 'signed-in',
    select: countOf,
  });

  if (status === 'signed-in') return serverCount ?? 0;
  if (status === 'guest') return guestCount;
  return 0;
}
