import { describe, expect, it } from 'vitest';
import { ApiError } from '@/shared/api';
import { classifyAuthFailure } from './authFailure';

function refusal(code: string, status: number, details: Record<string, unknown> = {}) {
  return new ApiError({
    kind: status === 429 ? 'rate-limited' : 'validation',
    status,
    message: 'raw server wording',
    code,
    details,
  });
}

describe('classifyAuthFailure', () => {
  it('reads the attempts left from a wrong code', () => {
    expect(classifyAuthFailure(refusal('otp_invalid', 422, { attempts_remaining: 3 }))).toEqual({
      kind: 'otp-invalid',
      attemptsRemaining: 3,
    });
  });

  it('copes with a wrong code that does not say how many attempts are left', () => {
    expect(
      classifyAuthFailure(refusal('otp_invalid', 422, { attempts_remaining: 'many' })),
    ).toEqual({
      kind: 'otp-invalid',
      attemptsRemaining: null,
    });
  });

  it.each([
    ['otp_expired', { kind: 'otp-expired' }],
    ['otp_locked', { kind: 'otp-locked' }],
    ['account_inactive', { kind: 'account-inactive' }],
  ])('maps %s', (code, expected) => {
    expect(classifyAuthFailure(refusal(code, 422))).toEqual(expected);
  });

  it('takes the cooldown from the Retry-After header first, then from the body', () => {
    const withHeader = new ApiError({
      kind: 'rate-limited',
      status: 429,
      message: 'x',
      code: 'otp_cooldown',
      retryAfterSeconds: 42,
      details: { retry_after: 59 },
    });

    expect(classifyAuthFailure(withHeader)).toEqual({
      kind: 'otp-cooldown',
      retryAfterSeconds: 42,
    });
    expect(classifyAuthFailure(refusal('otp_cooldown', 429, { retry_after: 59 }))).toEqual({
      kind: 'otp-cooldown',
      retryAfterSeconds: 59,
    });
  });

  it('maps a plain 429 to a rate limit with its wait', () => {
    const throttled = new ApiError({
      kind: 'rate-limited',
      status: 429,
      message: 'Too Many Attempts.',
      retryAfterSeconds: 25,
    });

    expect(classifyAuthFailure(throttled)).toEqual({ kind: 'rate-limited', retryAfterSeconds: 25 });
  });

  it.each(['network', 'timeout'] as const)('treats a %s failure as being offline', (kind) => {
    expect(classifyAuthFailure(new ApiError({ kind, message: 'x' }))).toEqual({ kind: 'offline' });
  });

  it('points a field error at the field it came from', () => {
    const field = (name: string) =>
      new ApiError({
        kind: 'validation',
        status: 422,
        message: 'x',
        fieldErrors: { [name]: ['raw server wording'] },
      });

    expect(classifyAuthFailure(field('destination'))).toEqual({
      kind: 'field',
      field: 'destination',
    });
    expect(classifyAuthFailure(field('code'))).toEqual({ kind: 'field', field: 'code' });
    expect(classifyAuthFailure(field('challenge_id'))).toEqual({ kind: 'otp-expired' });
    expect(classifyAuthFailure(field('something_else'))).toEqual({ kind: 'unknown' });
  });

  it.each([
    new ApiError({ kind: 'server', status: 500, message: 'x' }),
    new ApiError({ kind: 'unexpected', status: 418, message: 'x' }),
    new Error('boom'),
    'a string',
  ])('falls back to unknown for %s', (error) => {
    expect(classifyAuthFailure(error)).toEqual({ kind: 'unknown' });
  });
});
