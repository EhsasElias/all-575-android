import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { getPreference } from '@/shared/storage';
import { CartScreen } from './CartScreen';
import { GuestCartMerger } from './GuestCartMerger';
import { guestCartStore } from './guestCartStore';
import { BISCUITS, NOTEBOOK, guestLine, serverLine } from './testData';
import { BadgeProbe, SignInProbe, holdRequests, renderCartPart, serveCart } from './testHarness';

const page = (
  <>
    <GuestCartMerger />
    <SignInProbe />
    <BadgeProbe />
  </>
);

const mergeCalls = (api: ReturnType<typeof serveCart>['api']) =>
  api.calls().filter((call) => call.method === 'POST' && call.path === '/cart/merge');

const badge = () => screen.getByLabelText('cart badge');
const signInButton = () => screen.getByRole('button', { name: 'Sign in now' });

describe('merging the guest cart when the customer signs in', () => {
  it('sends the local lines to POST /cart/merge exactly once, then clears them and refreshes the cart', async () => {
    const user = userEvent.setup();
    const { api } = serveCart();
    guestCartStore.write([guestLine(BISCUITS, 2), guestLine(NOTEBOOK, 3)]);
    await renderCartPart(page);
    expect(mergeCalls(api)).toHaveLength(0);

    await user.click(signInButton());

    expect(
      await screen.findByText('We added the items you chose before signing in'),
    ).toBeInTheDocument();
    expect(mergeCalls(api)).toHaveLength(1);
    expect(mergeCalls(api)[0]?.body).toEqual({
      items: [
        { variant_id: 1, quantity: 2 },
        { variant_id: 7, quantity: 3 },
      ],
    });
    expect(guestCartStore.getSnapshot()).toEqual([]);
    const stored: unknown = JSON.parse(getPreference('guestCart') ?? 'null');
    expect(stored).toEqual({ version: 1, lines: [] });
    await waitFor(() => {
      expect(badge()).toHaveTextContent('5');
    });
  });

  it('sends nothing when the guest had nothing in the cart', async () => {
    const user = userEvent.setup();
    const { api } = serveCart();
    await renderCartPart(page);

    await user.click(signInButton());

    await screen.findByText('session: signed-in');
    expect(mergeCalls(api)).toHaveLength(0);
    expect(screen.queryByText(/We added the items/)).not.toBeInTheDocument();
  });

  it('does nothing while the customer is still a guest', async () => {
    const { api } = serveCart();
    guestCartStore.write([guestLine(BISCUITS, 2)]);

    await renderCartPart(page);

    expect(await screen.findByText('session: guest')).toBeInTheDocument();
    expect(mergeCalls(api)).toHaveLength(0);
    expect(guestCartStore.getSnapshot()).toHaveLength(1);
  });

  it('merges once even when two copies are mounted and React runs every effect twice', async () => {
    const user = userEvent.setup();
    const { api } = serveCart();
    guestCartStore.write([guestLine(BISCUITS, 2)]);
    await renderCartPart(
      <>
        <GuestCartMerger />
        <GuestCartMerger />
        <SignInProbe />
        <BadgeProbe />
      </>,
      { strictMode: true },
    );

    await user.click(signInButton());

    await screen.findByText('We added the items you chose before signing in');
    expect(mergeCalls(api)).toHaveLength(1);
    expect(screen.getAllByText('We added the items you chose before signing in')).toHaveLength(1);
  });

  it('merges leftover lines at start-up for a customer who is already signed in, once', async () => {
    const { api } = serveCart();
    guestCartStore.write([guestLine(NOTEBOOK, 1)]);

    await renderCartPart(page, { signedIn: true, strictMode: true });

    await screen.findByText('We added the items you chose before signing in');
    expect(mergeCalls(api)).toHaveLength(1);
    expect(guestCartStore.getSnapshot()).toEqual([]);
  });

  it('brings a quantity above the server limit down to 20 before sending it', async () => {
    const user = userEvent.setup();
    const { api } = serveCart();
    guestCartStore.write([{ ...guestLine(BISCUITS, 1), quantity: 99 }]);
    await renderCartPart(page);

    await user.click(signInButton());

    await screen.findByText('We added the items you chose before signing in');
    expect(mergeCalls(api)[0]?.body).toEqual({ items: [{ variant_id: 1, quantity: 20 }] });
  });

  it('does not send damaged stored lines', async () => {
    const user = userEvent.setup();
    const { api } = serveCart();
    guestCartStore.write([guestLine(BISCUITS, 2), { ...guestLine(NOTEBOOK, 1), quantity: -4 }]);
    await renderCartPart(page);

    await user.click(signInButton());

    await screen.findByText('We added the items you chose before signing in');
    expect(mergeCalls(api)[0]?.body).toEqual({ items: [{ variant_id: 1, quantity: 2 }] });
  });

  it('says so in Arabic', async () => {
    const user = userEvent.setup();
    serveCart();
    guestCartStore.write([guestLine(BISCUITS, 1)]);
    await renderCartPart(page, { language: 'ar' });

    await user.click(signInButton());

    expect(
      await screen.findByText('أضفنا المنتجات التي اخترتها قبل تسجيل الدخول'),
    ).toBeInTheDocument();
  });
});

describe('when the merge fails', () => {
  it('keeps the local lines and tells the customer', async () => {
    const user = userEvent.setup();
    const { api } = serveCart({ 'POST /cart/merge': { status: 500, body: { message: 'Boom' } } });
    guestCartStore.write([guestLine(BISCUITS, 2)]);
    await renderCartPart(page);

    await user.click(signInButton());

    expect(
      await screen.findByText(
        'We could not add the items you chose before signing in. They are saved on this device and we will try again next time.',
      ),
    ).toBeInTheDocument();
    expect(mergeCalls(api)).toHaveLength(1);
    expect(guestCartStore.getSnapshot()).toEqual([guestLine(BISCUITS, 2)]);
    expect(
      screen.queryByText('We added the items you chose before signing in'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Boom')).not.toBeInTheDocument();
  });

  it('does not keep the lines for ever when the server refuses them for good, and says to add them again', async () => {
    const user = userEvent.setup();
    const { api } = serveCart({
      'POST /cart/merge': {
        status: 422,
        body: { message: 'Invalid', code: 'variant_unavailable' },
      },
    });
    guestCartStore.write([guestLine(BISCUITS, 2)]);
    await renderCartPart(page);

    await user.click(signInButton());

    expect(
      await screen.findByText(
        'We could not add the items you chose before signing in. Please add them to your cart again.',
      ),
    ).toBeInTheDocument();
    expect(guestCartStore.getSnapshot()).toEqual([]);
    expect(mergeCalls(api)).toHaveLength(1);
  });

  it('keeps the lines when the network is down', async () => {
    const user = userEvent.setup();
    serveCart({ 'POST /cart/merge': 'offline' });
    guestCartStore.write([guestLine(BISCUITS, 2)]);
    await renderCartPart(page);

    await user.click(signInButton());

    expect(await screen.findByText(/We could not add the items you chose/)).toBeInTheDocument();
    expect(guestCartStore.getSnapshot()).toHaveLength(1);
  });

  it('tries again on the next mount and then clears the lines', async () => {
    const user = userEvent.setup();
    let failing = true;
    const { api } = serveCart({
      'POST /cart/merge': () =>
        failing
          ? { status: 503, body: { message: 'Down' } }
          : {
              body: {
                data: {
                  lines: [serverLine(BISCUITS, 2)],
                  items_count: 2,
                  subtotal: 1150,
                  currency: 'SAR',
                },
              },
            },
    });
    guestCartStore.write([guestLine(BISCUITS, 2)]);
    const first = await renderCartPart(page);
    await user.click(signInButton());
    await screen.findByText(/We could not add the items you chose/);
    first.unmount();

    failing = false;
    await renderCartPart(page, { signedIn: true });

    expect(
      await screen.findByText('We added the items you chose before signing in'),
    ).toBeInTheDocument();
    expect(mergeCalls(api)).toHaveLength(2);
    expect(guestCartStore.getSnapshot()).toEqual([]);
  });
});

describe('the cart while the merge is running', () => {
  it('reads as loading, never as empty, until the merged items arrive', async () => {
    const user = userEvent.setup();
    serveCart();
    const release = holdRequests('POST /cart/merge');
    guestCartStore.write([guestLine(BISCUITS, 2)]);
    await renderCartPart(
      <>
        <GuestCartMerger />
        <SignInProbe />
        <CartScreen />
      </>,
    );

    await user.click(signInButton());

    expect(await screen.findByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.queryByText('Your cart is empty')).not.toBeInTheDocument();

    release();
    expect(await screen.findByRole('link', { name: 'Biscuits' })).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument();
  });
});
