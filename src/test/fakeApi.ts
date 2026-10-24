import { vi } from 'vitest';
import {
  createHttpClient,
  createMemoryTokenStore,
  type HttpClient,
  type TokenStore,
} from '@/shared/api';

export type FakeRequest = {
  method: string;
  /** Path below the API base, e.g. "/orders/7". */
  path: string;
  query: URLSearchParams;
  headers: Headers;
  /** The JSON body that was sent, or undefined. */
  body: unknown;
  /** Values of `:param` segments in the matched route key. */
  params: Record<string, string>;
};

type Reply = { status?: number; body?: unknown; headers?: Record<string, string> } | 'offline';
type Handler = Reply | ((request: FakeRequest) => Reply);

/** Keys are "METHOD /path"; `:name` segments match any value, e.g. "GET /orders/:id". */
export type FakeRoutes = Record<string, Handler>;

const API_PREFIX = /^\/api\/v1/;

function matchKey(
  routes: FakeRoutes,
  method: string,
  path: string,
): { handler: Handler; params: Record<string, string> } | null {
  const exact = routes[`${method} ${path}`];
  if (exact !== undefined) return { handler: exact, params: {} };

  const parts = path.split('/');
  for (const [key, handler] of Object.entries(routes)) {
    const [keyMethod, keyPath] = key.split(' ');
    if (keyMethod !== method || keyPath === undefined) continue;
    const keyParts = keyPath.split('/');
    if (keyParts.length !== parts.length) continue;
    const params: Record<string, string> = {};
    const matches = keyParts.every((part, index) => {
      const actual = parts[index] ?? '';
      if (!part.startsWith(':')) return part === actual;
      params[part.slice(1)] = decodeURIComponent(actual);
      return true;
    });
    if (matches) return { handler, params };
  }
  return null;
}

function readBody(init: RequestInit | undefined): unknown {
  if (typeof init?.body !== 'string') return undefined;
  try {
    const parsed: unknown = JSON.parse(init.body);
    return parsed;
  } catch {
    return undefined;
  }
}

function toRequest(
  input: Parameters<typeof fetch>[0],
  init: RequestInit | undefined,
): Omit<FakeRequest, 'params'> {
  const url = new URL(input instanceof Request ? input.url : String(input), 'http://localhost');
  return {
    method: init?.method ?? 'GET',
    path: url.pathname.replace(API_PREFIX, ''),
    query: url.searchParams,
    headers: new Headers(init?.headers),
    body: readBody(init),
  };
}

function createResponder(routes: FakeRoutes) {
  const seen: Omit<FakeRequest, 'params'>[] = [];
  const fetchFn = vi.fn<typeof fetch>((input, init) => {
    const request = toRequest(input, init);
    seen.push(request);
    const match = matchKey(routes, request.method, request.path);
    const raw = match?.handler ?? { status: 404, body: { message: 'Not found' } };
    const reply =
      typeof raw === 'function' ? raw({ ...request, params: match?.params ?? {} }) : raw;
    if (reply === 'offline') return Promise.reject(new TypeError('Failed to fetch'));
    return Promise.resolve(
      new Response(reply.body === undefined ? null : JSON.stringify(reply.body), {
        status: reply.status ?? 200,
        headers: { 'Content-Type': 'application/json', ...reply.headers },
      }),
    );
  });
  return {
    fetchFn,
    /** Every request made so far, as "METHOD /path". */
    requests: () => seen.map((request) => `${request.method} ${request.path}`),
    /** Every request made so far, with query, headers and body. */
    calls: () => [...seen],
  };
}

type FakeApi = ReturnType<typeof createResponder> & {
  client: HttpClient;
  store: TokenStore;
};

/**
 * A real HTTP client talking to a scripted server, so tests exercise the same code the app runs.
 * Anything unscripted answers 404.
 */
export function fakeApi(routes: FakeRoutes = {}): FakeApi {
  const store = createMemoryTokenStore();
  const responder = createResponder(routes);
  const client = createHttpClient({
    baseUrl: 'https://api.example.test/api/v1',
    tokenStore: store,
    getLanguage: () => 'en',
    fetchFn: responder.fetchFn,
  });
  return { ...responder, client, store };
}

/**
 * Scripts the server for the app's own `http` client (the one screens use) by replacing the global `fetch`.
 * It is undone after every test by the shared setup.
 */
export function installFakeApi(routes: FakeRoutes = {}) {
  const responder = createResponder(routes);
  vi.stubGlobal('fetch', responder.fetchFn);
  return responder;
}
