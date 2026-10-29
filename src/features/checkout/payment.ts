import type { Schemas } from '@/shared/api';
import { asInteger, asString, isRecord } from './json';

export type Payment = Schemas['PaymentResource'];
export type PaymentStatus = Schemas['PaymentStatus'];
/** The methods a customer can pick; `none` only appears on an order a promo code covered completely. */
export type PayMethod = Exclude<Schemas['PaymentMethod'], 'none'>;

export const PAY_METHODS = [
  'mada',
  'card',
  'apple_pay',
  'cash_on_delivery',
] as const satisfies readonly PayMethod[];

const STATUSES = [
  'pending',
  'paid',
  'failed',
  'expired',
] as const satisfies readonly PaymentStatus[];
const METHODS = [...PAY_METHODS, 'none'] as const satisfies readonly Payment['method'][];

function nullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isPaymentStatus(value: unknown): value is PaymentStatus {
  return STATUSES.some((status) => status === value);
}

function isPaymentMethod(value: unknown): value is Payment['method'] {
  return METHODS.some((method) => method === value);
}

function isAction(value: unknown): value is Payment['action'] {
  return (
    value === null ||
    (isRecord(value) && nullableString(value.redirect_url) && nullableString(value.client_secret))
  );
}

/** A payment as the API describes it. Checked at the boundary because the status decides where the customer goes next. */
export function isPayment(value: unknown): value is Payment {
  return (
    isRecord(value) &&
    asString(value.id) !== null &&
    asString(value.order_id) !== null &&
    isPaymentStatus(value.status) &&
    isPaymentMethod(value.method) &&
    asInteger(value.amount) !== null &&
    asString(value.currency) !== null &&
    asString(value.expires_at) !== null &&
    nullableString(value.paid_at) &&
    nullableString(value.failure_code) &&
    isAction(value.action)
  );
}

export function isFinalStatus(status: PaymentStatus | undefined): boolean {
  return status === 'paid' || status === 'failed' || status === 'expired';
}

/**
 * The payment to show for an order: the paid one if there is one, otherwise the newest attempt.
 * Ids are ULIDs, which sort by creation time.
 */
export function currentPayment(payments: readonly Payment[]): Payment | null {
  const paid = payments.find((payment) => payment.status === 'paid');
  if (paid) return paid;
  const newestFirst = [...payments].sort((a, b) => b.id.localeCompare(a.id));
  return newestFirst[0] ?? null;
}
