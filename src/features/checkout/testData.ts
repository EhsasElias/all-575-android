import { formatMoney } from '@/shared/i18n';
import type { Address, Order, Slot } from './api';
import type { Payment } from './payment';

export const home: Address = {
  id: 1,
  label: 'Home',
  recipient_name: 'Sara',
  recipient_phone: '+966512345678',
  region: 'Riyadh',
  city: 'Riyadh',
  district: 'Al Olaya',
  street: 'King Fahd Rd',
  building_number: '1234',
  additional_number: '5678',
  postal_code: '12211',
  short_address: 'RRRD2929',
  unit: null,
  floor: null,
  delivery_notes: null,
  lat: 24.7136,
  lng: 46.6753,
  is_default: true,
  serviceable: true,
  service_zone_id: 1,
};

export const work: Address = {
  ...home,
  id: 3,
  label: 'Work',
  district: 'Al Malaz',
  is_default: false,
};

export const jeddah: Address = {
  ...home,
  id: 2,
  label: 'Jeddah flat',
  city: 'Jeddah',
  is_default: false,
  serviceable: false,
  service_zone_id: null,
};

export const riyadhZone = {
  id: 1,
  name: { ar: 'الرياض', en: 'Riyadh' },
  delivery_fee: 1000,
  free_delivery_threshold: 5000,
  currency: 'SAR',
};

/** The cart as `GET /cart` answers it: one line, two units. */
export const oneLineCart = {
  data: {
    lines: [
      {
        variant_id: 1,
        product_slug: 'demo-food-1',
        name: { ar: 'بسكويت', en: 'Biscuits' },
        variant_name: null,
        image_url: null,
        quantity: 2,
        unit_price: 575,
        line_price: 1150,
        availability: 'unknown',
      },
    ],
    items_count: 2,
    subtotal: 1150,
    currency: 'SAR',
  },
};

const MINUTE_MS = 60_000;

/** A raw `POST /quotes` answer for two biscuits to a Riyadh address: 11.50 of goods + 10.00 delivery. */
export function quote(overrides: Record<string, unknown> = {}) {
  return {
    id: '01m5qepms76n93z1rjvvwzb2gj',
    expires_at: new Date(Date.now() + 10 * MINUTE_MS).toISOString(),
    currency: 'SAR',
    lines: [
      {
        variant_id: 1,
        product_id: 1,
        seller_id: 1,
        product_slug: 'demo-food-1',
        name: { ar: 'بسكويت', en: 'Biscuits' },
        variant_name: null,
        image_url: null,
        quantity: 2,
        unit_price: 575,
        line_price: 1150,
        discount: 0,
        line_total: 1150,
        vat_class: 'standard',
        vat_rate_basis_points: 1500,
        available: true,
        available_units: 100,
      },
    ],
    subtotal: 1150,
    discount: 0,
    delivery_fee: 1000,
    total: 2150,
    vat_included: 280,
    vat: [],
    promo_code: null,
    address_id: 1,
    zone_id: 1,
    issues: [],
    can_checkout: true,
    ...overrides,
  };
}

/** 21.50 SAR as the screen writes it (with a no-break space before the currency). */
export const TOTAL_TEXT = formatMoney(2150, 'en');

/** Two days of delivery times in Saudi time: 9:00-11:00, 11:00-13:00 (full) and 21:00-23:00 on October 25, then 9:00-11:00 on October 26. */
export const slots: Slot[] = [
  {
    id: 8,
    starts_at: '2026-10-25T06:00:00.000000Z',
    ends_at: '2026-10-25T08:00:00.000000Z',
    remaining: 20,
    available: true,
  },
  {
    id: 9,
    starts_at: '2026-10-25T08:00:00.000000Z',
    ends_at: '2026-10-25T10:00:00.000000Z',
    remaining: 0,
    available: false,
  },
  {
    id: 14,
    starts_at: '2026-10-25T18:00:00.000000Z',
    ends_at: '2026-10-25T20:00:00.000000Z',
    remaining: 4,
    available: true,
  },
  {
    id: 15,
    starts_at: '2026-10-26T06:00:00.000000Z',
    ends_at: '2026-10-26T08:00:00.000000Z',
    remaining: 20,
    available: true,
  },
];

export const ORDER_ID = '01m5qes24fbpdaqq84m8g3yzvh';

export function payment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: '01m5qes24m7he3kmtccnth5cf6',
    order_id: ORDER_ID,
    status: 'pending',
    method: 'mada',
    amount: 2150,
    currency: 'SAR',
    expires_at: new Date(Date.now() + 15 * MINUTE_MS).toISOString(),
    paid_at: null,
    failure_code: null,
    action: null,
    ...overrides,
  };
}

export function order(overrides: Partial<Order> = {}): Order {
  return {
    id: ORDER_ID,
    number: 'A575-WRELFAKW',
    status: 'pending_payment',
    placed_at: '2026-10-24T17:19:17.000000Z',
    paid_at: null,
    total: 2150,
    currency: 'SAR',
    items_count: 2,
    preview_images: [],
    slot: { starts_at: slots[0]?.starts_at ?? null, ends_at: slots[0]?.ends_at ?? null },
    payment_status: 'pending',
    address: {
      recipient_name: 'Sara',
      recipient_phone: '+966512345678',
      region: 'Riyadh',
      city: 'Riyadh',
      district: 'Al Olaya',
      street: 'King Fahd Rd',
      building_number: '1234',
      additional_number: '5678',
      postal_code: '12211',
      short_address: null,
      unit: null,
      floor: null,
      delivery_notes: null,
      lat: 24.7136,
      lng: 46.6753,
    },
    amounts: {
      subtotal: 1150,
      discount: 0,
      delivery_fee: 1000,
      total: 2150,
      vat_included: 280,
      vat: [],
    },
    promo_code: null,
    customer_notes: null,
    cancelled_at: null,
    cancel_reason: null,
    can_cancel: true,
    suborders: [],
    timeline: [],
    payments: [payment()],
    refunds: [],
    ...overrides,
  };
}
