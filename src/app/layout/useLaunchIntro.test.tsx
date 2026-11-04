import { act } from '@testing-library/react';
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
  it('keeps the open page when the app background/resumes instead of replaying the logo', async () => {
    installFakeApi({ 'GET /store': { body: { data: testStore } } });
    window.history.replaceState(null, '', '/cart');
    const { router } = await renderApp({ route: '/cart', seenWelcome: true });

    act(() => {
      bridge.listener?.({ isActive: false });
      bridge.listener?.({ isActive: true });
    });

    expect(router.state.location.pathname).toBe('/cart');
    expect(router.state.location.search).toBe('');
  });
});
