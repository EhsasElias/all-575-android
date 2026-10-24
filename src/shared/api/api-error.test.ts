import { describe, expect, it } from 'vitest';
import { createApiError, isApiError, parseRetryAfter } from './api-error';

describe('parseRetryAfter', () => {
  it('reads a number of seconds', () => {
    expect(parseRetryAfter('30')).toBe(30);
    expect(parseRetryAfter('0')).toBe(0);
  });

  it('reads an HTTP date relative to now', () => {
    const now = Date.parse('2026-10-24T12:00:00Z');
    expect(parseRetryAfter('Sat, 24 Oct 2026 12:01:00 GMT', now)).toBe(60);
    expect(parseRetryAfter('Sat, 24 Oct 2026 11:00:00 GMT', now)).toBe(0);
  });

  it.each([null, '', '  ', 'soon'])('returns null for %j', (header) => {
    expect(parseRetryAfter(header)).toBeNull();
  });
});

describe('createApiError', () => {
  it.each([
    [401, 'unauthenticated'],
    [403, 'forbidden'],
    [404, 'not-found'],
    [422, 'validation'],
    [429, 'rate-limited'],
    [500, 'server'],
    [503, 'server'],
    [409, 'unexpected'],
  ] as const)('maps status %i to %s', (status, kind) => {
    const error = createApiError({ status, body: undefined, retryAfter: null });
    expect(error.kind).toBe(kind);
    expect(error.status).toBe(status);
    expect(isApiError(error)).toBe(true);
  });

  it('keeps the server message and the Laravel field errors', () => {
    const error = createApiError({
      status: 422,
      body: {
        message: 'The phone field is required.',
        errors: { phone: ['The phone field is required.'], code: ['Too short', 'Digits only'] },
      },
      retryAfter: null,
    });

    expect(error.message).toBe('The phone field is required.');
    expect(error.fieldErrors).toEqual({
      phone: ['The phone field is required.'],
      code: ['Too short', 'Digits only'],
    });
  });

  it('falls back to a generic message and ignores malformed bodies', () => {
    const error = createApiError({
      status: 500,
      body: { message: 42, errors: { phone: 'not a list', code: ['ok', 7] } },
      retryAfter: null,
    });

    expect(error.message).toBe('Request failed with status 500');
    expect(error.fieldErrors).toEqual({ code: ['ok'] });
  });

  it('exposes Retry-After only for 429', () => {
    expect(createApiError({ status: 429, body: {}, retryAfter: '45' }).retryAfterSeconds).toBe(45);
    expect(
      createApiError({ status: 503, body: {}, retryAfter: '45' }).retryAfterSeconds,
    ).toBeNull();
    expect(
      createApiError({ status: 429, body: {}, retryAfter: null }).retryAfterSeconds,
    ).toBeNull();
  });
});
