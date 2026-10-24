import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { chooseFirstSlot, payNow, refusal } from './checkoutActions';
import { renderCheckout } from './checkoutHarness';
import { createShop } from './shopServer';
import { order, payment, quote } from './testData';

const checkoutCalls = (api: { requests: () => string[] }) =>
  api.requests().filter((request) => request === 'POST /checkout');

describe('Checkout: when the server refuses', () => {
  it('shows the new prices after quote_changed, asks to confirm again and never retries by itself', async () => {
    const user = userEvent.setup();
    const changed = quote({
      id: '01m5qepms76n93z1rjvvwzb2gk',
      delivery_fee: 1100,
      total: 2250,
      vat_included: 293,
    });
    let attempt = 0;
    const { routes } = createShop();
    const { api } = await renderCheckout({
      routes: {
        ...routes,
        'POST /checkout': () => {
          attempt += 1;
          return attempt === 1
            ? refusal(409, 'quote_changed', { quote: changed })
            : {
                status: 201,
                body: { data: { order: order(), payment: payment(), replayed: false } },
              };
        },
      },
    });

    await chooseFirstSlot(user);
    await payNow(user);

    const [notice] = await screen.findAllByRole('alert');
    expect(notice).toHaveTextContent(/The total changed from 21\.50\s+SAR to 22\.50\s+SAR/);
    expect(await screen.findByRole('button', { name: /^Pay 22\.50/ })).toBeEnabled();
    expect(screen.getByText('The price or availability changed')).toBeVisible();
    expect(screen.queryByText(/Server wording/)).not.toBeInTheDocument();
    // Not retried silently: the customer has to confirm the new total.
    expect(checkoutCalls(api)).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /^Pay 22\.50/ }));
    await screen.findByRole('heading', { level: 1, name: 'Complete your payment' });
    const bodies = api
      .calls()
      .filter((call) => call.path === '/checkout')
      .map((call) => call.body);
    expect(bodies[1]).toMatchObject({ quote_id: '01m5qepms76n93z1rjvvwzb2gk' });
  });

  it('asks for a fresh quote when quote_changed carries no usable one', async () => {
    const user = userEvent.setup();
    const { api } = await renderCheckout({
      routes: { 'POST /checkout': refusal(409, 'quote_changed', { quote: { id: 'nope' } }) },
    });

    await chooseFirstSlot(user);
    await payNow(user);

    expect(await screen.findByText('Your prices expired')).toBeVisible();
    await screen.findByRole('button', { name: /^Pay/ });
    expect(
      api.requests().filter((request) => request === 'POST /quotes').length,
    ).toBeGreaterThanOrEqual(2);
  });

  it.each([
    ['quote_expired', 422, 'Your prices expired', 'quote'],
    ['quote_not_found', 404, 'We could not find this price offer', 'quote'],
    ['cart_has_unavailable_items', 409, 'Some items are no longer available', 'quote'],
    ['out_of_stock', 409, 'An item just sold out', 'quote'],
    ['slot_full', 409, 'That delivery time just filled up', 'slots'],
    ['slot_too_soon', 409, 'That delivery time is too soon', 'slots'],
    ['slot_invalid', 422, 'Choose your delivery time again', 'slots'],
    ['payments_unavailable', 503, 'Online payment is not available right now', 'none'],
    ['payment_provider_error', 502, 'The payment service is not responding', 'none'],
    ['address_not_serviceable', 422, 'We do not deliver to this address', 'none'],
    ['address_missing', 422, 'This address no longer exists', 'addresses'],
    ['cart_empty', 422, 'Your cart is empty', 'none'],
    ['idempotency_key_reused', 422, 'Something went wrong with this attempt', 'none'],
    ['checkout_conflict', 409, 'We are finishing your last attempt', 'none'],
  ])(
    '%s: its own message in our words, and the next step',
    async (code, status, title, reloads) => {
      const user = userEvent.setup();
      const { api } = await renderCheckout({ routes: { 'POST /checkout': refusal(status, code) } });
      await chooseFirstSlot(user);
      const before = {
        quote: api.requests().filter((request) => request === 'POST /quotes').length,
        slots: api.requests().filter((request) => request === 'GET /delivery/slots').length,
        addresses: api.requests().filter((request) => request === 'GET /addresses').length,
      };

      await payNow(user);

      expect(await screen.findByText(title)).toBeVisible();
      expect(screen.queryByText(/Server wording/)).not.toBeInTheDocument();
      expect(checkoutCalls(api)).toHaveLength(1);
      const count = (request: string) =>
        api.requests().filter((candidate) => candidate === request).length;
      if (reloads === 'quote')
        await waitFor(() => {
          expect(count('POST /quotes')).toBeGreaterThan(before.quote);
        });
      if (reloads === 'slots') {
        await waitFor(() => {
          expect(count('GET /delivery/slots')).toBeGreaterThan(before.slots);
        });
        // The time the customer chose is no longer chosen.
        expect(
          screen.queryByRole('radio', { name: '9:00 AM – 11:00 AM', checked: true }),
        ).not.toBeInTheDocument();
      }
      if (reloads === 'addresses') {
        await waitFor(() => {
          expect(count('GET /addresses')).toBeGreaterThan(before.addresses);
        });
      }
    },
  );

  it.each([
    ['cart_has_unavailable_items', 'Back to cart', '/cart'],
    ['out_of_stock', 'Back to cart', '/cart'],
    ['address_not_serviceable', 'Edit the pin', '/account/addresses/1'],
    ['address_not_serviceable', 'Choose another address', '/account/addresses'],
  ])('%s offers the link "%s"', async (code, label, href) => {
    const user = userEvent.setup();
    await renderCheckout({ routes: { 'POST /checkout': refusal(409, code) } });
    await chooseFirstSlot(user);

    await payNow(user);

    const links = await screen.findAllByRole('link', { name: label });
    expect(links.some((link) => link.getAttribute('href') === href)).toBe(true);
  });

  it('tells the customer nothing was charged and that retrying cannot double-order when the answer is lost', async () => {
    const user = userEvent.setup();
    await renderCheckout({ routes: { 'POST /checkout': 'offline' } });
    await chooseFirstSlot(user);

    await payNow(user);

    expect(await screen.findByText('We did not hear back')).toBeVisible();
    expect(screen.getByText(/it will not be placed twice/)).toBeVisible();
    expect(screen.getByRole('button', { name: /^Pay/ })).toBeEnabled();
  });

  it('sends a customer with nothing to pay straight to the order', async () => {
    const user = userEvent.setup();
    const { routes } = createShop();
    const { router } = await renderCheckout({
      routes: {
        ...routes,
        'POST /checkout': () => ({
          status: 201,
          body: {
            data: {
              order: { id: 'free-order', status: 'confirmed' },
              payment: null,
              replayed: false,
            },
          },
        }),
      },
    });

    await chooseFirstSlot(user);
    await payNow(user);

    await screen.findByRole('main');
    expect(router.state.location.pathname).toBe('/orders/free-order');
  });
});
