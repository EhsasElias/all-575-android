import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderCheckout } from './checkoutHarness';
import { createShop } from './shopServer';
import { ORDER_ID, order, payment } from './testData';

const PAYMENT_ROUTE = `/checkout/payment/${ORDER_ID}`;

afterEach(() => {
  vi.useRealTimers();
});

describe('Payment status screen', () => {
  it('opens for an unpaid order: status, countdown, and the development-only simulator', async () => {
    const { shop, routes } = createShop();
    const { api } = await renderCheckout({ route: PAYMENT_ROUTE, routes });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Complete your payment' }),
    ).toBeVisible();
    expect(screen.queryByText('Page not found')).not.toBeInTheDocument();
    expect(screen.getByText(/Order A575-WRELFAKW/)).toBeVisible();
    expect(screen.getByRole('timer')).toHaveTextContent(/^1[45]:\d\d$/);
    expect(screen.getByText('Waiting for the bank to confirm your payment')).toBeVisible();
    expect(screen.getByText(/Coming back to the app does not confirm a payment/)).toBeVisible();
    expect(await screen.findByRole('button', { name: 'Simulate success' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Simulate failure' })).toBeVisible();

    // The payment is found through the order, then asked for by its own id.
    expect(api.requests()).toContain(`GET /orders/${ORDER_ID}`);
    expect(api.requests()).toContain(`GET /payments/${shop.payments[0]?.id}`);
  });

  it('shows a not-found state for an order that is not the customer’s', async () => {
    await renderCheckout({
      route: '/checkout/payment/01zzzzzzzzzzzzzzzzzzzzzzzz',
      routes: createShop().routes,
    });

    expect(await screen.findByRole('heading', { level: 1, name: 'Order not found' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'My orders' })).toHaveAttribute('href', '/orders');
  });

  it('shows an error state with a retry when the order cannot be loaded', async () => {
    const user = userEvent.setup();
    const { shop, routes } = createShop();
    let attempts = 0;
    await renderCheckout({
      route: PAYMENT_ROUTE,
      routes: {
        ...routes,
        'GET /orders/:id': () => {
          attempts += 1;
          return attempts <= 3
            ? { status: 500, body: { message: 'Boom' } }
            : { body: { data: order({ payments: shop.payments }) } };
        },
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Try again' }, { timeout: 5000 }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Complete your payment' }),
    ).toBeVisible();
  });

  it('fails the payment, lets the customer pay another way, and follows the new payment to the order', async () => {
    const user = userEvent.setup();
    const { shop, routes } = createShop();
    const { api, router } = await renderCheckout({ route: PAYMENT_ROUTE, routes });

    await user.click(await screen.findByRole('button', { name: 'Simulate failure' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'The payment did not go through' }),
    ).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('Your card was declined');
    expect(screen.getByRole('timer')).toBeVisible();
    // The method that failed is not the one pre-selected again.
    expect(screen.getByRole('radio', { name: /mada/ })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: /Visa or Mastercard/ })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: /Apple Pay/ }));
    await user.click(screen.getByRole('button', { name: 'Pay with Apple Pay' }));

    const retry = await waitFor(() => {
      const call = api
        .calls()
        .find((candidate) => candidate.path === `/orders/${ORDER_ID}/payments`);
      expect(call).toBeDefined();
      return call;
    });
    expect(retry?.method).toBe('POST');
    expect(retry?.body).toEqual({ payment_method: 'apple_pay' });

    // Back to waiting, now for the new payment.
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Complete your payment' }),
    ).toBeVisible();
    const newest = shop.payments[shop.payments.length - 1];
    await waitFor(() => {
      expect(api.requests()).toContain(`GET /payments/${newest?.id}`);
    });

    await user.click(screen.getByRole('button', { name: 'Simulate success' }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/orders/${ORDER_ID}`);
    });
  });

  it('explains when the time to pay is over, and links back to the cart', async () => {
    const { routes } = createShop(
      payment({ status: 'expired', expires_at: new Date(Date.now() - 60_000).toISOString() }),
    );
    await renderCheckout({
      route: PAYMENT_ROUTE,
      routes: {
        ...routes,
        'GET /orders/:id': {
          body: {
            data: order({
              status: 'cancelled',
              payments: [
                payment({
                  status: 'expired',
                  expires_at: new Date(Date.now() - 60_000).toISOString(),
                }),
              ],
            }),
          },
        },
      },
    });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'This order can no longer be paid' }),
    ).toBeVisible();
    expect(screen.getByText(/Nothing was charged/)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Back to cart' })).toHaveAttribute('href', '/cart');
    expect(screen.queryByRole('button', { name: /Pay with/ })).not.toBeInTheDocument();
  });

  it('stops offering new attempts when the server says the payment window closed', async () => {
    const user = userEvent.setup();
    const { routes } = createShop();
    await renderCheckout({
      route: PAYMENT_ROUTE,
      routes: {
        ...routes,
        'POST /orders/:id/payments': {
          status: 409,
          body: {
            message: 'The time to pay for this order has run out.',
            code: 'payment_window_closed',
          },
        },
      },
    });

    await user.click(await screen.findByRole('button', { name: 'Simulate failure' }));
    await user.click(await screen.findByRole('button', { name: /Pay with/ }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'This order can no longer be paid' }),
    ).toBeVisible();
  });

  it.each([
    [
      'payments_unavailable',
      503,
      'Online payment is not available right now. Please try again later.',
    ],
    [
      'payment_provider_error',
      502,
      'The payment service is not responding. Wait a moment and try again.',
    ],
  ])('keeps the retry form and explains %s', async (code, status, message) => {
    const user = userEvent.setup();
    const { routes } = createShop();
    await renderCheckout({
      route: PAYMENT_ROUTE,
      routes: { ...routes, 'POST /orders/:id/payments': { status, body: { message: 'x', code } } },
    });

    await user.click(await screen.findByRole('button', { name: 'Simulate failure' }));
    await user.click(await screen.findByRole('button', { name: /Pay with/ }));

    expect(await screen.findByText(message)).toBeVisible();
    expect(screen.getByRole('button', { name: /Pay with/ })).toBeVisible();
  });
});

describe('Payment status polling', () => {
  it('asks again every few seconds while pending, and stops when the screen goes away', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { shop, routes } = createShop();
    const { api, router } = await renderCheckout({ route: PAYMENT_ROUTE, routes });
    await screen.findByRole('heading', { level: 1, name: 'Complete your payment' });
    const polls = () =>
      api.requests().filter((request) => request === `GET /payments/${shop.payments[0]?.id}`)
        .length;

    await waitFor(() => {
      expect(polls()).toBeGreaterThanOrEqual(1);
    });
    const first = polls();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6100);
    });
    expect(polls()).toBeGreaterThanOrEqual(first + 2);

    await act(async () => {
      await router.navigate('/home');
    });
    const afterLeaving = polls();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(polls()).toBe(afterLeaving);
  });

  it('stops asking once the server says failed', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { shop, routes } = createShop(
      payment({ status: 'failed', failure_code: 'card_declined' }),
    );
    const { api } = await renderCheckout({ route: PAYMENT_ROUTE, routes });
    await screen.findByRole('heading', { level: 1, name: 'The payment did not go through' });
    const polls = () =>
      api.requests().filter((request) => request === `GET /payments/${shop.payments[0]?.id}`)
        .length;
    const settled = polls();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(polls()).toBe(settled);
    expect(within(screen.getByRole('main')).getByRole('alert')).toBeVisible();
  });
});

describe('Payment status screen (Arabic)', () => {
  it('is right to left and fully translated', async () => {
    await renderCheckout({ route: PAYMENT_ROUTE, routes: createShop().routes, language: 'ar' });

    expect(await screen.findByRole('heading', { level: 1, name: 'أكمل الدفع' })).toBeVisible();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(screen.getByText('الوقت المتبقي للدفع:')).toBeVisible();
    expect(screen.getByText('بانتظار تأكيد البنك لدفعك')).toBeVisible();
    expect(screen.queryByText('Complete your payment')).not.toBeInTheDocument();
  });
});
