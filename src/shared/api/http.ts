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
  /** Extra request headers, e.g. `Idempotency-Key`. They can never replace the language or the bearer token. */
  headers?: Record<string, string>;
};

type SendOptions = RequestOptions & { body?: unknown };

export type HttpClient = {
  get: <T>(path: string, options?: RequestOptions) => Promise<T>;
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
  delete: <T>(path: string, options?: RequestOptions) => Promise<T>;
  /** GET a file (e.g. a CSV export) as raw bytes, so nothing like a byte-order mark is lost on the way. */
  download: (path: string, options?: RequestOptions) => Promise<Download>;
};

export type Download = { blob: Blob; filename: string | null };

export type HttpClientConfig = {
  baseUrl: string;
  tokenStore: TokenStore;
  getLanguage: () => Language;
  /** Called after a request that carried a token was answered 401, once the token has been dropped. */
  onUnauthorized?: () => void;
  timeoutMs?: number;
  /** Replaceable for tests. */
  fetchFn?: typeof fetch;
};

type RawResponse<Body> = { response: Response; body: Body };

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

function readFilename(contentDisposition: string | null): string | null {
  const match = /filename="?([^";]+)"?/i.exec(contentDisposition ?? '');
  return match?.[1] ?? null;
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
async function sendWithTimeout<Body>(
  fetchFn: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number,
  callerSignal: AbortSignal | undefined,
  readBody: (response: Response) => Promise<Body>,
): Promise<RawResponse<Body>> {
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
    return { response, body: await readBody(response) };
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

  async function buildHeaders(
    hasBody: boolean,
    extra: Record<string, string> = {},
  ): Promise<{ headers: Headers; hasToken: boolean }> {
    const headers = new Headers({ Accept: 'application/json', ...extra });
    headers.set('Accept-Language', config.getLanguage());
    if (hasBody) headers.set('Content-Type', 'application/json');
    headers.delete('Authorization');
    const token = await config.tokenStore.get();
    if (token !== null) headers.set('Authorization', `Bearer ${token}`);
    return { headers, hasToken: token !== null };
  }

  async function request<T>(method: string, path: string, options: SendOptions): Promise<T> {
    const hasBody = options.body !== undefined;
    const { headers, hasToken } = await buildHeaders(hasBody, options.headers);
    const { response, body: text } = await sendWithTimeout(
      fetchFn,
      buildUrl(config.baseUrl, path, options.query),
      { method, headers, ...(hasBody ? { body: JSON.stringify(options.body) } : {}) },
      options.timeoutMs ?? defaultTimeoutMs,
      options.signal,
      (res) => res.text(),
    );

    if (!response.ok) await rejectWith(response, text, hasToken);

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

  async function download(path: string, options: RequestOptions): Promise<Download> {
    const { headers, hasToken } = await buildHeaders(false, options.headers);
    headers.set('Accept', '*/*');
    const { response, body: blob } = await sendWithTimeout(
      fetchFn,
      buildUrl(config.baseUrl, path, options.query),
      { method: 'GET', headers },
      options.timeoutMs ?? defaultTimeoutMs,
      options.signal,
      (res) => res.blob(),
    );

    if (!response.ok) await rejectWith(response, await blob.text(), hasToken);
    return { blob, filename: readFilename(response.headers.get('Content-Disposition')) };
  }

  async function rejectWith(response: Response, text: string, hasToken: boolean): Promise<never> {
    // An expired or revoked token is useless from now on; drop it.
    if (response.status === 401 && hasToken) {
      await config.tokenStore.clear();
      config.onUnauthorized?.();
    }
    throw createApiError({
      status: response.status,
      body: tryParseJson(text),
      retryAfter: response.headers.get('Retry-After'),
    });
  }

  return {
    get: (path, options = {}) => request('GET', path, options),
    post: (path, body, options = {}) => request('POST', path, { ...options, body }),
    put: (path, body, options = {}) => request('PUT', path, { ...options, body }),
    patch: (path, body, options = {}) => request('PATCH', path, { ...options, body }),
    delete: (path, options = {}) => request('DELETE', path, options),
    download: (path, options = {}) => download(path, options),
  };
}
