import { useSession } from '@/shared/session';
import type { Cart } from './cartTypes';
import { useGuestCart } from './useGuestCart';
import { useServerCart } from './useServerCart';

/**
 * The customer's cart, in one shape. Signed in, it is the server cart; as a guest it is the cart kept on this
 * device. While the app is still working out who the customer is, changes go to the device cart (the merge on
 * sign-in moves them to the server) and the cart reads as loading.
 */
export function useCart(): Cart {
  const { status } = useSession();
  const guest = useGuestCart();
  const server = useServerCart(status === 'signed-in');

  if (status === 'signed-in') return server;
  if (status === 'guest') return guest;
  return { ...guest, status: 'loading' };
}
