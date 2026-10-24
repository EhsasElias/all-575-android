import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { testUser } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { ORDER_ID, buildOrderDetail, buildRefund } from '../testData';
import { cancelledOrder, deliveredOrder } from '../testScenarios';
import { holdRequests, orderRoutes } from '../testHelpers';
import type { OrderDetail } from '../types';

const signedIn = { 'GET /me': { body: { data: testUser } } };

function openOrder(order: OrderDetail, language: 'en' | 'ar' = 'en') {
  installFakeApi({ ...signedIn, ...orderRoutes(order) });
  return renderApp({ route: `/orders/${ORDER_ID}`, signedIn: true, seenWelcome: true, language });
}

describe('Order detail: refunds are done only when the provider says so', () => {
  it('shows a pending refund as in progress, not as refunded', async () => {
    await openOrder(cancelledOrder([buildRefund({ status: 'pending' })]));

    const refunds = within(await screen.findByRole('region', { name: 'Payment and refunds' }));
    expect(refunds.getByText('In progress')).toBeInTheDocument();
    expect(refunds.queryByText('Refunded')).not.toBeInTheDocument();
    expect(refunds.getByText(/Waiting for your payment provider to confirm/)).toBeInTheDocument();
    expect(refunds.getByText('Refund for the order you cancelled')).toBeInTheDocument();
    expect(screen.getByText('Refund date').nextElementSibling).toHaveTextContent(
      'In progress, requested 24 Oct 2026, 9:00 pm',
    );
    expect(screen.getByText(/You cancelled this order\./)).toBeInTheDocument();
  });

  it('shows a succeeded refund as refunded with its dates and credit note', async () => {
    const refund = buildRefund({
      status: 'succeeded',
      completed_at: '2026-10-27T09:00:00.000000Z',
      credit_note_number: 'CN-2026-000001',
    });
    await openOrder(cancelledOrder([refund]));

    const refunds = within(await screen.findByRole('region', { name: 'Payment and refunds' }));
    expect(refunds.getByText('Refunded')).toBeInTheDocument();
    expect(refunds.getByText('Confirmed by your payment provider.')).toBeInTheDocument();
    expect(refunds.getByText('Refunded on 27 Oct 2026, 12:00 pm')).toBeInTheDocument();
    expect(refunds.getByText('Credit note CN-2026-000001')).toBeInTheDocument();
  });

  it('shows a failed refund honestly', async () => {
    await openOrder(
      cancelledOrder([
        buildRefund({ status: 'failed', completed_at: '2026-10-27T09:00:00.000000Z' }),
      ]),
    );

    const refunds = within(await screen.findByRole('region', { name: 'Payment and refunds' }));
    expect(refunds.getByText('Failed')).toBeInTheDocument();
    expect(
      refunds.getByText('The refund could not be completed. Contact support.'),
    ).toBeInTheDocument();
  });
});
describe('Order detail: loading, missing and failing', () => {
  it('shows a placeholder while the order loads', async () => {
    installFakeApi({ ...signedIn, ...orderRoutes(buildOrderDetail()) });
    const gate = holdRequests(`/orders/${ORDER_ID}`);

    await renderApp({ route: `/orders/${ORDER_ID}`, signedIn: true, seenWelcome: true });

    expect(await screen.findByRole('status', { name: 'Loading' })).toBeInTheDocument();
    gate.release();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Order A575-IICOU1LN' }),
    ).toBeInTheDocument();
  });

  it("shows a not-found page for someone else's order, without any detail", async () => {
    installFakeApi({
      ...signedIn,
      'GET /orders/:id': { status: 404, body: { message: 'No query results for model [Order].' } },
    });

    await renderApp({ route: '/orders/someone-elses-order', signedIn: true, seenWelcome: true });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'We could not find this order' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to my orders' })).toHaveAttribute(
      'href',
      '/orders',
    );
    expect(screen.queryByText(/No query results/)).not.toBeInTheDocument();
  });

  it('shows an error with a retry when the order cannot be loaded', async () => {
    const user = userEvent.setup();
    let attempts = 0;
    installFakeApi({
      ...signedIn,
      'GET /orders/:id': () => {
        attempts += 1;
        return attempts === 1
          ? { status: 429, body: { message: 'Slow down' } }
          : { body: { data: buildOrderDetail() } };
      },
    });
    await renderApp({ route: `/orders/${ORDER_ID}`, signedIn: true, seenWelcome: true });

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('We could not load this order')).toBeInTheDocument();
    await user.click(within(alert).getByRole('button', { name: 'Try again' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Order A575-IICOU1LN' }),
    ).toBeInTheDocument();
  });
});
describe('Order detail: languages', () => {
  it('reads right to left in Arabic, with the seller and items in Arabic', async () => {
    await openOrder(deliveredOrder(), 'ar');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'الطلب A575-IICOU1LN' }),
    ).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(screen.getByRole('article', { name: 'من متجر التوفير' })).toBeInTheDocument();
    expect(screen.getByText('فرشاة تنظيف')).toBeInTheDocument();
    expect(screen.getByText('تاريخ الدفع').nextElementSibling).toHaveTextContent(
      /24 أكتوبر 2026، 8:20 م/,
    );
    expect(screen.getByText('ضريبة القيمة المضافة المضمّنة')).toBeInTheDocument();
    expect(screen.queryByText('Cleaning Brush')).not.toBeInTheDocument();
  });

  it('reads left to right in English', async () => {
    await openOrder(buildOrderDetail());

    await screen.findByRole('heading', { level: 1, name: 'Order A575-IICOU1LN' });
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
  });
});
