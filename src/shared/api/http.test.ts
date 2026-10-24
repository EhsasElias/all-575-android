import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Language } from '@/shared/i18n';
import { ApiError } from './api-error';
import { createHttpClient } from './http';
import { createMemoryTokenStore } from './token-store';

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

type Setup = {
  language?: Language;
  token?: string;
  timeoutMs?: number;
};

function setup({ language = 'en', token, timeoutMs }: Setup = {}) {
  const fetchFn = vi.fn<typeof fetch>();
  const tokenStore = createMemoryTokenStore();
  if (token) void tokenStore.set(token);
  const http = createHttpClient({
    baseUrl: 'https://api.example.test/api/',
    tokenStore,
    getLanguage: () => language,
    fetchFn,
    ...(timeoutMs === undefined ? {} : { timeoutMs }),
  });
  return { http, fetchFn, tokenStore };
}

function lastRequest(fetchFn: ReturnType<typeof setup>['fetchFn']) {
  const call = fetchFn.mock.calls.at(-1);
  if (!call) throw new Error('fetch was not called');
  const [input, init] = call;
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  return { url, init: init ?? {}, headers: new Headers(init?.headers) };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('requests', () => {
  it('builds the URL from the base URL, path and query, skipping undefined values', async () => {
    const { http, fetchFn } = setup();
    fetchFn.mockResolvedValue(jsonResponse({ data: [] }));

    await http.get('/products', {
      query: { page: 2, search: 'تمر', inStock: true, sort: undefined },
    });

    const { url } = lastRequest(fetchFn);
    expect(url).toBe(
      `https://api.example.test/api/products?page=2&search=${encodeURIComponent('تمر')}&inStock=true`,
    );
  });

  it('sends JSON, asks for JSON and names the current language', async () => {
    const { http, fetchFn } = setup({ language: 'ar' });
    fetchFn.mockResolvedValue(jsonResponse({ id: 7 }));

    const result = await http.post<{ id: number }>('/cart/items', { productId: 3, quantity: 2 });

    const { init, headers } = lastRequest(fetchFn);
    expect(result).toEqual({ id: 7 });
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"productId":3,"quantity":2}');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('Accept')).toBe('application/json');
    expect(headers.get('Accept-Language')).toBe('ar');
  });

  it('reads the language at request time, so a switch applies to the next call', async () => {
    let language: Language = 'en';
    const fetchFn = vi.fn<typeof fetch>(() => Promise.resolve(jsonResponse({})));
    const http = createHttpClient({
      baseUrl: '',
      tokenStore: createMemoryTokenStore(),
      getLanguage: () => language,
      fetchFn,
    });

    await http.get('/a');
    language = 'ar';
    await http.get('/b');

    expect(new Headers(fetchFn.mock.calls[0]?.[1]?.headers).get('Accept-Language')).toBe('en');
    expect(new Headers(fetchFn.mock.calls[1]?.[1]?.headers).get('Accept-Language')).toBe('ar');
  });

  it('sends no Content-Type or body on a plain GET', async () => {
    const { http, fetchFn } = setup();
    fetchFn.mockResolvedValue(jsonResponse({}));

    await http.get('/categories');

    const { init, headers } = lastRequest(fetchFn);
    expect(init.body).toBeUndefined();
    expect(headers.has('Content-Type')).toBe(false);
  });

  it('adds the bearer token from the token store, and only when there is one', async () => {
    const withToken = setup({ token: 'abc123' });
    withToken.fetchFn.mockResolvedValue(jsonResponse({}));
    await withToken.http.get('/me');
    expect(lastRequest(withToken.fetchFn).headers.get('Authorization')).toBe('Bearer abc123');

    const guest = setup();
    guest.fetchFn.mockResolvedValue(jsonResponse({}));
    await guest.http.get('/products');
    expect(lastRequest(guest.fetchFn).headers.has('Authorization')).toBe(false);
  });

  it.each(['put', 'patch'] as const)('supports %s with a body', async (method) => {
    const { http, fetchFn } = setup();
    fetchFn.mockResolvedValue(jsonResponse({}));

    await http[method]('/addresses/1', { city: 'Riyadh' });

    expect(lastRequest(fetchFn).init.method).toBe(method.toUpperCase());
  });

  it('returns undefined for an empty 204 response', async () => {
    const { http, fetchFn } = setup();
    fetchFn.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(http.delete('/cart/items/1')).resolves.toBeUndefined();
    expect(lastRequest(fetchFn).init.method).toBe('DELETE');
  });
});

describe('errors', () => {
  async function failWith(response: Response, token?: string) {
    const context = setup(token ? { token } : {});
    context.fetchFn.mockResolvedValue(response);
    const error = await context.http.get('/anything').catch((caught: unknown) => caught);
    if (!(error instanceof ApiError)) throw new Error('Expected an ApiError');
    return { error, tokenStore: context.tokenStore };
  }

  it('maps 422 with Laravel field errors', async () => {
    const { error } = await failWith(
      jsonResponse(
        { message: 'The given data was invalid.', errors: { phone: ['Invalid phone'] } },
        { status: 422 },
      ),
    );

    expect(error.kind).toBe('validation');
    expect(error.status).toBe(422);
    expect(error.message).toBe('The given data was invalid.');
    expect(error.fieldErrors).toEqual({ phone: ['Invalid phone'] });
  });

  it('maps 403 to forbidden', async () => {
    const { error } = await failWith(jsonResponse({ message: 'No access' }, { status: 403 }));
    expect(error.kind).toBe('forbidden');
  });

  it('maps 429 and exposes Retry-After', async () => {
    const { error } = await failWith(
      jsonResponse(
        { message: 'Too many attempts' },
        { status: 429, headers: { 'Retry-After': '42' } },
      ),
    );

    expect(error.kind).toBe('rate-limited');
    expect(error.retryAfterSeconds).toBe(42);
  });

  it('maps 401 and discards a token the server no longer accepts', async () => {
    const { error, tokenStore } = await failWith(
      jsonResponse({ message: 'Unauthenticated.' }, { status: 401 }),
      'stale-token',
    );

    expect(error.kind).toBe('unauthenticated');
    await expect(tokenStore.get()).resolves.toBeNull();
  });

  it('keeps no token around that it never had when a guest gets 401', async () => {
    const { error, tokenStore } = await failWith(jsonResponse({}, { status: 401 }));

    expect(error.kind).toBe('unauthenticated');
    await expect(tokenStore.get()).resolves.toBeNull();
  });

  it('handles an error body that is not JSON', async () => {
    const { error } = await failWith(new Response('<html>Bad gateway</html>', { status: 502 }));

    expect(error.kind).toBe('server');
    expect(error.message).toBe('Request failed with status 502');
    expect(error.fieldErrors).toEqual({});
  });

  it('reports a network failure', async () => {
    const { http, fetchFn } = setup();
    fetchFn.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(http.get('/products')).rejects.toMatchObject({ kind: 'network' });
  });

  it('rejects a successful response that is not valid JSON', async () => {
    const { http, fetchFn } = setup();
    fetchFn.mockResolvedValue(new Response('not json', { status: 200 }));

    await expect(http.get('/products')).rejects.toMatchObject({ kind: 'unexpected' });
  });
});

describe('timeout and cancellation', () => {
  // Like the real fetch: never settles on its own, rejects as soon as its signal aborts.
  function hangUntilAborted(fetchFn: ReturnType<typeof setup>['fetchFn']) {
    fetchFn.mockImplementation(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          const abort = () => {
            reject(new DOMException('Aborted', 'AbortError'));
          };
          if (init?.signal?.aborted) abort();
          else init?.signal?.addEventListener('abort', abort);
        }),
    );
  }

  it('gives up after the timeout with a typed error', async () => {
    vi.useFakeTimers();
    const { http, fetchFn } = setup({ timeoutMs: 5000 });
    hangUntilAborted(fetchFn);

    const request = http.get('/slow').catch((caught: unknown) => caught);
    await vi.advanceTimersByTimeAsync(5000);

    await expect(request).resolves.toMatchObject({ kind: 'timeout' });
  });

  it('lets a request override the default timeout', async () => {
    vi.useFakeTimers();
    const { http, fetchFn } = setup({ timeoutMs: 60_000 });
    hangUntilAborted(fetchFn);

    const request = http.get('/slow', { timeoutMs: 1000 }).catch((caught: unknown) => caught);
    await vi.advanceTimersByTimeAsync(1000);

    await expect(request).resolves.toMatchObject({ kind: 'timeout' });
  });

  it('passes a caller cancellation through untouched', async () => {
    const { http, fetchFn } = setup();
    hangUntilAborted(fetchFn);
    const controller = new AbortController();

    const request = http
      .get('/products', { signal: controller.signal })
      .catch((caught: unknown) => caught);
    controller.abort();

    const error = await request;
    expect(error).toBeInstanceOf(DOMException);
    expect(error).toMatchObject({ name: 'AbortError' });
  });

  it('rejects at once when the caller signal was already aborted', async () => {
    const { http, fetchFn } = setup();
    hangUntilAborted(fetchFn);
    const controller = new AbortController();
    controller.abort();

    await expect(http.get('/products', { signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});
