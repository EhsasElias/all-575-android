import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import type { CartAddition, CartChange } from './cartTypes';
import { guestCartStore } from './guestCartStore';
import { BISCUITS, NOTEBOOK, guestLine, serverLine } from './testData';
import { holdRequests, renderCartPart, serveCart } from './testHarness';
import { useCart } from './useCart';

/** Shows the whole shape `useCart()` offers and lets a test press each action. */
function CartProbe() {
  const cart = useCart();
  const [last, setLast] = useState('none');
  const report = async (pending: Promise<CartChange | CartAddition>) => {
    const result = await pending;
    setLast(result.ok ? 'ok' : result.reason);
  };

  return (
    <div>
      <p>kind: {cart.kind}</p>
      <p>status: {cart.status}</p>
      <p>lines: {cart.lines.map((line) => `${line.variantId}x${line.quantity}`).join(',')}</p>
      <p>items: {cart.itemsCount}</p>
      <p>subtotal: {cart.subtotal}</p>
      <p>last: {last}</p>
      <button type="button" onClick={() => void report(cart.setQuantity(1, 5))}>
        set biscuits to 5
      </button>
      <button type="button" onClick={() => void report(cart.setQuantity(1, 21))}>
        set biscuits to 21
      </button>
      <button type="button" onClick={() => void report(cart.setQuantity(7, 2))}>
        set notebook to 2
      </button>
      <button type="button" onClick={() => void report(cart.remove(1))}>
        remove biscuits
      </button>
      <button type="button" onClick={() => void report(cart.addItem(NOTEBOOK, 2))}>
        add notebook
      </button>
      <button type="button" onClick={() => void report(cart.clear())}>
        clear
      </button>
    </div>
  );
}

const press = async (name: string) => {
  await userEvent.setup().click(screen.getByRole('button', { name }));
};

describe('useCart for a guest', () => {
  it('reads the device cart with prices from the store, in halalas', async () => {
    serveCart();
    guestCartStore.write([guestLine(BISCUITS, 2), guestLine(NOTEBOOK, 1)]);

    await renderCartPart(<CartProbe />);

    expect(await screen.findByText('status: ready')).toBeInTheDocument();
    expect(screen.getByText('kind: guest')).toBeInTheDocument();
    expect(screen.getByText('lines: 1x2,7x1')).toBeInTheDocument();
    expect(screen.getByText('items: 3')).toBeInTheDocument();
    expect(screen.getByText('subtotal: 1725')).toBeInTheDocument();
  });

  it('is ready at once when the cart is empty, because an empty cart needs no price', async () => {
    serveCart();
    holdRequests('GET /store');

    await renderCartPart(<CartProbe />);

    expect(screen.getByText('status: ready')).toBeInTheDocument();
    expect(screen.getByText('items: 0')).toBeInTheDocument();
  });

  it('is loading while lines wait for the price, but the item count is already right', async () => {
    serveCart();
    holdRequests('GET /store');
    guestCartStore.write([guestLine(BISCUITS, 2)]);

    await renderCartPart(<CartProbe />);

    expect(screen.getByText('status: loading')).toBeInTheDocument();
    expect(screen.getByText('items: 2')).toBeInTheDocument();
    expect(screen.getByText('lines:')).toBeInTheDocument();
  });

  it('changes, refuses, removes, adds and clears like the server cart does', async () => {
    serveCart();
    guestCartStore.write([guestLine(BISCUITS, 1)]);
    await renderCartPart(<CartProbe />);
    await screen.findByText('status: ready');

    await press('set biscuits to 5');
    expect(await screen.findByText('last: ok')).toBeInTheDocument();
    expect(screen.getByText('subtotal: 2875')).toBeInTheDocument();

    await press('set biscuits to 21');
    expect(await screen.findByText('last: quantity_out_of_range')).toBeInTheDocument();
    expect(screen.getByText('items: 5')).toBeInTheDocument();

    await press('set notebook to 2');
    expect(await screen.findByText('last: variant_unavailable')).toBeInTheDocument();

    await press('add notebook');
    expect(await screen.findByText('lines: 1x5,7x2')).toBeInTheDocument();

    await press('remove biscuits');
    expect(await screen.findByText('lines: 7x2')).toBeInTheDocument();

    await press('clear');
    expect(await screen.findByText('items: 0')).toBeInTheDocument();
    expect(guestCartStore.getSnapshot()).toEqual([]);
  });
});

describe('useCart when signed in', () => {
  it('reads the server cart in the same shape', async () => {
    serveCart({}, [serverLine(BISCUITS, 2), serverLine(NOTEBOOK, 1)]);

    await renderCartPart(<CartProbe />, { signedIn: true });

    expect(await screen.findByText('kind: server')).toBeInTheDocument();
    expect(await screen.findByText('status: ready')).toBeInTheDocument();
    expect(screen.getByText('lines: 1x2,7x1')).toBeInTheDocument();
    expect(screen.getByText('items: 3')).toBeInTheDocument();
    expect(screen.getByText('subtotal: 1725')).toBeInTheDocument();
  });

  it('is loading, with no lines, until the server answers', async () => {
    serveCart({}, [serverLine(BISCUITS, 2)]);
    holdRequests('GET /cart');

    await renderCartPart(<CartProbe />, { signedIn: true });

    expect(await screen.findByText('kind: server')).toBeInTheDocument();
    expect(screen.getByText('status: loading')).toBeInTheDocument();
    expect(screen.getByText('items: 0')).toBeInTheDocument();
  });

  it('is an error when the cart cannot be loaded', async () => {
    serveCart({ 'GET /cart': { status: 403, body: { message: 'No' } } });

    await renderCartPart(<CartProbe />, { signedIn: true });

    expect(await screen.findByText('status: error')).toBeInTheDocument();
  });

  it('changes, refuses, removes, adds and clears on the server', async () => {
    const { api, cart } = serveCart({}, [serverLine(BISCUITS, 1)]);
    await renderCartPart(<CartProbe />, { signedIn: true });
    await screen.findByText('status: ready');

    await press('set biscuits to 5');
    await waitFor(() => {
      expect(screen.getByText('last: ok')).toBeInTheDocument();
    });
    expect(cart.lines()[0]?.quantity).toBe(5);

    await press('set biscuits to 21');
    await waitFor(() => {
      expect(screen.getByText('last: quantity_out_of_range')).toBeInTheDocument();
    });
    expect(screen.getByText('items: 5')).toBeInTheDocument();

    await press('set notebook to 2');
    await waitFor(() => {
      expect(screen.getByText('last: ok')).toBeInTheDocument();
    });

    await press('remove biscuits');
    await waitFor(() => {
      expect(screen.getByText('lines: 7x2')).toBeInTheDocument();
    });

    await press('clear');
    await waitFor(() => {
      expect(screen.getByText('items: 0')).toBeInTheDocument();
    });
    expect(api.requests()).toContain('DELETE /cart');
    expect(cart.lines()).toEqual([]);
  });

  it('adds a variant that is not in the cart yet, and reports what the line holds', async () => {
    serveCart();
    await renderCartPart(<CartProbe />, { signedIn: true });
    await screen.findByText('status: ready');

    await press('add notebook');

    expect(await screen.findByText('lines: 7x2')).toBeInTheDocument();
    expect(screen.getByText('last: ok')).toBeInTheDocument();
  });
});
