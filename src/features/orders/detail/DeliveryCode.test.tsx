import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { testUser } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { ORDER_ID, SUBORDER_ID, buildOrderDetail, buildSuborder } from '../testData';
import { onTheWayOrder } from '../testScenarios';
import { CODE_VISIBLE_MS } from './useDeliveryCode';

const signedIn = { 'GET /me': { body: { data: testUser } } };
const CODE_PATH = `/orders/${ORDER_ID}/suborders/${SUBORDER_ID}/delivery-code`;
const CODE_REPLY = {
  body: { data: { code: '482913', expires_at: '2026-10-25T09:00:00.000000Z' } },
};

function openOnTheWay(language: 'en' | 'ar' = 'en') {
  return renderApp({ route: `/orders/${ORDER_ID}`, signedIn: true, seenWelcome: true, language });
}

afterEach(() => {
  vi.useRealTimers();
});

function dump(storage: Storage): string {
  return Array.from({ length: storage.length }, (_, index) => storage.key(index) ?? '')
    .map((key) => `${key}=${storage.getItem(key) ?? ''}`)
    .join('&');
}

describe('Delivery code', () => {
  it('is not fetched until the customer asks, and only while the delivery is on its way', async () => {
    const api = installFakeApi({
      ...signedIn,
      'GET /orders/:id': { body: { data: onTheWayOrder() } },
    });
    await openOnTheWay();

    expect(
      await screen.findByRole('button', { name: 'Show my delivery code' }),
    ).toBeInTheDocument();
    expect(api.requests().some((request) => request.includes('delivery-code'))).toBe(false);
    expect(screen.queryByText('482913')).not.toBeInTheDocument();
  });

  it('is not offered for a delivery that has not left yet', async () => {
    const preparing = buildOrderDetail({ suborders: [buildSuborder({ status: 'preparing' })] });
    installFakeApi({ ...signedIn, 'GET /orders/:id': { body: { data: preparing } } });
    await openOnTheWay();

    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('button', { name: 'Show my delivery code' })).not.toBeInTheDocument();
  });

  it('shows the six digits large with a warning, and can be hidden by hand', async () => {
    const user = userEvent.setup();
    const api = installFakeApi({
      ...signedIn,
      'GET /orders/:id': { body: { data: onTheWayOrder() } },
      [`GET ${CODE_PATH}`]: CODE_REPLY,
    });
    await openOnTheWay();

    await user.click(await screen.findByRole('button', { name: 'Show my delivery code' }));

    expect(await screen.findByText('482913')).toBeInTheDocument();
    expect(screen.getByText(/Give this code only to the courier at your door/)).toBeInTheDocument();
    expect(screen.getByText('4 8 2 9 1 3')).toBeInTheDocument();
    expect(screen.getByText(/Valid until 25 Oct 2026, 12:00 pm/)).toBeInTheDocument();
    expect(api.requests()).toContain(`GET ${CODE_PATH}`);

    await user.click(screen.getByRole('button', { name: 'Hide code' }));

    expect(screen.queryByText('482913')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show my delivery code' })).toBeInTheDocument();
  });

  it('hides itself after a minute', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    installFakeApi({
      ...signedIn,
      'GET /orders/:id': { body: { data: onTheWayOrder() } },
      [`GET ${CODE_PATH}`]: CODE_REPLY,
    });
    await openOnTheWay();
    await user.click(await screen.findByRole('button', { name: 'Show my delivery code' }));
    expect(await screen.findByText('482913')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(CODE_VISIBLE_MS - 1000);
    });
    expect(screen.getByText('482913')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(screen.queryByText('482913')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show my delivery code' })).toBeInTheDocument();
  });

  it('hides when the tab goes to the background', async () => {
    const user = userEvent.setup();
    installFakeApi({
      ...signedIn,
      'GET /orders/:id': { body: { data: onTheWayOrder() } },
      [`GET ${CODE_PATH}`]: CODE_REPLY,
    });
    await openOnTheWay();
    await user.click(await screen.findByRole('button', { name: 'Show my delivery code' }));
    await screen.findByText('482913');

    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    visibility.mockRestore();

    expect(screen.queryByText('482913')).not.toBeInTheDocument();
  });

  it('is gone after leaving the page and never written to storage or the URL', async () => {
    const user = userEvent.setup();
    installFakeApi({
      ...signedIn,
      'GET /orders/:id': { body: { data: onTheWayOrder() } },
      [`GET ${CODE_PATH}`]: CODE_REPLY,
    });
    const { router } = await openOnTheWay();
    await user.click(await screen.findByRole('button', { name: 'Show my delivery code' }));
    await screen.findByText('482913');

    expect(dump(localStorage)).not.toContain('482913');
    expect(dump(sessionStorage)).not.toContain('482913');
    expect(router.state.location.pathname + router.state.location.search).not.toContain('482913');

    await act(async () => {
      await router.navigate('/orders');
    });
    await act(async () => {
      await router.navigate(`/orders/${ORDER_ID}`);
    });

    expect(screen.queryByText('482913')).not.toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: 'Show my delivery code' }),
    ).toBeInTheDocument();
  });

  it('handles delivery_code_unavailable with a clear message', async () => {
    const user = userEvent.setup();
    installFakeApi({
      ...signedIn,
      'GET /orders/:id': { body: { data: onTheWayOrder() } },
      [`GET ${CODE_PATH}`]: {
        status: 404,
        body: {
          message: 'There is no active hand-over code for this delivery.',
          code: 'delivery_code_unavailable',
        },
      },
    });
    await openOnTheWay();

    await user.click(await screen.findByRole('button', { name: 'Show my delivery code' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('There is no code to show right now.');
    expect(screen.queryByText(/hand-over code for this delivery/)).not.toBeInTheDocument();
    expect(
      within(alert.parentElement ?? document.body).getByRole('button', {
        name: 'Show my delivery code',
      }),
    ).toBeInTheDocument();
  });

  it('shows a general message when the request fails', async () => {
    const user = userEvent.setup();
    installFakeApi({
      ...signedIn,
      'GET /orders/:id': { body: { data: onTheWayOrder() } },
      [`GET ${CODE_PATH}`]: { status: 429, body: { message: 'Too many attempts' } },
    });
    await openOnTheWay();

    await user.click(await screen.findByRole('button', { name: 'Show my delivery code' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not get your code');
  });

  it('is in Arabic, with the digits left to right', async () => {
    const user = userEvent.setup();
    installFakeApi({
      ...signedIn,
      'GET /orders/:id': { body: { data: onTheWayOrder() } },
      [`GET ${CODE_PATH}`]: CODE_REPLY,
    });
    await openOnTheWay('ar');

    await user.click(await screen.findByRole('button', { name: 'عرض رمز الاستلام' }));

    const digits = await screen.findByText('482913');
    expect(digits.closest('p')).toHaveAttribute('dir', 'ltr');
    expect(screen.getByText(/أعطِ هذا الرمز للمندوب عند بابك فقط/)).toBeInTheDocument();
  });
});
