import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { cartQueryKey } from '@/features/cart';
import { errorCode, isApiError } from '@/shared/api';
import { routeTo } from '@/shared/lib';
import { getOrder, getPayment, retryPayment } from './api';
import { recallRedirectUrl, rememberPaymentAction } from './paymentHandoff';
import { currentPayment, isFinalStatus, type PayMethod } from './payment';
import { paymentView } from './paymentView';
import { pollDelayMs } from './polling';
import { checkoutKeys } from './queryKeys';
import { useNow } from './useNow';

/** Refusals of a new payment attempt that mean the order can no longer be paid. */
const CLOSED_CODES = ['payment_window_closed', 'order_not_payable'];

/**
 * Follows one order's payment until the server says it is paid, failed or expired. The status is asked for
 * again every few seconds and the asking stops by itself when the screen goes away.
 */
export function usePaymentFlow(orderId: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [chooserOpen, setChooserOpen] = useState(false);

  const order = useQuery({
    queryKey: checkoutKeys.order(orderId),
    queryFn: ({ signal }) => getOrder(orderId, signal),
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const latest = currentPayment(order.data?.payments ?? []);
  const paymentId = latest?.id ?? null;

  const live = useQuery({
    queryKey: checkoutKeys.payment(paymentId),
    queryFn: paymentId === null ? skipToken : ({ signal }) => getPayment(paymentId, signal),
    staleTime: 0,
    retry: false,
    refetchInterval: (query) =>
      isFinalStatus(query.state.data?.status) ? false : pollDelayMs(query.state.dataUpdateCount),
  });
  const payment = live.data ?? latest;

  const retry = useMutation({
    mutationFn: (method: PayMethod) => retryPayment(orderId, method),
    onSuccess: async (started) => {
      rememberPaymentAction(started);
      setChooserOpen(false);
      await queryClient.invalidateQueries({ queryKey: checkoutKeys.order(orderId) });
    },
    onError: (error) => {
      // The order may just have been cancelled: look again so the screen shows the truth.
      if (CLOSED_CODES.includes(errorCode(error) ?? '')) {
        void queryClient.invalidateQueries({ queryKey: checkoutKeys.order(orderId) });
      }
    },
  });

  const holdEndsAtMs = payment ? Date.parse(payment.expires_at) : null;
  const now = useNow(1000, payment?.status === 'pending' || payment?.status === 'failed');
  const holdActive = holdEndsAtMs !== null && holdEndsAtMs > now;
  const retryRefused = CLOSED_CODES.includes(errorCode(retry.error) ?? '');
  const view = order.data
    ? paymentView({ order: order.data, payment, holdActive, retryRefused })
    : null;

  // Paid: the server has cleared the cart, so the cart list must be fetched again, and the order is the next stop.
  useEffect(() => {
    if (view !== 'paid') return;
    void queryClient.invalidateQueries({ queryKey: cartQueryKey });
    void navigate(routeTo.order(orderId), { replace: true });
  }, [view, orderId, queryClient, navigate]);

  return {
    order,
    notFound: order.isError && isApiError(order.error) && order.error.kind === 'not-found',
    view,
    payment,
    orderNumber: order.data?.number ?? null,
    holdEndsAtMs,
    redirectUrl: recallRedirectUrl(paymentId),
    chooserOpen,
    toggleChooser: () => {
      setChooserOpen((open) => !open);
    },
    refreshPayment: () =>
      queryClient.invalidateQueries({ queryKey: checkoutKeys.payment(paymentId) }),
    retry,
  };
}
