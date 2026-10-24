import type { Quote } from './quote';

export type BlockedReason = 'address' | 'slot' | 'quote' | 'expired' | 'unavailable';

type ReadinessInput = {
  addressChosen: boolean;
  slotChosen: boolean;
  quote: Quote | null;
  quoteExpired: boolean;
  /** An order is already being placed. */
  placing: boolean;
};

/** Whether the pay button may be used, and if not, the one thing to tell the customer first. */
export function blockedReason({
  addressChosen,
  slotChosen,
  quote,
  quoteExpired,
  placing,
}: ReadinessInput): BlockedReason | null {
  if (placing) return null;
  if (!addressChosen) return 'address';
  if (quote === null) return 'quote';
  if (quoteExpired) return 'expired';
  if (!quote.canCheckout) return 'unavailable';
  if (!slotChosen) return 'slot';
  return null;
}
