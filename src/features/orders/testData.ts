import type {
  OrderDetail,
  OrderPayment,
  OrderRefund,
  OrderSummary,
  Review,
  Suborder,
  SuborderItem,
} from './types';

/** 24 Oct 2026, 8:18 PM in Riyadh. */
export const PLACED_AT = '2026-10-24T17:18:04.000000Z';
/** 8:20 PM in Riyadh. */
export const PAID_AT = '2026-10-24T17:20:00.000000Z';
export const ORDER_ID = '01m5qeptz6cjdsae1te3044hvx';
export const SUBORDER_ID = '01m5qeptz89pkp6abgqfm4xx4b';

export function buildOrderSummary(overrides: Partial<OrderSummary> = {}): OrderSummary {
  return {
    id: ORDER_ID,
    number: 'A575-IICOU1LN',
    status: 'confirmed',
    placed_at: PLACED_AT,
    paid_at: PAID_AT,
    total: 2150,
    currency: 'SAR',
    items_count: 2,
    preview_images: ['http://127.0.0.1:8000/images/all575/products/demo-cleaning-1.png'],
    slot: { starts_at: '2026-10-25T06:00:00.000000Z', ends_at: '2026-10-25T08:00:00.000000Z' },
    payment_status: 'paid',
    ...overrides,
  };
}

export function ordersPage(orders: OrderSummary[], nextCursor: string | null = null) {
  return {
    data: orders,
    links: { first: null, last: null, prev: null, next: null },
    meta: {
      path: 'http://127.0.0.1:8000/api/v1/orders',
      per_page: 20,
      next_cursor: nextCursor,
      prev_cursor: null,
    },
  };
}

export function buildItem(overrides: Partial<SuborderItem> = {}): SuborderItem {
  return {
    product_slug: 'demo-cleaning-1',
    name: { ar: 'فرشاة تنظيف', en: 'Cleaning Brush' },
    variant_name: null,
    image_url: 'http://127.0.0.1:8000/images/all575/products/demo-cleaning-1.png',
    quantity: 2,
    unit_price: 575,
    line_total: 1150,
    ...overrides,
  };
}

export function buildSuborder(overrides: Partial<Suborder> = {}): Suborder {
  return {
    id: SUBORDER_ID,
    status: 'awaiting_seller',
    seller: {
      slug: 'value-store',
      name: { ar: 'متجر التوفير', en: 'Value Store' },
      logo_url: null,
    },
    eta: { at: null, reason: null },
    items: [buildItem()],
    ...overrides,
  };
}

export function buildPayment(overrides: Partial<OrderPayment> = {}): OrderPayment {
  return {
    id: 'pay-1',
    order_id: ORDER_ID,
    status: 'paid',
    method: 'mada',
    amount: 2150,
    currency: 'SAR',
    expires_at: '2026-10-24T17:33:04.000000Z',
    paid_at: PAID_AT,
    failure_code: null,
    action: null,
    ...overrides,
  };
}

export function buildRefund(overrides: Partial<OrderRefund> = {}): OrderRefund {
  return {
    id: 'refund-1',
    status: 'pending',
    amount: 2150,
    reason: 'customer_cancelled',
    credit_note_number: null,
    requested_at: '2026-10-24T18:00:00.000000Z',
    completed_at: null,
    ...overrides,
  };
}

export const EVENT_TIME = '2026-10-24T17:18:04.000000Z';

export function buildOrderDetail(overrides: Partial<OrderDetail> = {}): OrderDetail {
  return {
    ...buildOrderSummary(),
    address: {
      recipient_name: 'Order Tester',
      recipient_phone: '+966565926409',
      region: 'Riyadh Region',
      city: 'Riyadh',
      district: 'Al Olaya',
      street: 'King Fahd Road',
      building_number: '8228',
      additional_number: '2121',
      postal_code: '12611',
      short_address: 'RRRD2929',
      unit: null,
      floor: null,
      delivery_notes: null,
      lat: 24.71,
      lng: 46.67,
    },
    amounts: {
      subtotal: 1150,
      discount: 0,
      delivery_fee: 1000,
      total: 2150,
      vat_included: 280,
      vat: [
        {
          vat_class: 'standard',
          rate_basis_points: 1500,
          taxable_net: 1870,
          vat: 280,
          gross: 2150,
        },
      ],
    },
    promo_code: null,
    customer_notes: null,
    cancelled_at: null,
    cancel_reason: null,
    can_cancel: true,
    suborders: [buildSuborder()],
    timeline: [
      { type: 'order_placed', at: EVENT_TIME, suborder_id: null, note: null },
      { type: 'payment_confirmed', at: EVENT_TIME, suborder_id: null, note: null },
      { type: 'order_confirmed', at: EVENT_TIME, suborder_id: null, note: null },
    ],
    payments: [buildPayment()],
    refunds: [],
    ...overrides,
  };
}

export function buildReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 55,
    rating: 4,
    body: 'Works well',
    reviewer: 'Sara A.',
    created_at: '2026-10-25T08:00:00.000000Z',
    editable_until: '2999-01-01T00:00:00.000000Z',
    ...overrides,
  };
}
