import type { Language } from '@/shared/i18n';
import { ApiError, createApiError } from './api-error';
import type { RequestTrace, RequestTracer } from './requestTrace';
import { describeFailure, describeReply } from './traceDetails';
import { readToken, type TokenStore } from './token-store';

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
  /** Set in a test build only: records each request so a tester can see where one is stuck. */
  trace?: RequestTracer;
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
    throw new ApiError({ kind: 'network', message: 'The network request failed', cause: error });
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
    onStorageProblem?: (problem: string) => void,
  ): Promise<{ headers: Headers; token: string | null }> {
    const headers = new Headers({ Accept: 'application/json', ...extra });
    headers.set('Accept-Language', config.getLanguage());
    if (hasBody) headers.set('Content-Type', 'application/json');
    headers.delete('Authorization');
    const token = await readToken(config.tokenStore, onStorageProblem);
    if (token !== null) headers.set('Authorization', `Bearer ${token}`);
    return { headers, token };
  }

  async function request<T>(method: string, path: string, options: SendOptions): Promise<T> {
    const trace = config.trace?.begin(method, path);
    try {
      return await send<T>(method, path, options, trace);
    } catch (error) {
      const { reason, note } = describeFailure(error);
      if (note !== '') trace?.note(note);
      trace?.failed(reason);
      throw error;
    }
  }

  async function send<T>(
    method: string,
    path: string,
    options: SendOptions,
    trace: RequestTrace | undefined,
  ): Promise<T> {
    const hasBody = options.body !== undefined;
    const { headers, token } = await buildHeaders(hasBody, options.headers, (problem) => {
      trace?.note(`secure storage ${problem}`);
    });
    trace?.sending();
    const { response, body: text } = await sendWithTimeout(
      fetchFn,
      buildUrl(config.baseUrl, path, options.query),
      { method, headers, ...(hasBody ? { body: JSON.stringify(options.body) } : {}) },
      options.timeoutMs ?? defaultTimeoutMs,
      options.signal,
      (res) => res.text(),
    );

    if (!response.ok) await rejectWith(response, text, token);

    try {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- The caller names the response type; the generated OpenAPI client will provide it per endpoint.
      const parsed = parseJson(text) as T;
      trace?.done(response.status);
      return parsed;
    } catch {
      trace?.note(describeReply(response, text));
      throw new ApiError({
        kind: 'unexpected',
        status: response.status,
        message: 'The server returned an invalid response',
      });
    }
  }

  async function download(path: string, options: RequestOptions): Promise<Download> {
    const { headers, token } = await buildHeaders(false, options.headers);
    headers.set('Accept', '*/*');
    const { response, body: blob } = await sendWithTimeout(
      fetchFn,
      buildUrl(config.baseUrl, path, options.query),
      { method: 'GET', headers },
      options.timeoutMs ?? defaultTimeoutMs,
      options.signal,
      (res) => res.blob(),
    );

    if (!response.ok) await rejectWith(response, await blob.text(), token);
    return { blob, filename: readFilename(response.headers.get('Content-Disposition')) };
  }

  /**
   * An expired or revoked token is useless from now on: drop it and tell the app. But only the token this request
   * carried. If the customer signed in again while it was on its way, the new token is not the one that was refused.
   */
  async function dropRefusedToken(sentToken: string): Promise<void> {
    try {
      if ((await config.tokenStore.get()) !== sentToken) return;
      await config.tokenStore.clear();
    } catch {
      // Storage trouble must not hide the real answer. The customer is signed out either way, and the next start
      // asks the server about the leftover token again.
    }
    config.onUnauthorized?.();
  }

  async function rejectWith(
    response: Response,
    text: string,
    sentToken: string | null,
  ): Promise<never> {
    if (response.status === 401 && sentToken !== null) await dropRefusedToken(sentToken);
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
