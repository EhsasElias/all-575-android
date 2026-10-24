import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { getPreference, loadPreferences } from '@/shared/storage';
import { createMemoryPreferences } from '@/test/memoryPreferences';
import { renderApp } from '@/test/render';
import { guestCartStore } from './guestCartStore';
import { BISCUITS, NOTEBOOK, guestLine } from './testData';
import { money, seedGuestCart, serveCart } from './testHarness';

const OPTIONS = { route: '/cart', seenWelcome: true } as const;

const cartLink = (count: number) =>
  screen.getByRole('link', { name: `Cart, Items in cart: ${count}` });

describe('the cart screen as a guest', () => {
  it('draws the lines from what the device kept, without asking the API for a cart', async () => {
    const { api } = serveCart();
    await renderApp(OPTIONS);

    seedGuestCart([guestLine(BISCUITS, 2), guestLine(NOTEBOOK, 1)]);

    expect(await screen.findByRole('heading', { level: 1, name: 'Cart' })).toBeInTheDocument();
    const items = within(
      await screen.findByRole('list', { name: 'Items in your cart' }),
    ).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(
      within(items[0] ?? document.body).getByRole('link', { name: 'Biscuits' }),
    ).toHaveAttribute('href', '/products/demo-food-1');
    expect(items[0]).toHaveTextContent(money(1150));
    expect(items[0]).toHaveTextContent(`${money(575)} each`);
    expect(items[1]).toHaveTextContent('Notebook');
    expect(items[1]).toHaveTextContent('Blue');
    expect(api.requests()).not.toContain('GET /cart');
  });

  it('shows items, subtotal, VAT, and says the delivery fee and promo code come at checkout', async () => {
    serveCart();
    await renderApp(OPTIONS);
    seedGuestCart([guestLine(BISCUITS, 2), guestLine(NOTEBOOK, 1)]);

    const summary = await screen.findByRole('region', { name: 'Order summary' });

    expect(summary).toHaveTextContent('Items3');
    expect(summary).toHaveTextContent(`Subtotal${money(1725)}`);
    expect(await within(summary).findByText('Prices include 15% VAT')).toBeInTheDocument();
    expect(
      within(summary).getByText('The delivery fee and any promo code are worked out at checkout.'),
    ).toBeInTheDocument();
    expect(
      within(summary).getByText('Availability is checked at checkout, where you sign in to pay.'),
    ).toBeInTheDocument();
  });

  it('sends a guest who taps Checkout to sign in, and remembers where they were going', async () => {
    const user = userEvent.setup();
    serveCart();
    const { router } = await renderApp(OPTIONS);
    seedGuestCart([guestLine(BISCUITS, 1)]);

    await user.click(await screen.findByRole('link', { name: 'Checkout' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/sign-in');
    });
    expect(router.state.location.search).toBe('?next=%2Fcheckout');
  });

  it('changes a quantity with the stepper, keeps it on the device and updates the tab badge', async () => {
    const user = userEvent.setup();
    serveCart();
    await renderApp(OPTIONS);
    seedGuestCart([guestLine(BISCUITS, 2), guestLine(NOTEBOOK, 1)]);

    await user.click(await screen.findByRole('button', { name: 'Increase quantity of Biscuits' }));

    const group = screen.getByRole('group', { name: 'Quantity of Biscuits' });
    expect(within(group).getByText('3')).toBeVisible();
    expect(guestCartStore.getSnapshot().map((line) => line.quantity)).toEqual([3, 1]);
    expect(cartLink(4)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Order summary' })).toHaveTextContent(money(2300));

    await user.click(screen.getByRole('button', { name: 'Decrease quantity of Biscuits' }));
    expect(cartLink(3)).toBeInTheDocument();
  });

  it('cannot go below 1 or above 20 with the stepper', async () => {
    const user = userEvent.setup();
    serveCart();
    await renderApp(OPTIONS);
    seedGuestCart([guestLine(BISCUITS, 1), guestLine(NOTEBOOK, 20)]);

    await user.click(await screen.findByRole('button', { name: 'Decrease quantity of Biscuits' }));
    await user.click(screen.getByRole('button', { name: 'Increase quantity of Notebook' }));

    expect(guestCartStore.getSnapshot().map((line) => line.quantity)).toEqual([1, 20]);
    expect(screen.getByRole('button', { name: 'Decrease quantity of Biscuits' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Increase quantity of Notebook' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('removes a line, says so, and moves focus to the title instead of losing it', async () => {
    const user = userEvent.setup();
    serveCart();
    await renderApp(OPTIONS);
    seedGuestCart([guestLine(BISCUITS, 2), guestLine(NOTEBOOK, 1)]);

    await user.click(await screen.findByRole('button', { name: 'Remove Biscuits from the cart' }));

    expect(await screen.findByText('Biscuits was removed from your cart.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Biscuits' })).not.toBeInTheDocument();
    expect(guestCartStore.getSnapshot().map((line) => line.variantId)).toEqual([7]);
    expect(screen.getByRole('heading', { level: 1, name: 'Cart' })).toHaveFocus();
    expect(cartLink(1)).toBeInTheDocument();
  });

  it('shows the empty state with a way forward when the last line goes, and no Checkout', async () => {
    const user = userEvent.setup();
    serveCart();
    const { router } = await renderApp(OPTIONS);
    seedGuestCart([guestLine(BISCUITS, 1)]);

    await user.click(await screen.findByRole('button', { name: 'Remove Biscuits from the cart' }));

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Your cart is empty' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Checkout' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Checkout' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Browse categories' }));
    expect(router.state.location.pathname).toBe('/categories');
  });

  it('starts empty for a guest with nothing saved, with exactly one h1', async () => {
    serveCart();
    await renderApp(OPTIONS);

    expect(await screen.findByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});

describe('the cart screen when the saved guest cart is damaged', () => {
  async function openCartWithSaved(saved: string) {
    const user = userEvent.setup();
    serveCart();
    await renderApp({ route: '/home', seenWelcome: true });
    await loadPreferences(createMemoryPreferences({ guestCart: saved }));
    await user.click(screen.getByRole('link', { name: 'Cart' }));
    return user;
  }

  it('shows an empty cart, not a crash, for text that is not JSON', async () => {
    await openCartWithSaved('{"version":1,"lines":[{"variantId":');

    expect(await screen.findByText('Your cart is empty')).toBeInTheDocument();
  });

  it('shows an empty cart for JSON of the wrong shape', async () => {
    await openCartWithSaved('{"lines":"everything"}');

    expect(await screen.findByText('Your cart is empty')).toBeInTheDocument();
  });

  it('keeps the good lines and leaves out the bad ones', async () => {
    const saved = JSON.stringify({
      version: 1,
      lines: [
        { variantId: 'x', quantity: 1 },
        guestLine(BISCUITS, 2),
        { ...guestLine(NOTEBOOK, 1), imageUrl: 'javascript:alert(1)' },
      ],
    });

    await openCartWithSaved(saved);

    expect(await screen.findByRole('link', { name: 'Biscuits' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Notebook' })).not.toBeInTheDocument();
    expect(document.querySelector('img[src^="javascript"]')).toBeNull();
  });

  it('replaces the damaged text the next time the guest changes the cart', async () => {
    const user = await openCartWithSaved('not json');
    await screen.findByText('Your cart is empty');

    seedGuestCart([guestLine(BISCUITS, 1)]);
    await user.click(await screen.findByRole('button', { name: 'Increase quantity of Biscuits' }));

    const stored: unknown = JSON.parse(getPreference('guestCart') ?? 'null');
    expect(stored).toMatchObject({ version: 1, lines: [{ variantId: 1, quantity: 2 }] });
  });
});
