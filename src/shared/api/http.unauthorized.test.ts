import { describe, expect, it, vi } from 'vitest';
import { isApiError } from './api-error';
import { createHttpClient } from './http';
import { createMemoryTokenStore, type TokenStore } from './token-store';

function setup(store: TokenStore = createMemoryTokenStore()) {
  const fetchFn = vi.fn<typeof fetch>();
  const onUnauthorized = vi.fn();
  const http = createHttpClient({
    baseUrl: 'https://api.example.test/api',
    tokenStore: store,
    getLanguage: () => 'en',
    fetchFn,
    onUnauthorized,
  });
  return { http, fetchFn, store, onUnauthorized };
}

const unauthorized = () => new Response('{"message":"Unauthenticated."}', { status: 401 });

describe('a request the server refuses with 401', () => {
  it('drops the token it carried and tells the app', async () => {
    const { http, fetchFn, store, onUnauthorized } = setup();
    await store.set('old');
    fetchFn.mockResolvedValue(unauthorized());

    await expect(http.get('/me')).rejects.toMatchObject({ kind: 'unauthenticated' });

    expect(await store.get()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('leaves a newer token alone when the customer signed in again while the request was on its way', async () => {
    const { http, fetchFn, store, onUnauthorized } = setup();
    await store.set('old');
    fetchFn.mockImplementation(async () => {
      await store.set('new-after-sign-in');
      return unauthorized();
    });

    await expect(http.get('/orders')).rejects.toMatchObject({ kind: 'unauthenticated' });

    expect(await store.get()).toBe('new-after-sign-in');
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('still signs the customer out, and still reports the 401, when the token store cannot be cleared', async () => {
    const memory = createMemoryTokenStore();
    const store: TokenStore = {
      get: memory.get,
      set: memory.set,
      clear: () => Promise.reject(new Error('Keystore error')),
    };
    const { http, fetchFn, onUnauthorized } = setup(store);
    await store.set('old');
    fetchFn.mockResolvedValue(unauthorized());

    const error: unknown = await http.get('/me').catch((caught: unknown) => caught);

    expect(isApiError(error)).toBe(true);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('does nothing about a 401 when no token was sent: a guest has nothing to drop', async () => {
    const { http, fetchFn, onUnauthorized } = setup();
    fetchFn.mockResolvedValue(unauthorized());

    await expect(http.get('/cart')).rejects.toMatchObject({ kind: 'unauthenticated' });

    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
