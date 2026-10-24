// The reasons the API records today. Anything else is shown with a general sentence, never as raw text.
const CANCEL_REASONS = ['customer_cancelled', 'payment_timeout', 'payment_provider_error'] as const;
const REFUND_REASONS = ['customer_cancelled', 'late_payment'] as const;

export type CancelReason = (typeof CANCEL_REASONS)[number];
export type RefundReason = (typeof REFUND_REASONS)[number];

export function isCancelReason(value: string | null): value is CancelReason {
  return CANCEL_REASONS.some((reason) => reason === value);
}

export function isRefundReason(value: string): value is RefundReason {
  return REFUND_REASONS.some((reason) => reason === value);
}
