import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { setPreference } from '@/shared/storage';
import { guestCartStore } from './guestCartStore';
import { cartQueryKey } from './queryKeys';
import { BISCUITS, CHOCOLATE, NOTEBOOK, guestLine, serverLine } from './testData';
import { BadgeProbe, holdRequests, renderCartPart, seedGuestCart, serveCart } from './testHarness';

const badge = () => screen.getByLabelText('cart badge');

describe('the cart badge count for a guest', () => {
  it('counts the items on this device without calling the API', async () => {
    const { api } = serveCart();
    guestCartStore.write([guestLine(BISCUITS, 2), guestLine(NOTEBOOK, 3)]);

    await renderCartPart(<BadgeProbe />);

    expect(badge()).toHaveTextContent('5');
    expect(api.requests()).not.toContain('GET /cart');
  });

  it('is 0 for an empty cart', async () => {
    serveCart();

    await renderCartPart(<BadgeProbe />);

    expect(badge()).toHaveTextContent('0');
  });

  it('changes the moment a line is added, changed or removed', async () => {
    serveCart();
    await renderCartPart(<BadgeProbe />);

    seedGuestCart([guestLine(BISCUITS, 1)]);
    expect(badge()).toHaveTextContent('1');

    seedGuestCart([guestLine(BISCUITS, 4), guestLine(CHOCOLATE, 2)]);
    expect(badge()).toHaveTextContent('6');

    seedGuestCart([]);
    expect(badge()).toHaveTextContent('0');
  });

  it('ignores a damaged saved cart', async () => {
    serveCart();
    setPreference(
      'guestCart',
      JSON.stringify({
        version: 1,
        lines: [{ ...guestLine(BISCUITS, 1), quantity: 'many' }, guestLine(CHOCOLATE, 2)],
      }),
    );

    await renderCartPart(<BadgeProbe />);

    expect(badge()).toHaveTextContent('2');
  });
});

describe('the cart badge count when signed in', () => {
  it("shows the server's items_count", async () => {
    serveCart({}, [serverLine(BISCUITS, 4), serverLine(NOTEBOOK, 3)]);

    await renderCartPart(<BadgeProbe />, { signedIn: true });

    await waitFor(() => {
      expect(badge()).toHaveTextContent('7');
    });
  });

  it('is 0 while the count is not known yet, and does not hold anything up', async () => {
    serveCart({}, [serverLine(BISCUITS, 4)]);
    const release = holdRequests('GET /cart');

    await renderCartPart(<BadgeProbe />, { signedIn: true });

    expect(badge()).toHaveTextContent('0');
    release();
    await waitFor(() => {
      expect(badge()).toHaveTextContent('4');
    });
  });

  it('is 0 while the app is still finding out who the customer is, and asks for no cart yet', async () => {
    const { api } = serveCart({}, [serverLine(BISCUITS, 4)]);
    const release = holdRequests('GET /me');
    guestCartStore.write([guestLine(NOTEBOOK, 9)]);

    await renderCartPart(<BadgeProbe />, { signedIn: true });

    expect(badge()).toHaveTextContent('0');
    expect(api.requests()).not.toContain('GET /cart');
    release();
    await waitFor(() => {
      expect(badge()).toHaveTextContent('4');
    });
  });

  it('follows the server, not what is left on the device', async () => {
    serveCart({}, [serverLine(CHOCOLATE, 2)]);
    guestCartStore.write([guestLine(NOTEBOOK, 9)]);

    await renderCartPart(<BadgeProbe />, { signedIn: true });

    await waitFor(() => {
      expect(badge()).toHaveTextContent('2');
    });
  });

  it('updates when another feature invalidates the cart', async () => {
    const { cart } = serveCart({}, [serverLine(BISCUITS, 1)]);
    const { queryClient } = await renderCartPart(<BadgeProbe />, { signedIn: true });
    await waitFor(() => {
      expect(badge()).toHaveTextContent('1');
    });

    // A placed order empties the cart on the server; checkout then invalidates the cart key.
    await fetch('http://localhost/api/v1/cart', { method: 'DELETE' });
    expect(cart.lines()).toHaveLength(0);
    await queryClient.invalidateQueries({ queryKey: cartQueryKey });

    await waitFor(() => {
      expect(badge()).toHaveTextContent('0');
    });
  });
});
