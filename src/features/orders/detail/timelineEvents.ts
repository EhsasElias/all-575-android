import type { IconName } from '@/shared/ui';

/** The events the API writes to an order's timeline, and the icon each one gets. */
const EVENT_ICONS = {
  order_placed: 'receipt',
  payment_confirmed: 'credit-card',
  order_confirmed: 'check-circle',
  preparing: 'package',
  ready: 'check-circle',
  on_the_way: 'truck',
  delivered: 'check-circle',
  cancelled: 'close',
  eta_revised: 'clock',
  order_completed: 'check-circle',
  order_cancelled: 'close',
  refund_succeeded: 'check-circle',
  refund_failed: 'alert-circle',
  late_payment_refunded: 'info',
  payment_failed: 'alert-circle',
} as const satisfies Record<string, IconName>;

export type KnownTimelineEvent = keyof typeof EVENT_ICONS;

export function isKnownTimelineEvent(type: string): type is KnownTimelineEvent {
  return Object.hasOwn(EVENT_ICONS, type);
}

export function timelineIcon(type: string): IconName {
  return isKnownTimelineEvent(type) ? EVENT_ICONS[type] : 'info';
}
