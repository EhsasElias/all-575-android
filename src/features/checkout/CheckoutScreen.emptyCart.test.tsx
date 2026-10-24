import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { refusal } from './checkoutActions';
import { renderCheckout } from './checkoutHarness';
import { quote } from './testData';

const RECHECK_WAIT = { timeout: 4000 };

describe('Checkout with an empty cart', () => {
  it('asks once more before it says there is nothing to check out, then shows the empty state with a way to the cart', async () => {
    const { api } = await renderCheckout({
      routes: { 'POST /quotes': refusal(422, 'cart_empty') },
    });

    expect(
      await screen.findByRole(
        'heading',
        { level: 1, name: 'Nothing to check out yet' },
        RECHECK_WAIT,
      ),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Go to cart' })).toHaveAttribute('href', '/cart');
    // One automatic re-check: the cart may still have been being merged after sign-in.
    expect(api.requests().filter((request) => request === 'POST /quotes')).toHaveLength(2);
  });

  it('shows the checkout, not the empty state, when the cart fills up between the two asks (sign-in merge)', async () => {
    let asked = 0;
    await renderCheckout({
      routes: {
        'POST /quotes': () => {
          asked += 1;
          return asked === 1
            ? refusal(422, 'cart_empty')
            : { status: 201, body: { data: quote() } };
        },
      },
    });

    expect(
      await screen.findByRole('button', { name: /^Pay 21\.50/ }, RECHECK_WAIT),
    ).toBeInTheDocument();
    expect(screen.queryByText('Nothing to check out yet')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Order summary' })).toBeVisible();
  });

  it('shows the empty state in Arabic too', async () => {
    await renderCheckout({
      language: 'ar',
      routes: { 'POST /quotes': refusal(422, 'cart_empty') },
    });

    expect(
      await screen.findByRole(
        'heading',
        { level: 1, name: 'لا يوجد ما تدفع ثمنه بعد' },
        RECHECK_WAIT,
      ),
    ).toBeVisible();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });
});
