import type { Order } from './api';
import type { Payment } from './payment';

export type PaymentView = 'paid' | 'pending' | 'retry' | 'closed';

type PaymentViewInput = {
  order: Pick<Order, 'status'>;
  payment: Payment | null;
  /** The order is still unpaid and its items are still held, so another attempt is allowed. */
  holdActive: boolean;
  /** The server already refused another attempt (the hold ended, or the order is no longer payable). */
  retryRefused: boolean;
};

/** Which step the payment screen shows. Only the server's status counts, never how the customer got here. */
export function paymentView({
  order,
  payment,
  holdActive,
  retryRefused,
}: PaymentViewInput): PaymentView {
  if (order.status === 'confirmed' || order.status === 'completed') return 'paid';
  if (payment?.status === 'paid') return 'paid';
  if (order.status !== 'pending_payment' || payment === null) return 'closed';
  if (payment.status === 'pending') return 'pending';
  return holdActive && !retryRefused ? 'retry' : 'closed';
}
