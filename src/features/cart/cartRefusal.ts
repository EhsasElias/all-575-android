import { errorCode, isApiError, type ApiErrorKind } from '@/shared/api';
import type { CartRefusal } from './cartTypes';

/** The business codes the cart endpoints answer with that the app explains in its own words. */
const REFUSALS_BY_CODE: Readonly<Record<string, CartRefusal>> = {
  quantity_out_of_range: 'quantity_out_of_range',
  variant_unavailable: 'variant_unavailable',
  cart_full: 'cart_full',
};

const REFUSALS_BY_KIND: Readonly<Partial<Record<ApiErrorKind, CartRefusal>>> = {
  network: 'network',
  timeout: 'network',
  unauthenticated: 'session_expired',
};

/** Turns a failed cart request into a reason a screen can explain. Looks at the business `code`, never the text. */
export function refusalFromError(error: unknown): CartRefusal {
  const code = errorCode(error);
  if (code !== null && Object.hasOwn(REFUSALS_BY_CODE, code)) {
    return REFUSALS_BY_CODE[code] ?? 'unknown';
  }
  return (isApiError(error) ? REFUSALS_BY_KIND[error.kind] : undefined) ?? 'unknown';
}

/**
 * A refusal that asking again will not change (the request itself is wrong), as opposed to a bad connection, a
 * server error, a refused session or a rate limit, which are worth another try.
 */
export function isPermanentRefusal(error: unknown): boolean {
  if (!isApiError(error) || error.status === null) return false;
  const retryable = [401, 408, 429].includes(error.status);
  return error.status >= 400 && error.status < 500 && !retryable;
}
