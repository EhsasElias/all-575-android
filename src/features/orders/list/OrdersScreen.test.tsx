import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { testUser } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { buildOrderSummary, ordersPage } from '../testData';
import { holdRequests } from '../testHelpers';

const signedIn = { 'GET /me': { body: { data: testUser } } };

function openOrders(language: 'en' | 'ar' = 'en') {
  return renderApp({ route: '/orders', signedIn: true, seenWelcome: true, language });
}

describe('Orders list: states', () => {
  it('shows a loading placeholder while the orders load', async () => {
    installFakeApi({ ...signedIn, 'GET /orders': { body: ordersPage([buildOrderSummary()]) } });
    const gate = holdRequests('/orders');

    await openOrders();

    expect(await screen.findByRole('heading', { level: 1, name: 'My orders' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading' })).toHaveAttribute('aria-busy', 'true');
    gate.release();
    expect(await screen.findByText('Order A575-IICOU1LN')).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument();
  });

  it('invites the customer to start shopping when there are no orders', async () => {
    installFakeApi({ ...signedIn, 'GET /orders': { body: ordersPage([]) } });

    await openOrders();

    expect(await screen.findByRole('heading', { name: 'No orders yet' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Start shopping' })).toHaveAttribute('href', '/home');
  });

  it('shows an error with a retry, and recovers', async () => {
    const user = userEvent.setup();
    let attempts = 0;
    installFakeApi({
      ...signedIn,
      'GET /orders': () => {
        attempts += 1;
        // A 4xx is not retried by the app's query client, so the error appears at once.
        return attempts === 1
          ? { status: 429, body: { message: 'Slow down' } }
          : { body: ordersPage([buildOrderSummary()]) };
      },
    });

    await openOrders();
    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('We could not load your orders')).toBeInTheDocument();
    expect(screen.queryByText('Slow down')).not.toBeInTheDocument();

    await user.click(within(alert).getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Order A575-IICOU1LN')).toBeInTheDocument();
  });
});

describe('Orders list: cards', () => {
  it('shows the number, a status with words, the date, the item count and the total', async () => {
    installFakeApi({ ...signedIn, 'GET /orders': { body: ordersPage([buildOrderSummary()]) } });

    await openOrders();

    const card = (await screen.findByText('Order A575-IICOU1LN')).closest('li');
    expect(card).not.toBeNull();
    const scope = within(card ?? document.body);
    expect(scope.getByText('Confirmed')).toBeInTheDocument();
    expect(scope.getByText('24 Oct 2026')).toBeInTheDocument();
    expect(scope.getByText('2')).toBeInTheDocument();
    expect(scope.getByText(/21\.50\s+SAR/)).toBeInTheDocument();
    expect(scope.getByRole('link', { name: 'Order A575-IICOU1LN' })).toHaveAttribute(
      'href',
      '/orders/01m5qeptz6cjdsae1te3044hvx',
    );
    expect(scope.queryByRole('link', { name: 'Complete payment' })).not.toBeInTheDocument();
  });

  it('points an unpaid order to the payment screen', async () => {
    const unpaid = buildOrderSummary({
      status: 'pending_payment',
      paid_at: null,
      payment_status: 'pending',
    });
    installFakeApi({ ...signedIn, 'GET /orders': { body: ordersPage([unpaid]) } });

    await openOrders();

    expect(await screen.findByText('Awaiting payment')).toBeInTheDocument();
    expect(screen.getByText('Waiting for your payment.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Complete payment' })).toHaveAttribute(
      'href',
      '/checkout/payment/01m5qeptz6cjdsae1te3044hvx',
    );
  });

  it('says plainly when a payment failed', async () => {
    const failed = buildOrderSummary({
      status: 'pending_payment',
      paid_at: null,
      payment_status: 'failed',
    });
    installFakeApi({ ...signedIn, 'GET /orders': { body: ordersPage([failed]) } });

    await openOrders();

    expect(await screen.findByText('Your payment did not go through.')).toBeInTheDocument();
  });

  it('does not offer a status filter the API does not have', async () => {
    installFakeApi({ ...signedIn, 'GET /orders': { body: ordersPage([buildOrderSummary()]) } });

    await openOrders();
    await screen.findByText('Order A575-IICOU1LN');

    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('links to the spending report', async () => {
    installFakeApi({ ...signedIn, 'GET /orders': { body: ordersPage([buildOrderSummary()]) } });

    await openOrders();

    expect(await screen.findByRole('link', { name: 'My spending' })).toHaveAttribute(
      'href',
      '/account/spending',
    );
  });
});

describe('Orders list: load more', () => {
  const first = buildOrderSummary({ id: 'order-1', number: 'A575-FIRST001' });
  const second = buildOrderSummary({ id: 'order-2', number: 'A575-SECOND02' });

  it('asks for the next page with the cursor and appends it', async () => {
    const user = userEvent.setup();
    const api = installFakeApi({
      ...signedIn,
      'GET /orders': ({ query }) => ({
        body:
          query.get('cursor') === 'page-2' ? ordersPage([second]) : ordersPage([first], 'page-2'),
      }),
    });

    await openOrders();
    await screen.findByText('Order A575-FIRST001');
    expect(screen.queryByText('Order A575-SECOND02')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Load more' }));

    expect(await screen.findByText('Order A575-SECOND02')).toBeInTheDocument();
    expect(screen.getByText('Order A575-FIRST001')).toBeInTheDocument();
    const orderCalls = api.calls().filter((call) => call.path === '/orders');
    expect(orderCalls.map((call) => call.query.get('cursor'))).toEqual([null, 'page-2']);
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    // The button is gone, so the keyboard lands on the first new order instead of being lost.
    expect(screen.getByRole('link', { name: 'Order A575-SECOND02' })).toHaveFocus();
  });

  it('keeps the loaded orders and offers a retry when the next page fails', async () => {
    const user = userEvent.setup();
    let failNext = true;
    installFakeApi({
      ...signedIn,
      'GET /orders': ({ query }) => {
        if (query.get('cursor') === null) return { body: ordersPage([first], 'page-2') };
        if (failNext) {
          failNext = false;
          return { status: 429, body: { message: 'Slow down' } };
        }
        return { body: ordersPage([second]) };
      },
    });

    await openOrders();
    await user.click(await screen.findByRole('button', { name: 'Load more' }));

    expect(await screen.findByText('We could not load more orders.')).toBeInTheDocument();
    expect(screen.getByText('Order A575-FIRST001')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try loading more again' }));

    expect(await screen.findByText('Order A575-SECOND02')).toBeInTheDocument();
  });
});

describe('Orders list: languages', () => {
  it('reads right to left in Arabic with Latin digits', async () => {
    installFakeApi({ ...signedIn, 'GET /orders': { body: ordersPage([buildOrderSummary()]) } });

    await openOrders('ar');

    expect(await screen.findByRole('heading', { level: 1, name: 'طلباتي' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(screen.getByText('الطلب A575-IICOU1LN')).toBeInTheDocument();
    expect(screen.getByText('تم التأكيد')).toBeInTheDocument();
    expect(screen.getByText(/21\.50\s+ر\.س/)).toBeInTheDocument();
    expect(screen.getByText(/24 أكتوبر 2026/)).toBeInTheDocument();
    expect(screen.queryByText('My orders')).not.toBeInTheDocument();
  });

  it('reads left to right in English', async () => {
    installFakeApi({ ...signedIn, 'GET /orders': { body: ordersPage([]) } });

    await openOrders('en');

    expect(await screen.findByRole('heading', { level: 1, name: 'My orders' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
  });
});
