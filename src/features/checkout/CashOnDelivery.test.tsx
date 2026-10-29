import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderCheckout } from './checkoutHarness';
import { order, payment, ORDER_ID, TOTAL_TEXT } from './testData';

describe('Cash on delivery', () => {
  it('shows real brand artwork and places an unpaid cash order directly into order details', async () => {
    const cash = payment({ method: 'cash_on_delivery', status: 'pending', action: null });
    const confirmed = order({ status: 'confirmed', paid_at: null, payments: [cash] });
    const user = userEvent.setup();
    const { api, router } = await renderCheckout({
      routes: {
        'POST /checkout': {
          status: 201,
          body: { data: { order: confirmed, payment: cash, replayed: false } },
        },
        [`GET /orders/${ORDER_ID}`]: { body: { data: confirmed } },
      },
    });
    expect(screen.getByRole('img', { name: 'mada' })).toHaveAttribute(
      'src',
      '/images/payments/mada.svg',
    );
    expect(screen.getByRole('img', { name: 'Visa' })).toHaveAttribute(
      'src',
      '/images/payments/visa.svg',
    );
    expect(screen.getByRole('img', { name: 'Mastercard' })).toHaveAttribute(
      'src',
      '/images/payments/master.svg',
    );
    const sunday = await screen.findByRole('group', { name: 'Sunday, October 25' });
    await user.click(within(sunday).getByRole('radio', { name: '9:00 AM – 11:00 AM' }));
    await user.click(screen.getByRole('radio', { name: 'Cash on delivery' }));
    expect(screen.getByText('Pay in cash on delivery. No online payment is taken.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: `Place order · ${TOTAL_TEXT}` }));
    await screen.findByRole('heading', { level: 1, name: /A575/ });
    expect(router.state.location.pathname).toBe(`/orders/${ORDER_ID}`);
    expect(api.calls().find((c) => c.path === '/checkout')?.body).toMatchObject({
      payment_method: 'cash_on_delivery',
    });
    expect(
      screen.queryByRole('heading', { name: 'Complete your payment' }),
    ).not.toBeInTheDocument();
  });
});
