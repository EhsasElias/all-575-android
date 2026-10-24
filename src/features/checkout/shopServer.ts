import type { FakeRoutes } from '@/test/fakeApi';
import type { Order } from './api';
import type { Payment } from './payment';
import { ORDER_ID, oneLineCart, order, payment } from './testData';

export const emptyCart = { data: { lines: [], items_count: 0, subtotal: 0, currency: 'SAR' } };

type Shop = {
  payments: Payment[];
  orderStatus: Order['status'];
  cartCleared: boolean;
  /** The Idempotency-Key of each `POST /checkout`, in order. */
  checkoutKeys: (string | null)[];
};

/**
 * A small stateful server for the payment flow: the unpaid order, its payments, the provider simulator and the
 * cart the server clears once the payment is confirmed. Tests read and change `shop` to script what happens.
 */
export function createShop(first: Payment = payment()) {
  const shop: Shop = {
    payments: [first],
    orderStatus: 'pending_payment',
    cartCleared: false,
    checkoutKeys: [],
  };
  const current = () => order({ status: shop.orderStatus, payments: shop.payments });
  let attempt = 1;

  const routes: FakeRoutes = {
    'GET /cart': () => ({ body: shop.cartCleared ? emptyCart : oneLineCart }),
    'POST /checkout': ({ headers }) => {
      shop.checkoutKeys.push(headers.get('Idempotency-Key'));
      const created = shop.payments[0];
      return {
        status: 201,
        body: { data: { order: current(), payment: created ?? null, replayed: false } },
      };
    },
    'GET /orders/:id': ({ params }) =>
      params.id === ORDER_ID
        ? { body: { data: current() } }
        : { status: 404, body: { message: 'Not found' } },
    'GET /payments/:id': ({ params }) => {
      const found = shop.payments.find((candidate) => candidate.id === params.id);
      // The provider session is shown only in the answer that creates the charge, never again.
      return found
        ? { body: { data: { ...found, action: null } } }
        : { status: 404, body: { message: 'Not found' } };
    },
    'POST /orders/:id/payments': ({ body }) => {
      attempt += 1;
      const method =
        typeof body === 'object' && body !== null && 'payment_method' in body
          ? body.payment_method
          : 'mada';
      shop.payments = shop.payments.map((existing) =>
        existing.status === 'pending' ? { ...existing, status: 'expired' } : existing,
      );
      const started = payment({
        id: `01m5qes8862tpn61meh2se7ze${attempt}`,
        method: method === 'card' || method === 'apple_pay' ? method : 'mada',
        action: { redirect_url: null, client_secret: 'fake_secret' },
      });
      shop.payments = [...shop.payments, started];
      return { status: 201, body: { data: started } };
    },
    'POST /dev/payments/:id/simulate': ({ params, body }) => {
      const succeed =
        typeof body === 'object' &&
        body !== null &&
        'outcome' in body &&
        body.outcome === 'succeed';
      shop.payments = shop.payments.map((existing) =>
        existing.id !== params.id
          ? existing
          : succeed
            ? { ...existing, status: 'paid', paid_at: new Date().toISOString() }
            : { ...existing, status: 'failed', failure_code: 'card_declined' },
      );
      if (succeed) {
        shop.orderStatus = 'confirmed';
        shop.cartCleared = true;
      }
      return { body: { outcome: succeed ? 'confirmed' : 'payment_failed' } };
    },
  };

  return { shop, routes };
}
