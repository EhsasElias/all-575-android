import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { chooseFirstSlot, refusal } from './checkoutActions';
import { renderCheckout } from './checkoutHarness';
import { quote } from './testData';

afterEach(() => {
  vi.useRealTimers();
});

const SAVE10 = quote({
  discount: 115,
  total: 2035,
  vat_included: 265,
  promo_code: 'SAVE10',
});

/** Answers a quote request by its promo code: SAVE10 works, anything else is refused with the given reply. */
type Reply = { status: number; body: unknown; headers?: Record<string, string> };

function quotesWithPromo(otherwise: Reply) {
  return ({ body }: { body: unknown }) => {
    const promo =
      typeof body === 'object' && body !== null && 'promo_code' in body ? body.promo_code : null;
    if (promo === null || promo === undefined) return { status: 201, body: { data: quote() } };
    return promo === 'SAVE10' ? { status: 201, body: { data: SAVE10 } } : otherwise;
  };
}

describe('Checkout: promo code', () => {
  it('prices the order with a valid code, shows the discount, and goes back when it is removed', async () => {
    const user = userEvent.setup();
    const { api } = await renderCheckout({
      routes: { 'POST /quotes': quotesWithPromo(refusal(422, 'promo_invalid')) },
    });
    await screen.findByRole('button', { name: /^Pay 21\.50/ });

    await user.type(screen.getByLabelText('Promo code'), ' save10 ');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(await screen.findByText('Promo code SAVE10 applied')).toBeVisible();
    const summary = screen.getByRole('region', { name: 'Order summary' });
    expect(within(summary).getByText('Discount (SAVE10)')).toBeVisible();
    expect(within(summary).getByText(/^−1\.15\s+SAR$/)).toBeVisible();
    expect(await screen.findByRole('button', { name: /^Pay 20\.35/ })).toBeInTheDocument();
    expect(
      api
        .calls()
        .filter((call) => call.path === '/quotes')
        .map((call) => call.body),
    ).toContainEqual({
      address_id: 1,
      promo_code: 'SAVE10',
    });

    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(await screen.findByRole('button', { name: /^Pay 21\.50/ })).toBeInTheDocument();
    expect(screen.queryByText('Promo code SAVE10 applied')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Promo code')).toHaveValue('');
  });

  it.each([
    ['promo_invalid', 'This promo code is not valid.'],
    ['promo_not_started', 'This promo code is not active yet.'],
    ['promo_expired', 'This promo code has expired.'],
    ['promo_min_subtotal', /Your order must be at least 50\.00\s+SAR to use this code\./],
    ['promo_used_up', 'This promo code has been fully used.'],
    ['promo_already_used', 'You have already used this promo code.'],
  ])('%s: says so next to the field and keeps the current prices', async (code, message) => {
    const user = userEvent.setup();
    await renderCheckout({
      routes: {
        'POST /quotes': quotesWithPromo(refusal(422, code, { min_subtotal: 5000 })),
      },
    });
    await screen.findByRole('button', { name: /^Pay 21\.50/ });

    await user.type(screen.getByLabelText('Promo code'), 'NOPE');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    const field = await screen.findByLabelText('Promo code');
    await waitFor(() => {
      expect(field).toHaveAccessibleDescription(message);
    });
    expect(screen.queryByText(/Server wording/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Pay 21\.50/ })).toBeInTheDocument();

    // Typing again clears the message.
    await user.type(field, 'X');
    expect(field).toHaveAccessibleDescription('');
  });

  it('asks to wait when there were too many attempts', async () => {
    const user = userEvent.setup();
    await renderCheckout({
      routes: {
        'POST /quotes': quotesWithPromo({
          status: 429,
          body: { message: 'Too Many Attempts.' },
          headers: { 'Retry-After': '30' },
        }),
      },
    });
    await screen.findByRole('button', { name: /^Pay 21\.50/ });

    await user.type(screen.getByLabelText('Promo code'), 'NOPE');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(
      await screen.findByText('Too many attempts. Wait a moment and try again.'),
    ).toBeVisible();
  });
});

describe('Checkout: items that cannot be delivered', () => {
  const unavailable = quote({
    lines: [{ ...quote().lines[0], available: false, available_units: 0 }],
    issues: [{ variant_id: 1, code: 'unavailable', available_units: 0 }],
    delivery_fee: 0,
    total: 1150,
    can_checkout: false,
  });

  it('flags the line, sends the customer back to the cart, and keeps the pay button off', async () => {
    const user = userEvent.setup();
    await renderCheckout({
      routes: { 'POST /quotes': () => ({ status: 201, body: { data: unavailable } }) },
    });

    const summary = await screen.findByRole('region', { name: 'Order summary' });
    expect(await within(summary).findByText('No longer available')).toBeVisible();
    expect(within(summary).getByRole('link', { name: 'Update your cart' })).toHaveAttribute(
      'href',
      '/cart',
    );
    // The delivery fee is not claimed to be free while the cart is broken.
    expect(within(summary).getByText('Shown once your cart is fixed')).toBeVisible();
    expect(within(summary).queryByText('Free')).not.toBeInTheDocument();

    await chooseFirstSlot(user);
    const pay = screen.getByRole('button', { name: /^Pay/ });
    expect(pay).toBeDisabled();
    expect(pay).toHaveAccessibleDescription(
      'Update your cart to continue: some items are not available.',
    );
  });

  it('says how many are left when there is not enough stock', async () => {
    await renderCheckout({
      routes: {
        'POST /quotes': () => ({
          status: 201,
          body: {
            data: quote({
              lines: [{ ...quote().lines[0], available: false, available_units: 1 }],
              issues: [{ variant_id: 1, code: 'insufficient_stock', available_units: 1 }],
              can_checkout: false,
            }),
          },
        }),
      },
    });

    expect(await screen.findByText('Only 1 in stock')).toBeVisible();
  });
});

describe('Checkout: how long the prices hold', () => {
  it('tells when the prices expire, and stops the payment until they are refreshed', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    let requests = 0;
    const { api } = await renderCheckout({
      routes: {
        'POST /quotes': () => {
          requests += 1;
          const lifetime = requests === 1 ? 3000 : 600_000;
          return {
            status: 201,
            body: { data: quote({ expires_at: new Date(Date.now() + lifetime).toISOString() }) },
          };
        },
      },
    });
    expect(await screen.findByText(/Prices are held until \d{1,2}:\d\d (AM|PM)/)).toBeVisible();
    await chooseFirstSlot(user);
    expect(screen.getByRole('button', { name: /^Pay/ })).toBeEnabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });

    expect(screen.getByText('These prices have expired.')).toBeVisible();
    expect(screen.getByRole('button', { name: /^Pay/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^Pay/ })).toHaveAccessibleDescription(
      'Refresh the prices to continue.',
    );

    await user.click(screen.getByRole('button', { name: 'Refresh prices' }));

    await waitFor(() => {
      expect(screen.queryByText('These prices have expired.')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /^Pay/ })).toBeEnabled();
    expect(api.requests().filter((request) => request === 'POST /quotes')).toHaveLength(2);
  });
});
