import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderCheckout } from './checkoutHarness';
import { createShop } from './shopServer';
import { ORDER_ID, TOTAL_TEXT, payment } from './testData';

async function chooseSlotAndPay(user: ReturnType<typeof userEvent.setup>) {
  const sunday = await screen.findByRole('group', { name: 'Sunday, October 25' });
  await user.click(within(sunday).getByRole('radio', { name: '9:00 AM – 11:00 AM' }));
  await user.click(screen.getByRole('button', { name: `Pay ${TOTAL_TEXT}` }));
}

describe('Checkout: paying', () => {
  it('goes from the summary to the payment, polls the server, and opens the order once the server says paid', async () => {
    const user = userEvent.setup();
    const { shop, routes } = createShop(
      payment({ action: { redirect_url: null, client_secret: 'fake_secret' } }),
    );
    const { api, router } = await renderCheckout({ routes });

    await chooseSlotAndPay(user);

    // The unpaid order and its payment: waiting for the bank.
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Complete your payment' }),
    ).toBeVisible();
    expect(router.state.location.pathname).toBe(`/checkout/payment/${ORDER_ID}`);
    expect(screen.getByText('Waiting for the bank to confirm your payment')).toBeVisible();
    expect(screen.getByRole('timer')).toHaveTextContent(/^1[45]:\d\d$/);

    const post = api.calls().find((call) => call.path === '/checkout');
    expect(post?.body).toEqual({
      quote_id: '01m5qepms76n93z1rjvvwzb2gj',
      slot_id: 8,
      payment_method: 'mada',
    });
    expect(post?.headers.get('Idempotency-Key')).toMatch(/^[0-9a-f-]{36}$/);
    expect(shop.checkoutKeys).toHaveLength(1);

    // Coming back proves nothing: the screen stays until the server's status changes.
    expect(api.requests()).toContain(`GET /payments/${shop.payments[0]?.id}`);
    expect(router.state.location.pathname).toBe(`/checkout/payment/${ORDER_ID}`);

    // The dev panel plays the provider; the next answer of the server says paid.
    const cartRequestsBefore = api.requests().filter((request) => request === 'GET /cart').length;
    await user.click(await screen.findByRole('button', { name: 'Simulate success' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/orders/${ORDER_ID}`);
    });
    // The server cleared the cart on payment, so the cart is fetched again.
    await waitFor(() => {
      expect(api.requests().filter((request) => request === 'GET /cart').length).toBeGreaterThan(
        cartRequestsBefore,
      );
    });
  });

  it.each([
    [
      'a secure address',
      'https://pay.example.test/session/abc',
      'https://pay.example.test/session/abc',
    ],
    ['an address that is not secure', 'http://pay.example.test/session/abc', null],
    ['a script', 'javascript:alert(1)', null],
  ])('offers the provider’s page only for %s', async (_label, redirectUrl, opened) => {
    const user = userEvent.setup();
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const { routes } = createShop(
      payment({ action: { redirect_url: redirectUrl, client_secret: null } }),
    );
    await renderCheckout({ routes });

    await chooseSlotAndPay(user);
    await screen.findByRole('heading', { level: 1, name: 'Complete your payment' });

    if (opened === null) {
      expect(screen.queryByRole('button', { name: 'Continue to payment' })).not.toBeInTheDocument();
      return;
    }
    await user.click(screen.getByRole('button', { name: 'Continue to payment' }));
    expect(open).toHaveBeenCalledWith(opened, '_blank', 'noopener,noreferrer');
    // Opening the page proves nothing: the screen still waits for the server.
    expect(screen.getByText('Waiting for the bank to confirm your payment')).toBeVisible();
  });
});
