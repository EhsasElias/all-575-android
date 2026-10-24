import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { refusalFromError } from './cartRefusal';
import { planAddition, withQuantity } from './cartRules';
import type {
  Cart,
  CartAddition,
  CartChange,
  CartContents,
  CartStatus,
  LineSnapshot,
} from './cartTypes';
import { useGuestLinesAwaitingMerge } from './guestCartMerge';
import { cartQueryKey } from './queryKeys';
import { clearServerCart, putCartItem, serverCartQuery } from './serverCart';

const CHANGE_KEY = [...cartQueryKey, 'change'] as const;
const EMPTY: CartContents = { lines: [], itemsCount: 0, subtotal: 0 };

type QuantityChange = { variantId: number; quantity: number };

/** Changes run one after another, so the server always ends with the last quantity the customer chose. */
function isLastChange(queryClient: QueryClient): boolean {
  return queryClient.isMutating({ mutationKey: CHANGE_KEY }) <= 1;
}

function statusOf(hasData: boolean, isError: boolean, awaitingMerge: boolean): CartStatus {
  if (awaitingMerge) return 'loading';
  if (hasData) return 'ready';
  return isError ? 'error' : 'loading';
}

/** The signed-in customer's cart, kept on the server. */
export function useServerCart(enabled: boolean): Cart {
  const queryClient = useQueryClient();
  const { data, isError, refetch } = useQuery({ ...serverCartQuery, enabled });
  const awaitingMerge = useGuestLinesAwaitingMerge();

  const { mutateAsync: applyChange } = useMutation({
    mutationKey: CHANGE_KEY,
    scope: { id: 'cart' },
    mutationFn: ({ variantId, quantity }: QuantityChange) => putCartItem(variantId, quantity),
    // Showing the new quantity at once is safe: the server only refuses a number it can name, and then we roll back.
    onMutate: async ({ variantId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: cartQueryKey });
      const previous = queryClient.getQueryData(serverCartQuery.queryKey);
      if (previous) {
        queryClient.setQueryData(
          serverCartQuery.queryKey,
          withQuantity(previous, variantId, quantity),
        );
      }
      return { previous };
    },
    onSuccess: (contents) => {
      if (isLastChange(queryClient)) queryClient.setQueryData(serverCartQuery.queryKey, contents);
    },
    onError: (error, _change, context) => {
      // A rejected token has already signed the customer out and emptied the cache; do not put their cart back.
      if (refusalFromError(error) === 'session_expired') return;
      if (context?.previous) queryClient.setQueryData(serverCartQuery.queryKey, context.previous);
      if (isLastChange(queryClient)) void queryClient.invalidateQueries({ queryKey: cartQueryKey });
    },
  });

  return useMemo<Cart>(() => {
    const setQuantity = async (variantId: number, quantity: number): Promise<CartChange> => {
      try {
        await applyChange({ variantId, quantity });
        return { ok: true };
      } catch (error) {
        return { ok: false, reason: refusalFromError(error) };
      }
    };

    const addItem = async ({ variantId }: LineSnapshot, amount: number): Promise<CartAddition> => {
      try {
        // Read the cart again first: it may have changed on another device since this screen loaded.
        const current = await queryClient.query({ ...serverCartQuery, staleTime: 0 });
        const existing = current.lines.find((line) => line.variantId === variantId)?.quantity ?? 0;
        const plan = planAddition(existing, amount);
        if (plan === null) return { ok: false, reason: 'quantity_out_of_range' };
        if (plan.quantity !== existing) await applyChange({ variantId, quantity: plan.quantity });
        return { ok: true, ...plan };
      } catch (error) {
        return { ok: false, reason: refusalFromError(error) };
      }
    };

    const clear = async (): Promise<CartChange> => {
      try {
        await clearServerCart();
        await queryClient.invalidateQueries({ queryKey: cartQueryKey });
        return { ok: true };
      } catch (error) {
        return { ok: false, reason: refusalFromError(error) };
      }
    };

    return {
      kind: 'server',
      status: statusOf(data !== undefined, isError, awaitingMerge),
      ...(data ?? EMPTY),
      setQuantity,
      addItem,
      remove: (variantId) => setQuantity(variantId, 0),
      clear,
      refetch: () => {
        void refetch();
      },
    };
  }, [applyChange, queryClient, data, isError, awaitingMerge, refetch]);
}
