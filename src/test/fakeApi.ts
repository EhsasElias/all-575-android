import { vi } from 'vitest';
import {
  createHttpClient,
  createMemoryTokenStore,
  type HttpClient,
  type TokenStore,
} from '@/shared/api';

type Reply = { status?: number; body?: unknown } | 'offline';

type FakeApi = {
  client: HttpClient;
  store: TokenStore;
  fetchFn: ReturnType<typeof vi.fn<typeof fetch>>;
  /** Every request made so far, as "METHOD /path". */
  requests: () => string[];
};

/**
 * A real HTTP client talking to a scripted server, so tests exercise the same code the app runs.
 * `routes` maps "METHOD /path" to the reply; anything unscripted answers 404.
 */
export function fakeApi(routes: Record<string, Reply> = {}): FakeApi {
  const store = createMemoryTokenStore();
  const fetchFn = vi.fn<typeof fetch>((input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const key = `${init?.method ?? 'GET'} ${url.pathname.replace(/^\/api\/v1/, '')}`;
    const reply = routes[key] ?? { status: 404, body: { message: 'Not found' } };
    if (reply === 'offline') return Promise.reject(new TypeError('Failed to fetch'));
    return Promise.resolve(
      new Response(reply.body === undefined ? null : JSON.stringify(reply.body), {
        status: reply.status ?? 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });
  const client = createHttpClient({
    baseUrl: 'https://api.example.test/api/v1',
    tokenStore: store,
    getLanguage: () => 'en',
    fetchFn,
  });
  const requests = () =>
    fetchFn.mock.calls.map(([input, init]) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      return `${init?.method ?? 'GET'} ${url.pathname.replace(/^\/api\/v1/, '')}`;
    });

  return { client, store, fetchFn, requests };
}
