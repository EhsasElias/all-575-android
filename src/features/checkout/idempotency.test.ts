import { describe, expect, it } from 'vitest';
import { ApiError } from '@/shared/api';
import { createAttemptKeys, shouldRenewKey } from './idempotency';

const attempt = { quoteId: 'q1', slotId: 8, method: 'mada' } as const;

function counter() {
  let next = 0;
  return () => `key-${(next += 1)}`;
}

describe('createAttemptKeys', () => {
  it('gives the same key to the same quote, slot and method', () => {
    const keys = createAttemptKeys(counter());

    expect(keys.keyFor(attempt)).toBe('key-1');
    expect(keys.keyFor({ ...attempt })).toBe('key-1');
  });

  it.each([
    ['quote', { quoteId: 'q2' }],
    ['slot', { slotId: 9 }],
    ['method', { method: 'card' }],
  ] as const)('gives a new key when the %s changes', (_what, change) => {
    const keys = createAttemptKeys(counter());
    keys.keyFor(attempt);

    expect(keys.keyFor({ ...attempt, ...change })).toBe('key-2');
  });

  it('forgets the key on request', () => {
    const keys = createAttemptKeys(counter());
    keys.keyFor(attempt);
    keys.renew();

    expect(keys.keyFor(attempt)).toBe('key-2');
  });

  it('makes valid keys by default: 8 to 64 letters, digits, dashes or underscores', () => {
    const key = createAttemptKeys().keyFor(attempt);

    expect(key).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
  });
});

describe('shouldRenewKey', () => {
  const error = (init: ConstructorParameters<typeof ApiError>[0]) => new ApiError(init);

  it.each([
    ['no connection', error({ kind: 'network', message: 'x' })],
    ['a timeout', error({ kind: 'timeout', message: 'x' })],
    ['a server error without a reason', error({ kind: 'server', status: 500, message: 'x' })],
    ['too many requests', error({ kind: 'rate-limited', status: 429, message: 'x' })],
    ['a success we could not read', error({ kind: 'unexpected', status: 201, message: 'x' })],
    ['an answer we judged unusable', error({ kind: 'unexpected', message: 'x' })],
  ])('keeps the key after %s: the order may exist', (_what, failure) => {
    expect(shouldRenewKey(failure)).toBe(false);
  });

  it.each([
    [
      'a refusal with a code',
      error({ kind: 'unexpected', status: 409, code: 'slot_full', message: 'x' }),
    ],
    [
      'a provider failure that cancelled the order',
      error({ kind: 'server', status: 502, code: 'payment_provider_error', message: 'x' }),
    ],
    ['a validation error', error({ kind: 'validation', status: 422, message: 'x' })],
    ['a missing quote', error({ kind: 'not-found', status: 404, message: 'x' })],
    ['a failure of our own code', new Error('boom')],
  ])('renews the key after %s', (_what, failure) => {
    expect(shouldRenewKey(failure)).toBe(true);
  });
});
