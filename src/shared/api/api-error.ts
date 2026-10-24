export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'unauthenticated'
  | 'forbidden'
  | 'not-found'
  | 'validation'
  | 'rate-limited'
  | 'server'
  | 'unexpected';

/** Laravel validation errors: field name to the list of messages for that field. */
export type FieldErrors = Record<string, string[]>;

type ApiErrorInit = {
  kind: ApiErrorKind;
  message: string;
  status?: number;
  fieldErrors?: FieldErrors;
  retryAfterSeconds?: number;
  code?: string;
  details?: Readonly<Record<string, unknown>>;
};

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly fieldErrors: FieldErrors;
  /** Only set for 429 responses that carry a Retry-After header. */
  readonly retryAfterSeconds: number | null;
  /** The server's machine-readable reason for a business refusal (`otp_invalid`, `quote_expired`, ...). Screens switch on this. */
  readonly code: string | null;
  /** Extra fields that came with the refusal (`attempts_remaining`, a fresh `quote`, ...). Unvalidated: narrow before use. */
  readonly details: Readonly<Record<string, unknown>>;

  constructor({
    kind,
    message,
    status,
    fieldErrors,
    retryAfterSeconds,
    code,
    details,
  }: ApiErrorInit) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status ?? null;
    this.fieldErrors = fieldErrors ?? {};
    this.retryAfterSeconds = retryAfterSeconds ?? null;
    this.code = code ?? null;
    this.details = details ?? {};
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function readFieldErrors(value: unknown): FieldErrors {
  if (!isRecord(value)) return {};
  const fieldErrors: FieldErrors = {};
  for (const [field, messages] of Object.entries(value)) {
    if (Array.isArray(messages)) fieldErrors[field] = messages.filter(isString);
  }
  return fieldErrors;
}

/** Retry-After is either a number of seconds or an HTTP date. */
export function parseRetryAfter(header: string | null, now: number = Date.now()): number | null {
  if (!header?.trim()) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);
  const date = Date.parse(header);
  return Number.isNaN(date) ? null : Math.max(0, Math.ceil((date - now) / 1000));
}

function kindForStatus(status: number): ApiErrorKind {
  if (status === 401) return 'unauthenticated';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status === 422) return 'validation';
  if (status === 429) return 'rate-limited';
  return status >= 500 ? 'server' : 'unexpected';
}

type ErrorResponse = {
  status: number;
  body: unknown;
  retryAfter: string | null;
};

/** Maps an error response, including Laravel's `{ message, errors }` body, to an ApiError. */
export function createApiError({ status, body, retryAfter }: ErrorResponse): ApiError {
  const kind = kindForStatus(status);
  const serverMessage = isRecord(body) && isString(body.message) ? body.message : null;
  const retryAfterSeconds = kind === 'rate-limited' ? parseRetryAfter(retryAfter) : null;

  const code = isRecord(body) && isString(body.code) ? body.code : null;

  return new ApiError({
    kind,
    status,
    message: serverMessage ?? `Request failed with status ${status}`,
    fieldErrors: isRecord(body) ? readFieldErrors(body.errors) : {},
    details: readDetails(body),
    ...(retryAfterSeconds === null ? {} : { retryAfterSeconds }),
    ...(code === null ? {} : { code }),
  });
}

const ENVELOPE_KEYS = new Set(['message', 'errors', 'code']);

function readDetails(body: unknown): Record<string, unknown> {
  if (!isRecord(body)) return {};
  return Object.fromEntries(Object.entries(body).filter(([key]) => !ENVELOPE_KEYS.has(key)));
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

/** The business reason of a failed request, or null for anything else (network trouble, a bug, a plain 404). */
export function errorCode(error: unknown): string | null {
  return isApiError(error) ? error.code : null;
}
