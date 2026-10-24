import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '@/test/render';
import { BISCUITS, CHOCOLATE, NOTEBOOK, serverLine } from './testData';
import { holdRequests, money, serveCart } from './testHarness';

const OPTIONS = { route: '/cart', seenWelcome: true, signedIn: true } as const;

const group = (name: string) => screen.getByRole('group', { name: `Quantity of ${name}` });

describe('the cart screen when signed in', () => {
  it('shows the server cart: lines, totals and the tab badge', async () => {
    const { api } = serveCart({}, [serverLine(BISCUITS, 2), serverLine(NOTEBOOK, 1)]);
    await renderApp(OPTIONS);

    const list = await screen.findByRole('list', { name: 'Items in your cart' });

    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(within(group('Biscuits')).getByText('2')).toBeVisible();
    expect(screen.getByRole('region', { name: 'Order summary' })).toHaveTextContent(money(1725));
    expect(await screen.findByRole('link', { name: 'Cart, Items in cart: 3' })).toBeInTheDocument();
    expect(api.requests()).toContain('GET /cart');
  });

  it('shows an empty cart with a way forward', async () => {
    serveCart();
    await renderApp(OPTIONS);

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Your cart is empty' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse categories' })).toHaveAttribute(
      'href',
      '/categories',
    );
    expect(screen.queryByRole('link', { name: 'Checkout' })).not.toBeInTheDocument();
  });

  it('sets the new quantity on the server when the stepper is used', async () => {
    const user = userEvent.setup();
    const { api, cart } = serveCart({}, [serverLine(BISCUITS, 2)]);
    await renderApp(OPTIONS);

    await user.click(await screen.findByRole('button', { name: 'Increase quantity of Biscuits' }));

    await waitFor(() => {
      expect(cart.lines()[0]?.quantity).toBe(3);
    });
    expect(api.calls().find((call) => call.method === 'PUT')).toMatchObject({
      path: '/cart/items/1',
      body: { quantity: 3 },
    });
    expect(within(group('Biscuits')).getByText('3')).toBeVisible();
    expect(await screen.findByRole('link', { name: 'Cart, Items in cart: 3' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Order summary' })).toHaveTextContent(money(1725));
  });

  it('shows the new quantity at once, before the server has answered', async () => {
    const user = userEvent.setup();
    serveCart({}, [serverLine(BISCUITS, 2)]);
    await renderApp(OPTIONS);
    await screen.findByRole('button', { name: 'Increase quantity of Biscuits' });
    const release = holdRequests('PUT /cart/items/1');

    await user.click(screen.getByRole('button', { name: 'Increase quantity of Biscuits' }));

    expect(within(group('Biscuits')).getByText('3')).toBeVisible();
    expect(screen.getByRole('region', { name: 'Order summary' })).toHaveTextContent(money(1725));
    release();
  });

  it('puts the old quantity back and explains when the server refuses the change', async () => {
    const user = userEvent.setup();
    serveCart(
      {
        'PUT /cart/items/:variant': {
          status: 422,
          body: { message: 'Quantity must be between 0 and 20.', code: 'quantity_out_of_range' },
        },
      },
      [serverLine(BISCUITS, 2)],
    );
    await renderApp(OPTIONS);

    await user.click(await screen.findByRole('button', { name: 'Increase quantity of Biscuits' }));

    expect(await screen.findByText('Choose a quantity from 1 to 20.')).toBeInTheDocument();
    await waitFor(() => {
      expect(within(group('Biscuits')).getByText('2')).toBeVisible();
    });
    expect(screen.getByRole('region', { name: 'Order summary' })).toHaveTextContent(money(1150));
  });

  it('keeps fast taps in order, so the server ends with the last quantity', async () => {
    const user = userEvent.setup();
    const { api, cart } = serveCart({}, [serverLine(BISCUITS, 2)]);
    await renderApp(OPTIONS);
    const plus = await screen.findByRole('button', { name: 'Increase quantity of Biscuits' });

    await user.click(plus);
    await user.click(plus);
    await user.click(plus);

    await waitFor(() => {
      expect(cart.lines()[0]?.quantity).toBe(5);
    });
    const sent = api
      .calls()
      .filter((call) => call.method === 'PUT')
      .map((call) => call.body);
    expect(sent).toEqual([{ quantity: 3 }, { quantity: 4 }, { quantity: 5 }]);
    await waitFor(() => {
      expect(within(group('Biscuits')).getByText('5')).toBeVisible();
    });
  });

  it('removes a line with quantity 0 and says so', async () => {
    const user = userEvent.setup();
    const { api, cart } = serveCart({}, [serverLine(BISCUITS, 2), serverLine(NOTEBOOK, 1)]);
    await renderApp(OPTIONS);

    await user.click(await screen.findByRole('button', { name: 'Remove Biscuits from the cart' }));

    expect(await screen.findByText('Biscuits was removed from your cart.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Biscuits' })).not.toBeInTheDocument();
    expect(api.calls().find((call) => call.method === 'PUT')?.body).toEqual({ quantity: 0 });
    expect(cart.lines().map((line) => line.variant_id)).toEqual([7]);
    expect(screen.getByRole('heading', { level: 1, name: 'Cart' })).toHaveFocus();
  });

  it('goes to checkout from the Checkout button', async () => {
    const user = userEvent.setup();
    serveCart({}, [serverLine(BISCUITS, 1)]);
    const { router } = await renderApp(OPTIONS);

    await user.click(await screen.findByRole('link', { name: 'Checkout' }));

    expect(router.state.location.pathname).toBe('/checkout');
  });

  it('does not show the guest note', async () => {
    serveCart({}, [serverLine(BISCUITS, 1)]);
    await renderApp(OPTIONS);

    await screen.findByRole('link', { name: 'Checkout' });
    expect(screen.queryByText(/Availability is checked at checkout/)).not.toBeInTheDocument();
  });
});

describe('lines that cannot be bought', () => {
  const address = { id: 5, is_default: true, serviceable: true, service_zone_id: 1 };

  /** The customer has a default address, and the server says which variants it cannot deliver there. */
  function serveWithStockAt(outOfStock: number[]) {
    return serveCart(
      { 'GET /addresses': { body: { data: [address] } } },
      [serverLine(BISCUITS, 2), serverLine(CHOCOLATE, 1), serverLine(NOTEBOOK, 1)],
      (variantId, addressId) => {
        if (addressId !== address.id) return 'unknown';
        return outOfStock.includes(variantId) ? 'out_of_stock' : 'in_stock';
      },
    );
  }

  it('flags a line that is out of stock at the delivery address, and keeps it in the list', async () => {
    serveWithStockAt([CHOCOLATE.variantId]);
    await renderApp(OPTIONS);

    expect(await screen.findByText('Out of stock for your delivery address.')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Chocolate' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Quantity of Chocolate' })).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove Chocolate from the cart' }),
    ).toHaveTextContent('Remove');
    expect(screen.getByText(/Some items are unavailable\./)).toBeInTheDocument();
  });

  it('leaves the flagged line out of the items and subtotal', async () => {
    serveWithStockAt([CHOCOLATE.variantId]);
    await renderApp(OPTIONS);
    await screen.findByText('Out of stock for your delivery address.');

    const summary = screen.getByRole('region', { name: 'Order summary' });
    expect(summary).toHaveTextContent('Items3');
    expect(summary).toHaveTextContent(`Subtotal${money(1725)}`);
  });

  it('removes a flagged line with the Remove shortcut', async () => {
    const user = userEvent.setup();
    const { api } = serveWithStockAt([CHOCOLATE.variantId]);
    await renderApp(OPTIONS);
    // The shortcut is a different button from the plain trash icon, so wait until the line is flagged.
    await screen.findByText('Out of stock for your delivery address.');

    await user.click(screen.getByRole('button', { name: 'Remove Chocolate from the cart' }));

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'Chocolate' })).not.toBeInTheDocument();
    });
    const put = api.calls().find((call) => call.method === 'PUT');
    expect(put).toMatchObject({ path: '/cart/items/2', body: { quantity: 0 } });
  });

  it('disables Checkout when nothing in the cart can be bought', async () => {
    serveWithStockAt([1, 2, 7]);
    await renderApp(OPTIONS);
    await screen.findAllByText('Out of stock for your delivery address.');

    expect(screen.getByRole('button', { name: 'Checkout' })).toBeDisabled();
    expect(screen.queryByRole('link', { name: 'Checkout' })).not.toBeInTheDocument();
  });

  it('flags nothing, and still works, when the customer has no address yet', async () => {
    serveCart({ 'GET /addresses': { body: { data: [] } } }, [serverLine(CHOCOLATE, 1)]);
    await renderApp(OPTIONS);

    expect(await screen.findByRole('link', { name: 'Chocolate' })).toBeInTheDocument();
    expect(screen.queryByText('Out of stock for your delivery address.')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Checkout' })).toBeInTheDocument();
  });

  it('flags a line the server says is no longer sold, instead of dropping it', async () => {
    const user = userEvent.setup();
    serveCart(
      {
        'PUT /cart/items/:variant': ({ body }) =>
          typeof body === 'object' && body !== null && 'quantity' in body && body.quantity === 0
            ? { body: { data: { lines: [], items_count: 0, subtotal: 0, currency: 'SAR' } } }
            : {
                status: 404,
                body: { message: 'This product is not available.', code: 'variant_unavailable' },
              },
      },
      [serverLine(BISCUITS, 2)],
    );
    await renderApp(OPTIONS);

    await user.click(await screen.findByRole('button', { name: 'Increase quantity of Biscuits' }));

    expect(await screen.findByText('This item is no longer available.')).toBeInTheDocument();
    expect(await screen.findByText('This item is not available right now.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Biscuits' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Quantity of Biscuits' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove Biscuits from the cart' }));
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'Biscuits' })).not.toBeInTheDocument();
    });
  });
});
