import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '@/test/render';
import { testStore } from '@/test/fixtures';
import { CartScreen } from './CartScreen';
import { guestCartStore } from './guestCartStore';
import { cartQueryKey } from './queryKeys';
import { BISCUITS, CHOCOLATE, NOTEBOOK, guestLine, serverLine } from './testData';
import { holdRequests, money, renderCartPart, seedGuestCart, serveCart } from './testHarness';

describe('loading', () => {
  it('shows a skeleton while a guest cart waits for the price, and no lines', async () => {
    serveCart();
    holdRequests('GET /store');
    guestCartStore.write([guestLine(BISCUITS, 1)]);

    await renderCartPart(<CartScreen />);

    const loading = screen.getByRole('status', { name: 'Loading' });
    expect(loading).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByText('Your cart is empty')).not.toBeInTheDocument();
  });

  it('shows a skeleton while the server cart loads, never an empty cart', async () => {
    serveCart();
    holdRequests('GET /cart');

    await renderCartPart(<CartScreen />, { signedIn: true });

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.queryByText('Your cart is empty')).not.toBeInTheDocument();
  });

  it('has the single h1 while loading', async () => {
    serveCart();
    holdRequests('GET /cart');

    await renderCartPart(<CartScreen />, { signedIn: true });

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});

describe('errors', () => {
  it('tells a signed-in customer the cart did not load and retries on request', async () => {
    const user = userEvent.setup();
    let failing = true;
    serveCart({
      'GET /cart': () =>
        failing
          ? { status: 503, body: { message: 'Down' } }
          : {
              body: {
                data: {
                  lines: [serverLine(BISCUITS, 1)],
                  items_count: 1,
                  subtotal: 575,
                  currency: 'SAR',
                },
              },
            },
    });
    await renderCartPart(<CartScreen />, { signedIn: true });

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('We could not load your cart');
    expect(alert).toHaveTextContent('Check your connection and try again.');
    expect(screen.queryByText('Down')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Checkout' })).not.toBeInTheDocument();

    failing = false;
    await user.click(within(alert).getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('link', { name: 'Biscuits' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('tells a guest the price could not be loaded and retries on request', async () => {
    const user = userEvent.setup();
    let failing = true;
    serveCart({ 'GET /store': () => (failing ? 'offline' : { body: { data: testStore } }) });
    seedGuestCart([guestLine(BISCUITS, 2)]);
    await renderCartPart(<CartScreen />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('We could not load your cart');

    failing = false;
    await user.click(within(alert).getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('link', { name: 'Biscuits' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Order summary' })).toHaveTextContent(money(1150));
  });

  it('does not show an error for a guest with an empty cart, even if the price cannot load', async () => {
    serveCart({ 'GET /store': 'offline' });

    await renderCartPart(<CartScreen />);

    expect(await screen.findByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('when the session ends while the customer is using the cart', () => {
  it('says so, falls back to the cart on the device, and does not put the old cart back in the cache', async () => {
    const user = userEvent.setup();
    serveCart(
      { 'PUT /cart/items/:variant': { status: 401, body: { message: 'Unauthenticated.' } } },
      [serverLine(BISCUITS, 2)],
    );
    const { queryClient } = await renderCartPart(<CartScreen />, { signedIn: true });

    await user.click(await screen.findByRole('button', { name: 'Increase quantity of Biscuits' }));

    expect(
      await screen.findByText('Your session has ended. Sign in again and try once more.'),
    ).toBeInTheDocument();
    expect(await screen.findByText('Your cart is empty')).toBeInTheDocument();
    expect(queryClient.getQueryData(cartQueryKey)).toBeUndefined();
  });
});

describe('both languages', () => {
  it('reads in English, left to right', async () => {
    serveCart();
    await renderApp({ route: '/cart', seenWelcome: true, language: 'en' });

    expect(await screen.findByRole('heading', { level: 1, name: 'Cart' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
    expect(document.title).toBe('Cart · ALL 5.75');
  });

  it('reads in Arabic, right to left, with the Arabic names and Latin digits', async () => {
    serveCart();
    await renderApp({ route: '/cart', seenWelcome: true, language: 'ar' });
    seedGuestCart([guestLine(BISCUITS, 2), guestLine(NOTEBOOK, 1), guestLine(CHOCOLATE, 1)]);

    expect(await screen.findByRole('heading', { level: 1, name: 'السلة' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(document.title).toBe('السلة · الكل بـ 5.75');
    expect(screen.getByRole('link', { name: 'بسكويت' })).toBeInTheDocument();
    expect(screen.getByText('أزرق')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Biscuits' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'زيادة كمية بسكويت' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'حذف بسكويت من السلة' })).toBeInTheDocument();

    const summary = screen.getByRole('region', { name: 'ملخص الطلب' });
    expect(summary).toHaveTextContent(`المجموع الفرعي${money(2300, 'ar')}`);
    expect(summary).toHaveTextContent('ر.س');
    expect(
      await within(summary).findByText('الأسعار شاملة ضريبة القيمة المضافة 15%'),
    ).toBeInTheDocument();
    expect(
      within(summary).getByText('تُحسب رسوم التوصيل وكود الخصم عند إتمام الطلب.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'إتمام الطلب' })).toHaveAttribute('href', '/checkout');
  });

  it('shows the Arabic empty state and the way forward', async () => {
    serveCart();
    await renderApp({ route: '/cart', seenWelcome: true, language: 'ar' });

    expect(
      await screen.findByRole('heading', { level: 2, name: 'سلتك فارغة' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'تصفّح الفئات' })).toHaveAttribute(
      'href',
      '/categories',
    );
  });

  it('shows the Arabic reason for an unavailable line', async () => {
    serveCart(
      {
        'GET /addresses': {
          body: { data: [{ id: 5, is_default: true, serviceable: true, service_zone_id: 1 }] },
        },
      },
      [serverLine(CHOCOLATE, 1)],
      () => 'out_of_stock',
    );
    await renderApp({ route: '/cart', seenWelcome: true, language: 'ar', signedIn: true });

    expect(await screen.findByText('غير متوفر في عنوان التوصيل الخاص بك.')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'حذف شوكولاتة من السلة' })).toHaveTextContent(
        'حذف',
      );
    });
    expect(screen.getByRole('button', { name: 'إتمام الطلب' })).toBeDisabled();
  });
});
