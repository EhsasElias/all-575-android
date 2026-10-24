import { errorCode, isApiError } from '@/shared/api';
import { asInteger } from './json';

export const PROMO_CODES = [
  'promo_invalid',
  'promo_not_started',
  'promo_expired',
  'promo_min_subtotal',
  'promo_used_up',
  'promo_already_used',
] as const;

export type PromoCode = (typeof PROMO_CODES)[number];

export type PromoProblem =
  { code: PromoCode; minSubtotal: number | null } | { code: 'too_many_attempts' | 'failed' };

function isPromoCode(code: string | null): code is PromoCode {
  return PROMO_CODES.some((known) => known === code);
}

/** Why a promo code was not accepted, or null when the failure has nothing to do with the code. */
export function promoProblemFrom(error: unknown): PromoProblem | null {
  const code = errorCode(error);
  if (isPromoCode(code) && isApiError(error)) {
    return { code, minSubtotal: asInteger(error.details.min_subtotal) };
  }
  if (!isApiError(error)) return null;
  if (error.kind === 'rate-limited') return { code: 'too_many_attempts' };
  if ('promo_code' in error.fieldErrors) return { code: 'promo_invalid', minSubtotal: null };
  return code === null && error.kind === 'unexpected' ? { code: 'failed' } : null;
}

/** The code is only ever a short word; the server trims and upper-cases it, and so do we, so keys match. */
export function normalizePromoCode(raw: string): string {
  return raw.trim().toUpperCase();
}
