import { EVENT_TIME, SUBORDER_ID, buildOrderDetail, buildPayment, buildSuborder } from './testData';
import type { OrderDetail, OrderRefund } from './types';

/** Placed but not paid: the 15-minute hold is running. */
export function pendingPaymentOrder(): OrderDetail {
  return buildOrderDetail({
    status: 'pending_payment',
    paid_at: null,
    payment_status: 'pending',
    suborders: [buildSuborder({ status: 'awaiting_payment' })],
    timeline: [{ type: 'order_placed', at: EVENT_TIME, suborder_id: null, note: null }],
    payments: [buildPayment({ status: 'pending', paid_at: null })],
  });
}

/** Paid and handed to the courier; a delivery code exists. */
export function onTheWayOrder(): OrderDetail {
  return buildOrderDetail({
    can_cancel: false,
    suborders: [
      buildSuborder({
        status: 'on_the_way',
        eta: { at: '2026-10-25T07:30:00.000000Z', reason: 'Heavy traffic on King Fahd Road' },
      }),
    ],
    timeline: [
      { type: 'order_placed', at: EVENT_TIME, suborder_id: null, note: null },
      { type: 'order_confirmed', at: EVENT_TIME, suborder_id: null, note: null },
      {
        type: 'preparing',
        at: '2026-10-24T17:40:00.000000Z',
        suborder_id: SUBORDER_ID,
        note: null,
      },
      {
        type: 'on_the_way',
        at: '2026-10-25T06:10:00.000000Z',
        suborder_id: SUBORDER_ID,
        note: null,
      },
      {
        type: 'eta_revised',
        at: '2026-10-25T06:20:00.000000Z',
        suborder_id: SUBORDER_ID,
        note: 'Heavy traffic on King Fahd Road',
      },
    ],
  });
}

export function deliveredOrder(): OrderDetail {
  return buildOrderDetail({
    status: 'completed',
    can_cancel: false,
    suborders: [buildSuborder({ status: 'delivered' })],
    timeline: [
      { type: 'order_placed', at: EVENT_TIME, suborder_id: null, note: null },
      {
        type: 'delivered',
        at: '2026-10-25T07:00:00.000000Z',
        suborder_id: SUBORDER_ID,
        note: null,
      },
      { type: 'order_completed', at: '2026-10-25T07:00:00.000000Z', suborder_id: null, note: null },
    ],
  });
}

export function cancelledOrder(refunds: OrderRefund[]): OrderDetail {
  return buildOrderDetail({
    status: 'cancelled',
    can_cancel: false,
    cancelled_at: '2026-10-24T18:00:00.000000Z',
    cancel_reason: 'customer_cancelled',
    suborders: [buildSuborder({ status: 'cancelled' })],
    timeline: [
      { type: 'order_placed', at: EVENT_TIME, suborder_id: null, note: null },
      { type: 'order_cancelled', at: '2026-10-24T18:00:00.000000Z', suborder_id: null, note: null },
    ],
    refunds,
  });
}
