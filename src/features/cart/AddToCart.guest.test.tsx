import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { getPreference } from '@/shared/storage';
import { AddToCart } from './AddToCart';
import { guestCartStore } from './guestCartStore';
import { BISCUITS, NOTEBOOK, guestLine, productResource, variantResource } from './testData';
import { BadgeProbe, renderCartPart, serveCart } from './testHarness';

const product = productResource();
const variant = variantResource();

const cartRoute = { path: '/cart', element: <p>The cart page</p> };

async function renderAddToCart(options: Parameters<typeof renderCartPart>[1] = {}) {
  return renderCartPart(
    <>
      <AddToCart product={product} variant={variant} />
      <BadgeProbe />
    </>,
    { routes: [cartRoute], ...options },
  );
}

const addButton = () => screen.getByRole('button', { name: 'Add to cart' });
const badge = () => screen.getByLabelText('cart badge');

describe('AddToCart as a guest', () => {
  it('puts the product in the cart kept on this device, with what the cart screen needs to show it', async () => {
    const user = userEvent.setup();
    const { api } = serveCart();
    await renderAddToCart();

    await user.click(addButton());

    await waitFor(() => {
      expect(badge()).toHaveTextContent('1');
    });
    expect(guestCartStore.getSnapshot()).toEqual([guestLine(BISCUITS, 1)]);
    const stored: unknown = JSON.parse(getPreference('guestCart') ?? 'null');
    expect(stored).toEqual({ version: 1, lines: [guestLine(BISCUITS, 1)] });
    expect(api.requests().filter((request) => request.includes('/cart'))).toEqual([]);
  });

  it('tells the customer with a toast and offers the cart', async () => {
    const user = userEvent.setup();
    serveCart();
    const { router } = await renderAddToCart();

    await user.click(addButton());

    expect(
      await screen.findByText('Added to your cart: Biscuits. Quantity in cart: 1.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'View cart' }));
    expect(router.state.location.pathname).toBe('/cart');
  });

  it('adds the quantity chosen with the stepper, then starts again from 1', async () => {
    const user = userEvent.setup();
    serveCart();
    await renderAddToCart();

    await user.click(screen.getByRole('button', { name: 'Increase quantity of Biscuits' }));
    await user.click(screen.getByRole('button', { name: 'Increase quantity of Biscuits' }));
    expect(
      within(screen.getByRole('group', { name: 'Quantity of Biscuits' })).getByText('3'),
    ).toBeVisible();
    await user.click(addButton());

    await waitFor(() => {
      expect(badge()).toHaveTextContent('3');
    });
    expect(
      within(screen.getByRole('group', { name: 'Quantity of Biscuits' })).getByText('1'),
    ).toBeVisible();
  });

  it('adds to a line that is already in the cart instead of replacing it', async () => {
    const user = userEvent.setup();
    serveCart();
    guestCartStore.write([guestLine(BISCUITS, 4), guestLine(NOTEBOOK, 1)]);
    await renderAddToCart();

    await user.click(screen.getByRole('button', { name: 'Increase quantity of Biscuits' }));
    await user.click(addButton());

    await waitFor(() => {
      expect(badge()).toHaveTextContent('7');
    });
    expect(guestCartStore.getSnapshot().map((line) => line.quantity)).toEqual([6, 1]);
  });

  it('stops at 20 and says so', async () => {
    const user = userEvent.setup();
    serveCart();
    guestCartStore.write([guestLine(BISCUITS, 18)]);
    await renderAddToCart();

    await user.click(screen.getByRole('button', { name: 'Increase quantity of Biscuits' }));
    await user.click(screen.getByRole('button', { name: 'Increase quantity of Biscuits' }));
    await user.click(screen.getByRole('button', { name: 'Increase quantity of Biscuits' }));
    await user.click(addButton());

    expect(
      await screen.findByText(
        'The most you can order of one item is 20. Biscuits is now at 20 in your cart.',
      ),
    ).toBeInTheDocument();
    expect(guestCartStore.getSnapshot()).toEqual([guestLine(BISCUITS, 20)]);
    expect(badge()).toHaveTextContent('20');
  });

  it('keeps the stepper between 1 and 20 and keeps the buttons focusable at the limits', async () => {
    const user = userEvent.setup();
    serveCart();
    await renderAddToCart();
    const group = screen.getByRole('group', { name: 'Quantity of Biscuits' });
    const minus = screen.getByRole('button', { name: 'Decrease quantity of Biscuits' });
    const plus = screen.getByRole('button', { name: 'Increase quantity of Biscuits' });

    await user.click(minus);
    expect(within(group).getByText('1')).toBeVisible();
    expect(minus).toHaveAttribute('aria-disabled', 'true');

    for (let click = 0; click < 25; click += 1) await user.click(plus);
    expect(within(group).getByText('20')).toBeVisible();
    expect(plus).toHaveAttribute('aria-disabled', 'true');
    expect(plus).not.toBeDisabled();
  });

  it('shows a help line with the limit', async () => {
    serveCart();
    await renderAddToCart();

    expect(screen.getByText('You can order up to 20 of each item.')).toBeInTheDocument();
  });
});

describe('AddToCart for a variant that is out of stock', () => {
  it('shows a disabled button with a clear label, no stepper, and sends nothing', async () => {
    const { api } = serveCart();
    await renderCartPart(
      <AddToCart product={product} variant={variantResource({ availability: 'out_of_stock' })} />,
    );

    expect(screen.getByRole('button', { name: 'Out of stock' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Add to cart' })).not.toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(
      screen.getByText('This item is out of stock for your delivery area right now.'),
    ).toBeInTheDocument();
    expect(api.requests().filter((request) => request.includes('/cart'))).toEqual([]);
  });
});

describe('AddToCart in Arabic', () => {
  it('reads naturally, uses the Arabic product name and keeps Latin digits', async () => {
    const user = userEvent.setup();
    serveCart();
    await renderAddToCart({ language: 'ar' });

    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(screen.queryByText('Add to cart')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'زيادة كمية بسكويت' }));
    expect(screen.getByRole('group', { name: 'كمية بسكويت' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'أضف إلى السلة' }));

    expect(
      await screen.findByText('تمت الإضافة إلى السلة: بسكويت. الكمية في السلة: 2.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'عرض السلة' })).toBeInTheDocument();
    expect(screen.getByText('يمكنك طلب حتى 20 من كل منتج.')).toBeInTheDocument();
  });

  it('shows the out of stock label in Arabic', async () => {
    serveCart();
    await renderCartPart(
      <AddToCart product={product} variant={variantResource({ availability: 'out_of_stock' })} />,
      { language: 'ar' },
    );

    expect(screen.getByRole('button', { name: 'نفدت الكمية' })).toBeDisabled();
  });
});
