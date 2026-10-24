import type { Language } from '@/shared/i18n';
import { ApiError, createApiError } from './api-error';
import type { TokenStore } from './token-store';

const DEFAULT_TIMEOUT_MS = 15_000;
const TIMEOUT = Symbol('timeout');

type QueryValue = string | number | boolean | undefined;

export type RequestOptions = {
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
  timeoutMs?: number;
};

type SendOptions = RequestOptions & { body?: unknown };

export type HttpClient = {
  get: <T>(path: string, options?: RequestOptions) => Promise<T>;
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
  delete: <T>(path: string, options?: RequestOptions) => Promise<T>;
};

export type HttpClientConfig = {
  baseUrl: string;
  tokenStore: TokenStore;
  getLanguage: () => Language;
  timeoutMs?: number;
  /** Replaceable for tests. */
  fetchFn?: typeof fetch;
};

type RawResponse = { response: Response; text: string };

function buildUrl(baseUrl: string, path: string, query: RequestOptions['query']): string {
  const url = `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) params.set(key, String(value));
  }
  const search = params.toString();
  return search ? `${url}?${search}` : url;
}

function parseJson(text: string): unknown {
  if (text === '') return undefined;
  const parsed: unknown = JSON.parse(text);
  return parsed;
}

function tryParseJson(text: string): unknown {
  try {
    return parseJson(text);
  } catch {
    return undefined;
  }
}

/**
 * Runs one request and reads its body under a single deadline, so a stalled
 * body cannot hang the caller. A caller-initiated abort is rethrown untouched.
 */
async function sendWithTimeout(
  fetchFn: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number,
  callerSignal: AbortSignal | undefined,
): Promise<RawResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(TIMEOUT);
  }, timeoutMs);
  const forwardAbort = () => {
    controller.abort(callerSignal?.reason);
  };

  if (callerSignal?.aborted) forwardAbort();
  callerSignal?.addEventListener('abort', forwardAbort, { once: true });

  try {
    const response = await fetchFn(url, { ...init, signal: controller.signal });
    return { response, text: await response.text() };
  } catch (error) {
    if (controller.signal.reason === TIMEOUT) {
      throw new ApiError({ kind: 'timeout', message: `Request timed out after ${timeoutMs} ms` });
    }
    if (callerSignal?.aborted) throw error;
    throw new ApiError({ kind: 'network', message: 'The network request failed' });
  } finally {
    clearTimeout(timer);
    callerSignal?.removeEventListener('abort', forwardAbort);
  }
}

export function createHttpClient(config: HttpClientConfig): HttpClient {
  const fetchFn: typeof fetch = config.fetchFn ?? ((input, init) => fetch(input, init));
  const defaultTimeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  async function buildHeaders(hasBody: boolean): Promise<{ headers: Headers; hasToken: boolean }> {
    const headers = new Headers({
      Accept: 'application/json',
      'Accept-Language': config.getLanguage(),
    });
    if (hasBody) headers.set('Content-Type', 'application/json');
    const token = await config.tokenStore.get();
    if (token !== null) headers.set('Authorization', `Bearer ${token}`);
    return { headers, hasToken: token !== null };
  }

  async function request<T>(method: string, path: string, options: SendOptions): Promise<T> {
    const hasBody = options.body !== undefined;
    const { headers, hasToken } = await buildHeaders(hasBody);
    const { response, text } = await sendWithTimeout(
      fetchFn,
      buildUrl(config.baseUrl, path, options.query),
      { method, headers, ...(hasBody ? { body: JSON.stringify(options.body) } : {}) },
      options.timeoutMs ?? defaultTimeoutMs,
      options.signal,
    );

    if (!response.ok) {
      // An expired or revoked token is useless from now on; drop it.
      if (response.status === 401 && hasToken) await config.tokenStore.clear();
      throw createApiError({
        status: response.status,
        body: tryParseJson(text),
        retryAfter: response.headers.get('Retry-After'),
      });
    }

    try {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- The caller names the response type; the generated OpenAPI client will provide it per endpoint.
      return parseJson(text) as T;
    } catch {
      throw new ApiError({
        kind: 'unexpected',
        status: response.status,
        message: 'The server returned an invalid response',
      });
    }
  }

  return {
    get: (path, options = {}) => request('GET', path, options),
    post: (path, body, options = {}) => request('POST', path, { ...options, body }),
    put: (path, body, options = {}) => request('PUT', path, { ...options, body }),
    patch: (path, body, options = {}) => request('PATCH', path, { ...options, body }),
    delete: (path, options = {}) => request('DELETE', path, options),
  };
}
