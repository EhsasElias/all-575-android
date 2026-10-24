import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { getPreference } from '@/shared/storage';
import { AddToCart } from './AddToCart';
import { BISCUITS, productResource, serverLine, variantResource } from './testData';
import { BadgeProbe, renderCartPart, serveCart } from './testHarness';

const product = productResource();
const variant = variantResource();

async function renderAddToCart() {
  return renderCartPart(
    <>
      <AddToCart product={product} variant={variant} />
      <BadgeProbe />
    </>,
    { signedIn: true, routes: [{ path: '/cart', element: <p>The cart page</p> }] },
  );
}

const addButton = () => screen.getByRole('button', { name: 'Add to cart' });
const badge = () => screen.getByLabelText('cart badge');

/** The server cart is only read once the session knows the customer is signed in. */
async function waitForSignedIn(api: ReturnType<typeof serveCart>['api']) {
  await waitFor(() => {
    expect(api.requests()).toContain('GET /cart');
  });
}

describe('AddToCart when signed in', () => {
  it('sets the quantity on the server cart and updates the badge', async () => {
    const user = userEvent.setup();
    const { api } = serveCart();
    await renderAddToCart();
    await waitForSignedIn(api);

    await user.click(screen.getByRole('button', { name: 'Increase quantity of Biscuits' }));
    await user.click(addButton());

    await waitFor(() => {
      expect(badge()).toHaveTextContent('2');
    });
    const put = api.calls().find((call) => call.method === 'PUT');
    expect(put).toMatchObject({ path: '/cart/items/1', body: { quantity: 2 } });
    expect(getPreference('guestCart')).toBeNull();
    expect(
      await screen.findByText('Added to your cart: Biscuits. Quantity in cart: 2.'),
    ).toBeInTheDocument();
  });

  it('reads the cart again first and adds to what is there', async () => {
    const user = userEvent.setup();
    const { api } = serveCart({}, [serverLine(BISCUITS, 3)]);
    await renderAddToCart();
    await waitForSignedIn(api);
    const readsBefore = api.requests().filter((request) => request === 'GET /cart').length;

    await user.click(addButton());

    await waitFor(() => {
      expect(badge()).toHaveTextContent('4');
    });
    expect(api.requests().filter((request) => request === 'GET /cart').length).toBe(
      readsBefore + 1,
    );
    expect(api.calls().find((call) => call.method === 'PUT')?.body).toEqual({ quantity: 4 });
  });

  it('caps at 20 on the server cart too, and says so', async () => {
    const user = userEvent.setup();
    const { api } = serveCart({}, [serverLine(BISCUITS, 19)]);
    await renderAddToCart();
    await waitForSignedIn(api);

    await user.click(screen.getByRole('button', { name: 'Increase quantity of Biscuits' }));
    await user.click(addButton());

    expect(
      await screen.findByText(
        'The most you can order of one item is 20. Biscuits is now at 20 in your cart.',
      ),
    ).toBeInTheDocument();
    expect(api.calls().find((call) => call.method === 'PUT')?.body).toEqual({ quantity: 20 });
  });

  it('does not send anything when the line is already at 20', async () => {
    const user = userEvent.setup();
    const { api } = serveCart({}, [serverLine(BISCUITS, 20)]);
    await renderAddToCart();
    await waitForSignedIn(api);

    await user.click(addButton());

    expect(await screen.findByText(/is now at 20 in your cart/)).toBeInTheDocument();
    expect(api.requests().filter((request) => request.startsWith('PUT'))).toEqual([]);
  });

  it('cannot add twice by pressing the button twice while the first press is still working', async () => {
    const { api } = serveCart();
    await renderAddToCart();
    await waitForSignedIn(api);

    fireEvent.click(addButton());
    fireEvent.click(addButton());
    expect(addButton()).toHaveAttribute('aria-busy', 'true');

    await waitFor(() => {
      expect(badge()).toHaveTextContent('1');
    });
    expect(api.requests().filter((request) => request.startsWith('PUT'))).toHaveLength(1);
  });

  it("explains quantity_out_of_range in the customer's words, not the server's", async () => {
    const user = userEvent.setup();
    const { api } = serveCart({
      'PUT /cart/items/:variant': {
        status: 422,
        body: { message: 'Quantity must be between 0 and 20.', code: 'quantity_out_of_range' },
      },
    });
    await renderAddToCart();
    await waitForSignedIn(api);

    await user.click(addButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('Choose a quantity from 1 to 20.');
    expect(screen.queryByText(/Quantity must be between/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'View cart' })).not.toBeInTheDocument();
    expect(badge()).toHaveTextContent('0');
  });

  it('explains variant_unavailable', async () => {
    const user = userEvent.setup();
    const { api } = serveCart({
      'PUT /cart/items/:variant': {
        status: 404,
        body: { message: 'This product is not available.', code: 'variant_unavailable' },
      },
    });
    await renderAddToCart();
    await waitForSignedIn(api);

    await user.click(addButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This item is not available right now.',
    );
  });

  it('says so when there is no connection, and lets the customer try again', async () => {
    const user = userEvent.setup();
    let online = false;
    const { api } = serveCart({
      'PUT /cart/items/:variant': () =>
        online
          ? {
              body: {
                data: {
                  lines: [serverLine(BISCUITS, 1)],
                  items_count: 1,
                  subtotal: 575,
                  currency: 'SAR',
                },
              },
            }
          : 'offline',
    });
    await renderAddToCart();
    await waitForSignedIn(api);

    await user.click(addButton());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No connection. Check your internet and try again.',
    );

    online = true;
    await user.click(addButton());
    await waitFor(() => {
      expect(badge()).toHaveTextContent('1');
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
