import { describe, expect, it } from 'vitest';
import { ApiError } from '@/shared/api';
import { refusalFromError } from './cartRefusal';

const refusedWith = (code: string, status = 422) =>
  new ApiError({
    kind: status === 404 ? 'not-found' : 'validation',
    status,
    message: 'server text',
    code,
  });

describe('why a cart request failed', () => {
  it.each(['quantity_out_of_range', 'variant_unavailable', 'cart_full'] as const)(
    'recognises the %s refusal by its code',
    (code) => {
      expect(refusalFromError(refusedWith(code))).toBe(code);
    },
  );

  it('uses the code, not the message', () => {
    const error = new ApiError({
      kind: 'validation',
      status: 422,
      message: 'This product is not available.',
      code: 'quantity_out_of_range',
    });

    expect(refusalFromError(error)).toBe('quantity_out_of_range');
  });

  it('calls a lost connection and a timeout "network"', () => {
    expect(refusalFromError(new ApiError({ kind: 'network', message: 'x' }))).toBe('network');
    expect(refusalFromError(new ApiError({ kind: 'timeout', message: 'x' }))).toBe('network');
  });

  it('calls a rejected token "session_expired"', () => {
    const error = new ApiError({ kind: 'unauthenticated', status: 401, message: 'x' });

    expect(refusalFromError(error)).toBe('session_expired');
  });

  it.each([
    ['an unknown business code', refusedWith('something_new')],
    ['a plain server error', new ApiError({ kind: 'server', status: 500, message: 'x' })],
    ['a code named like an object property', refusedWith('constructor')],
    ['something that is not an API error', new Error('boom')],
    ['a string', 'quantity_out_of_range'],
  ])('falls back to "unknown" for %s', (_name, error) => {
    expect(refusalFromError(error)).toBe('unknown');
  });
});
