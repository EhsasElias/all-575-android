import { useMutation, useQueryClient } from '@tanstack/react-query';
import { errorCode } from '@/shared/api';
import { cancelOrder } from '../api/ordersApi';
import { ordersKeys } from '../api/queryKeys';

export type CancelFailure = 'not_cancellable' | 'failed';

export function cancelFailureOf(error: unknown): CancelFailure {
  return errorCode(error) === 'order_not_cancellable' ? 'not_cancellable' : 'failed';
}

/** Cancels the order and puts the server's answer straight into the page, so it never shows stale data. */
export function useCancelOrder(orderId: string, onCancelled: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cancelOrder(orderId),
    onSuccess: (order) => {
      queryClient.setQueryData(ordersKeys.detail(orderId), order);
      void queryClient.invalidateQueries({ queryKey: ordersKeys.list() });
      onCancelled();
    },
    onError: (error) => {
      // The seller may have started preparing a moment ago: reload so the page stops offering the button.
      if (cancelFailureOf(error) === 'not_cancellable') {
        void queryClient.invalidateQueries({ queryKey: ordersKeys.detail(orderId) });
      }
    },
  });
}
