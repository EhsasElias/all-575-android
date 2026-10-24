import {
  matchQuery,
  queryOptions,
  skipToken,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect, useId, useState } from 'react';
import { cartQueryKey } from '@/features/cart';
import { errorCode } from '@/shared/api';
import { requestQuote } from './api';
import { normalizePromoCode, promoProblemFrom, type PromoProblem } from './promoProblem';
import { checkoutKeys } from './queryKeys';
import type { Quote } from './quote';
import { useNow } from './useNow';

// When a guest signs in, their device cart is merged into the server cart while checkout already opens. An
// empty cart is therefore asked about once more before the customer is told there is nothing to buy.
const CART_EMPTY_RECHECK_MS = 1000;

/**
 * One quote per address and promo code, per visit to the screen. The server owns the expiry: a quote is reused
 * until then and not a moment longer.
 */
function quoteOptions(visit: string, addressId: number | null, promoCode: string | null) {
  return queryOptions({
    queryKey: checkoutKeys.quote(visit, addressId, promoCode),
    queryFn:
      addressId === null
        ? skipToken
        : ({ signal }) => requestQuote({ addressId, promoCode }, signal),
    staleTime: (query) =>
      query.state.data ? Math.max(0, query.state.data.expiresAtMs - Date.now()) : 0,
    retry: (failureCount, error) => errorCode(error) === 'cart_empty' && failureCount < 1,
    retryDelay: CART_EMPTY_RECHECK_MS,
  });
}

/** The itemized price for the chosen address, re-requested whenever the address or the promo code changes. */
export function useQuoteFlow(addressId: number | null) {
  const queryClient = useQueryClient();
  const visit = useId();
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [promoProblem, setPromoProblem] = useState<PromoProblem | null>(null);
  const [checkingPromo, setCheckingPromo] = useState(false);

  const query = useQuery(quoteOptions(visit, addressId, promoCode));
  const quote = query.data ?? null;
  const now = useNow(1000, quote !== null);
  const { refetch } = query;

  // The cart changed somewhere else (the merge after signing in, a finished edit): price what is in it now.
  useEffect(() => {
    if (addressId === null) return;
    return queryClient.getQueryCache().subscribe((event) => {
      const cartInvalidated =
        event.type === 'updated' &&
        event.action.type === 'invalidate' &&
        matchQuery({ queryKey: cartQueryKey }, event.query);
      if (cartInvalidated) void refetch();
    });
  }, [queryClient, addressId, refetch]);

  const applyPromo = async (raw: string) => {
    const code = normalizePromoCode(raw);
    if (code === '' || addressId === null) return;
    setCheckingPromo(true);
    try {
      // Asked in the handler, not in an effect, so a refused code leaves the current quote on screen.
      await queryClient.query({ ...quoteOptions(visit, addressId, code), staleTime: 0 });
      setPromoCode(code);
      setPromoProblem(null);
    } catch (error) {
      setPromoProblem(promoProblemFrom(error) ?? { code: 'failed' });
    } finally {
      setCheckingPromo(false);
    }
  };

  return {
    quote,
    isLoading: addressId !== null && query.isPending,
    isRefreshing: query.isFetching,
    error: query.isError ? query.error : null,
    expired: quote !== null && now >= quote.expiresAtMs,
    refresh: () => void query.refetch(),
    /** Puts a quote the server just sent (after `quote_changed`) in place of the one on screen. */
    replace: (fresh: Quote) => {
      queryClient.setQueryData(checkoutKeys.quote(visit, addressId, promoCode), fresh);
    },
    promo: {
      applied: quote?.promoCode ?? null,
      problem: promoProblem,
      checking: checkingPromo,
      apply: applyPromo,
      remove: () => {
        setPromoCode(null);
        setPromoProblem(null);
      },
      dismissProblem: () => {
        setPromoProblem(null);
      },
    },
  };
}

export type QuoteFlow = ReturnType<typeof useQuoteFlow>;
