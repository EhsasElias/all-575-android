import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { testStore } from '@/test/fixtures';
import { renderApp } from '@/test/render';

const bridge = vi.hoisted(() => {
  const handlers: { listener?: (state: { isActive: boolean }) => void } = {};
  return handlers;
});

vi.mock('@/shared/native-lifecycle', () => ({
  observeAppVisibility: (listener: (state: { isActive: boolean }) => void) => {
    bridge.listener = listener;
    return Promise.resolve({ remove: () => Promise.resolve() });
  },
}));

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('returning to the app', () => {
  it('shows logo then slider before returning to the page that was open', async () => {
    installFakeApi({ 'GET /store': { body: { data: testStore } } });
    window.history.replaceState(null, '', '/cart');
    const { router } = await renderApp({ route: '/cart', seenWelcome: true });
    act(() => {
      bridge.listener?.({ isActive: true });
    });
    expect(router.state.location.pathname).toBe('/cart');
    act(() => {
      bridge.listener?.({ isActive: false });
      bridge.listener?.({ isActive: true });
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/welcome/logo');
    });
    expect(router.state.location.search).toBe('?next=%2Fcart');
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Tap the logo to shop now' }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/welcome');
    });
    expect(await screen.findByRole('link', { name: 'Skip' })).toBeVisible();
    await userEvent.setup().click(screen.getByRole('link', { name: 'Skip' }));
    expect(router.state.location.pathname).toBe('/cart');
  });
});
