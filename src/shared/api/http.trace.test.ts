import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHttpClient } from './http';
import { clearTrace, getTraceSnapshot, requestTracer } from './requestTrace';
import { TOKEN_READ_TIMEOUT_MS, type TokenStore } from './token-store';

const json = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

function client(options: { fetchFn: typeof fetch; get?: TokenStore['get'] }) {
  const tokenStore: TokenStore = {
    get: options.get ?? (() => Promise.resolve(null)),
    set: () => Promise.resolve(),
    clear: () => Promise.resolve(),
  };
  return createHttpClient({
    baseUrl: 'https://api.example.test/api/v1',
    tokenStore,
    getLanguage: () => 'en',
    fetchFn: options.fetchFn,
    trace: requestTracer,
  });
}

afterEach(() => {
  clearTrace();
  vi.useRealTimers();
});

describe('http client: the request trace', () => {
  it('records a request that succeeded, with its path and no query', async () => {
    const http = client({ fetchFn: () => json(200, { data: [] }) });

    await http.get('/categories', { query: { page: 2 } });

    expect(getTraceSnapshot()).toMatchObject([
      { method: 'GET', path: '/categories', stage: 'done', detail: '200' },
    ]);
  });

  it('records a refusal with its kind and status, not its message', async () => {
    const http = client({ fetchFn: () => json(500, { message: 'secret detail' }) });

    await expect(http.get('/products')).rejects.toBeDefined();

    const [entry] = getTraceSnapshot();
    expect(entry).toMatchObject({ path: '/products', stage: 'failed' });
    expect(entry?.detail).toContain('500');
    expect(entry?.detail).not.toContain('secret');
  });

  it('records a request that never reached the server', async () => {
    const http = client({ fetchFn: () => Promise.reject(new TypeError('Failed to fetch')) });

    await expect(http.get('/store')).rejects.toBeDefined();

    expect(getTraceSnapshot()[0]).toMatchObject({ stage: 'failed', detail: 'network' });
  });

  it('stays "preparing" while the token is being read, so a stuck keystore is visible', async () => {
    vi.useFakeTimers();
    const fetchFn = vi.fn<typeof fetch>(() => json(200, {}));
    const http = client({ fetchFn, get: () => new Promise<never>(() => undefined) });

    const pending = http.get('/store');
    await vi.advanceTimersByTimeAsync(TOKEN_READ_TIMEOUT_MS - 1_000);

    expect(getTraceSnapshot()[0]).toMatchObject({ stage: 'preparing' });
    expect(fetchFn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1_000);
    await pending;
  });

  it('sends the request without a token when secure storage never answers, and says why', async () => {
    vi.useFakeTimers();
    let answer: (response: Response) => void = () => undefined;
    const fetchFn = vi.fn<typeof fetch>(
      () =>
        new Promise<Response>((resolve) => {
          answer = resolve;
        }),
    );
    const http = client({ fetchFn, get: () => new Promise<never>(() => undefined) });

    const pending = http.get('/categories');
    await vi.advanceTimersByTimeAsync(TOKEN_READ_TIMEOUT_MS);

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const sent = new Headers(fetchFn.mock.calls[0]?.[1]?.headers);
    expect(sent.has('Authorization')).toBe(false);
    expect(getTraceSnapshot()[0]).toMatchObject({
      stage: 'sending',
      note: 'secure storage timeout',
    });

    answer(new Response('{"data":[]}', { status: 200 }));
    await expect(pending).resolves.toEqual({ data: [] });
  });

  it('notes what the browser said when a request never reached the server', async () => {
    const http = client({
      fetchFn: () =>
        Promise.reject(new TypeError('Failed to fetch: net::ERR_CLEARTEXT_NOT_PERMITTED')),
    });

    await expect(http.get('/store')).rejects.toBeDefined();

    expect(getTraceSnapshot()[0]).toMatchObject({
      detail: 'network',
      note: 'TypeError: Failed to fetch: net::ERR_CLEARTEXT_NOT_PERMITTED',
    });
  });

  it('notes the start of an answer that is not JSON, with its content type', async () => {
    const http = client({
      fetchFn: () =>
        Promise.resolve(
          new Response('<!doctype html>\n<html>   <head>', {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
          }),
        ),
    });

    await expect(http.get('/store')).rejects.toBeDefined();

    expect(getTraceSnapshot()[0]).toMatchObject({
      detail: 'unexpected 200',
      note: 'reply text/html: "<!doctype html> <html> <head>"',
    });
  });

  it('notes the error of a request that was cancelled by the caller', async () => {
    const controller = new AbortController();
    const http = client({
      fetchFn: (_input, init) =>
        // Like the real fetch: a signal that is already aborted rejects at once.
        init?.signal?.aborted
          ? Promise.reject(new DOMException('The user aborted a request.', 'AbortError'))
          : new Promise<Response>(() => undefined),
    });

    const pending = http.get('/categories', { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toBeDefined();

    expect(getTraceSnapshot()[0]).toMatchObject({
      detail: 'error',
      note: 'AbortError: The user aborted a request.',
    });
  });

  it('keeps working without a trace', async () => {
    const http = createHttpClient({
      baseUrl: 'https://api.example.test/api/v1',
      tokenStore: {
        get: () => Promise.resolve(null),
        set: () => Promise.resolve(),
        clear: () => Promise.resolve(),
      },
      getLanguage: () => 'en',
      fetchFn: () => json(200, { ok: true }),
    });

    await expect(http.get('/store')).resolves.toEqual({ ok: true });
    expect(getTraceSnapshot()).toEqual([]);
  });
});
