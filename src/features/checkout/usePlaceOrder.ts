import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { cartQueryKey } from '@/features/cart';
import { routeTo } from '@/shared/lib';
import { placeOrder, type CheckoutRequest } from './api';
import { createAttemptKeys, shouldRenewKey } from './idempotency';
import { rememberPaymentAction } from './paymentHandoff';
import { problemFromError, recoveryFor, type CheckoutProblem } from './problems';
import type { Quote } from './quote';

/** What the screen does to get back on track after the server refused (it knows the data; this hook knows the rule). */
export type Recover = {
  refreshQuote: () => void;
  refreshSlots: () => void;
  refreshAddresses: () => void;
  replaceQuote: (quote: Quote) => void;
};

type Attempt = CheckoutRequest & { shownTotal: number };

/**
 * Places the order for the quote the customer is looking at. The idempotency key stays the same while the
 * quote, slot and method stay the same and no answer has come back, so a retry can never charge twice.
 */
export function usePlaceOrder(recover: Recover) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [keys] = useState(() => createAttemptKeys());
  // Set synchronously: a second tap can arrive before the screen has re-rendered with its loading state.
  const sending = useRef(false);
  // The cart is refreshed when this screen has gone, not while it is still showing: its price request would
  // otherwise run again for a cart that has just been emptied.
  const [leavingForOrder, setLeavingForOrder] = useState(false);
  useEffect(() => {
    if (!leavingForOrder) return;
    return () => {
      queueMicrotask(() => void queryClient.invalidateQueries({ queryKey: cartQueryKey }));
    };
  }, [leavingForOrder, queryClient]);
  const [failure, setFailure] = useState<{ problem: CheckoutProblem; shownTotal: number } | null>(
    null,
  );

  const mutation = useMutation({
    mutationFn: (attempt: Attempt) => placeOrder(attempt, keys.keyFor(attempt)),
    onSuccess: (placed) => {
      if (placed.payment === null || placed.confirmed) {
        // Nothing to pay (a promo code covered the total): the order is already confirmed.
        setLeavingForOrder(true);
        void navigate(routeTo.order(placed.orderId), { replace: true });
        return;
      }
      rememberPaymentAction(placed.payment);
      void navigate(routeTo.checkoutPayment(placed.orderId), { replace: true });
    },
    onError: (error, attempt) => {
      if (shouldRenewKey(error)) keys.renew();
      const problem = problemFromError(error);
      setFailure({ problem, shownTotal: attempt.shownTotal });
      if (problem.kind === 'quote_changed') recover.replaceQuote(problem.quote);
      const recovery = recoveryFor(problem);
      if (recovery === 'refresh-quote') recover.refreshQuote();
      if (recovery === 'refresh-slots') recover.refreshSlots();
      if (recovery === 'refresh-addresses') recover.refreshAddresses();
    },
  });

  return {
    place: (attempt: Attempt) => {
      if (sending.current) return;
      sending.current = true;
      setFailure(null);
      mutation.mutate(attempt, {
        onSettled: () => {
          sending.current = false;
        },
      });
    },
    isPlacing: mutation.isPending || mutation.isSuccess,
    problem: failure?.problem ?? null,
    /** The total the customer had agreed to when the server refused, to say how far the price moved. */
    shownTotal: failure?.shownTotal ?? null,
    dismiss: () => {
      setFailure(null);
    },
  };
}
