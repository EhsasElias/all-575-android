import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryTokenStore, type TokenStore } from '@/shared/api';
import { fakeApi } from '@/test/fakeApi';
import { testUser } from '@/test/fixtures';
import { SessionProvider } from './SessionProvider';
import { useSession } from './sessionContext';

function Probe() {
  const { status, user } = useSession();
  return <p>{`${status}:${user?.name ?? 'nobody'}`}</p>;
}

function mount(api: ReturnType<typeof fakeApi>, store: TokenStore = api.store) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SessionProvider client={api.client} store={store}>
        <Probe />
      </SessionProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe('SessionProvider: restoring the session at start-up', () => {
  it('becomes a guest, instead of loading for ever, when the keystore never answers', async () => {
    vi.useFakeTimers();
    const api = fakeApi();
    const silentStore: TokenStore = {
      get: () => new Promise<never>(() => undefined),
      set: createMemoryTokenStore().set,
      clear: createMemoryTokenStore().clear,
    };

    mount(api, silentStore);
    expect(screen.queryByText('guest:nobody')).not.toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });

    expect(screen.getByText('guest:nobody')).toBeInTheDocument();
  });

  it('becomes a guest, instead of loading forever, when the stored token cannot be read', async () => {
    const api = fakeApi();
    const brokenStore: TokenStore = {
      get: () => Promise.reject(new Error('The keystore is locked')),
      set: createMemoryTokenStore().set,
      clear: createMemoryTokenStore().clear,
    };

    mount(api, brokenStore);

    expect(await screen.findByText('guest:nobody')).toBeInTheDocument();
    expect(api.requests()).toEqual([]);
  });

  it('keeps the token and signs the customer back in once the connection is back', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let answers = 0;
    const api = fakeApi({
      'GET /me': () => {
        answers += 1;
        return answers === 1 ? 'offline' : { body: { data: testUser } };
      },
    });
    await api.store.set('good-token');

    mount(api);
    expect(await screen.findByText('guest:nobody')).toBeInTheDocument();
    await expect(api.store.get()).resolves.toBe('good-token');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });

    expect(await screen.findByText('signed-in:Sara')).toBeInTheDocument();
    expect(answers).toBe(2);
  });

  it('asks again as soon as the device comes back online', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let answers = 0;
    const api = fakeApi({
      'GET /me': () => {
        answers += 1;
        return answers === 1
          ? { status: 503, body: { message: 'Down' } }
          : { body: { data: testUser } };
      },
    });
    await api.store.set('good-token');

    mount(api);
    await screen.findByText('guest:nobody');
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(await screen.findByText('signed-in:Sara')).toBeInTheDocument();
  });

  it('does not ask again when the server rejected the token: that is final', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const api = fakeApi({ 'GET /me': { status: 401, body: { message: 'Unauthenticated.' } } });
    await api.store.set('stale-token');

    mount(api);
    await screen.findByText('guest:nobody');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(api.requests()).toEqual(['GET /me']);
    await expect(api.store.get()).resolves.toBeNull();
  });

  it('gives up after a few tries, still as a guest with the token kept', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const api = fakeApi({ 'GET /me': 'offline' });
    await api.store.set('good-token');

    mount(api);
    await screen.findByText('guest:nobody');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(120_000);
    });

    expect(api.requests()).toHaveLength(4);
    expect(screen.getByText('guest:nobody')).toBeInTheDocument();
    await expect(api.store.get()).resolves.toBe('good-token');
  });
});
