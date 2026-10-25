import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { chooseFirstSlot } from './checkoutActions';
import { renderCheckout } from './checkoutHarness';
import { createShop } from './shopServer';
import { TOTAL_TEXT } from './testData';

const countOf = (api: { requests: () => string[] }, request: string) =>
  api.requests().filter((entry) => entry === request).length;

describe('Checkout: placing the order', () => {
  it('sends the order once when the pay button is pressed twice before the screen can react', async () => {
    const user = userEvent.setup();
    const { routes } = createShop();
    const { api } = await renderCheckout({ routes });
    await chooseFirstSlot(user);
    const pay = screen.getByRole('button', { name: `Pay ${TOTAL_TEXT}` });

    act(() => {
      pay.click();
      pay.click();
    });

    await screen.findByRole('heading', { level: 1, name: 'Complete your payment' });
    expect(countOf(api, 'POST /checkout')).toBe(1);
  });

  it('does not ask for a price of the emptied cart when the order needed no payment', async () => {
    const user = userEvent.setup();
    const { routes } = createShop();
    const { api, router } = await renderCheckout({
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
    const quotesBefore = countOf(api, 'POST /quotes');

    await user.click(screen.getByRole('button', { name: `Pay ${TOTAL_TEXT}` }));
    await screen.findByRole('main');
    await act(() => Promise.resolve());

    expect(router.state.location.pathname).toBe('/orders/free-order');
    expect(countOf(api, 'POST /quotes')).toBe(quotesBefore);
    expect(countOf(api, 'GET /cart')).toBeGreaterThan(0);
  });
});
