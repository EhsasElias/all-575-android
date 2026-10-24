import type { IconName } from '@/shared/ui';
import type { OrderStatus, SuborderStatus } from '../types';

/**
 * How a status looks. The icon and the words carry the meaning; the tone only adds a hint,
 * so nothing here depends on colour alone.
 */
export type StatusTone = 'neutral' | 'active' | 'success' | 'danger';
export type StatusLook = { icon: IconName; tone: StatusTone };

export const ORDER_STATUS_LOOK: Record<OrderStatus, StatusLook> = {
  pending_payment: { icon: 'clock', tone: 'neutral' },
  confirmed: { icon: 'check-circle', tone: 'active' },
  completed: { icon: 'package', tone: 'success' },
  cancelled: { icon: 'close', tone: 'danger' },
};

export const SUBORDER_STATUS_LOOK: Record<SuborderStatus, StatusLook> = {
  awaiting_payment: { icon: 'clock', tone: 'neutral' },
  awaiting_seller: { icon: 'clock', tone: 'neutral' },
  preparing: { icon: 'package', tone: 'active' },
  ready: { icon: 'check-circle', tone: 'active' },
  on_the_way: { icon: 'truck', tone: 'active' },
  delivered: { icon: 'check-circle', tone: 'success' },
  cancelled: { icon: 'close', tone: 'danger' },
};

const ORDER_STATUSES: readonly OrderStatus[] = [
  'pending_payment',
  'confirmed',
  'completed',
  'cancelled',
];

/** The spending report types its status as a plain string. */
export function isOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUSES.some((status) => status === value);
}

/** An order that can still change: unpaid, or paid and not finished. Everything else is final. */
export function isActiveOrder(status: OrderStatus): boolean {
  return status === 'pending_payment' || status === 'confirmed';
}
