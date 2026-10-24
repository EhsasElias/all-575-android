import { PLACED_AT } from './testData';
import type { SpendingReport } from './types';

export function buildReport(overrides: Partial<SpendingReport> = {}): SpendingReport {
  return {
    summary: {
      orders: 2,
      paid: 4300,
      refunded: 2150,
      net_spent: 2150,
      savings: 200,
      vat_included: 560,
      delivery_fees: 2000,
    },
    rows: [
      {
        order_number: 'A575-IICOU1LN',
        status: 'cancelled',
        order_date: PLACED_AT,
        payment_date: '2026-10-24T17:20:00.000000Z',
        refund_date: '2026-10-26T09:00:00.000000Z',
        subtotal: 1150,
        discount: 0,
        delivery_fee: 1000,
        vat_included: 280,
        total: 2150,
        refunded: 2150,
        net_spent: 0,
      },
      {
        order_number: 'A575-ZZ99XY12',
        status: 'completed',
        order_date: '2026-10-20T10:00:00.000000Z',
        payment_date: '2026-10-20T10:01:00.000000Z',
        refund_date: null,
        subtotal: 1150,
        discount: 200,
        delivery_fee: 1000,
        vat_included: 280,
        total: 2150,
        refunded: 0,
        net_spent: 2150,
      },
    ],
    currency: 'SAR',
    timezone: 'Asia/Riyadh',
    from: '2026-09-25',
    to: '2026-10-24',
    ...overrides,
  };
}
