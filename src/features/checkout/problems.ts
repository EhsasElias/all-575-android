import { errorCode, isApiError } from '@/shared/api';
import { readQuote, type Quote } from './quote';

/** The refusals of `POST /checkout` (and of the quote request) that have a message and a next step of their own. */
export const REFUSALS = [
  'quote_expired',
  'quote_not_found',
  'cart_has_unavailable_items',
  'out_of_stock',
  'slot_full',
  'slot_too_soon',
  'slot_invalid',
  'payments_unavailable',
  'payment_provider_error',
  'cart_empty',
  'address_not_serviceable',
  'address_missing',
  'idempotency_key_reused',
  'checkout_conflict',
] as const;

export type RefusalCode = (typeof REFUSALS)[number];

export type CheckoutProblem =
  /** The prices changed since the customer looked: the fresh quote is shown and must be confirmed again. */
  | { kind: 'quote_changed'; quote: Quote }
  | { kind: 'refused'; code: RefusalCode }
  /** No answer came back: the order may or may not exist, and retrying with the same key is safe. */
  | { kind: 'offline' }
  | { kind: 'failed' };

export function isRefusal(code: string | null): code is RefusalCode {
  return REFUSALS.some((refusal) => refusal === code);
}

export function problemFromError(error: unknown): CheckoutProblem {
  const code = errorCode(error);
  if (code === 'quote_changed' && isApiError(error)) {
    const quote = readQuote(error.details.quote);
    // Without a usable fresh quote the safest next step is to ask for a new one.
    return quote ? { kind: 'quote_changed', quote } : { kind: 'refused', code: 'quote_expired' };
  }
  if (isRefusal(code)) return { kind: 'refused', code };
  if (isApiError(error) && (error.kind === 'network' || error.kind === 'timeout')) {
    return { kind: 'offline' };
  }
  return { kind: 'failed' };
}

/** What the screen has to do besides showing the message. */
export type Recovery = 'refresh-quote' | 'refresh-slots' | 'refresh-addresses' | 'none';

const RECOVERY: Record<RefusalCode, Recovery> = {
  quote_expired: 'refresh-quote',
  quote_not_found: 'refresh-quote',
  cart_has_unavailable_items: 'refresh-quote',
  out_of_stock: 'refresh-quote',
  slot_full: 'refresh-slots',
  slot_too_soon: 'refresh-slots',
  slot_invalid: 'refresh-slots',
  address_missing: 'refresh-addresses',
  payments_unavailable: 'none',
  payment_provider_error: 'none',
  cart_empty: 'none',
  address_not_serviceable: 'none',
  idempotency_key_reused: 'none',
  checkout_conflict: 'none',
};

export function recoveryFor(problem: CheckoutProblem): Recovery {
  return problem.kind === 'refused' ? RECOVERY[problem.code] : 'none';
}

/** The links a refusal needs next to its message. */
export type ProblemLink = 'cart' | 'address';

const LINKS: Record<RefusalCode, ProblemLink[]> = {
  cart_has_unavailable_items: ['cart'],
  out_of_stock: ['cart'],
  cart_empty: ['cart'],
  address_not_serviceable: ['address'],
  address_missing: ['address'],
  quote_expired: [],
  quote_not_found: [],
  slot_full: [],
  slot_too_soon: [],
  slot_invalid: [],
  payments_unavailable: [],
  payment_provider_error: [],
  idempotency_key_reused: [],
  checkout_conflict: [],
};

export function linksFor(problem: CheckoutProblem): ProblemLink[] {
  return problem.kind === 'refused' ? LINKS[problem.code] : [];
}
