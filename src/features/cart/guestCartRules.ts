import { MAX_CART_LINES, MAX_QUANTITY_PER_LINE, planAddition, type Addition } from './cartRules';
import type { GuestLine, LineSnapshot } from './cartTypes';

type GuestRefusal = 'quantity_out_of_range' | 'variant_unavailable' | 'cart_full';

export type GuestEdit =
  { ok: true; lines: readonly GuestLine[] } | { ok: false; reason: GuestRefusal };

export type GuestAddition =
  ({ ok: true; lines: readonly GuestLine[] } & Addition) | { ok: false; reason: GuestRefusal };

/** The body of POST /cart/merge: one entry per variant, each quantity inside what the server accepts. */
export type MergeItem = { variant_id: number; quantity: number };

/** Sets a line's quantity the way PUT /cart/items/{variant} does: 0 removes it, more than 20 is refused. */
export function setGuestQuantity(
  lines: readonly GuestLine[],
  variantId: number,
  quantity: number,
): GuestEdit {
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > MAX_QUANTITY_PER_LINE) {
    return { ok: false, reason: 'quantity_out_of_range' };
  }
  if (quantity === 0) {
    return { ok: true, lines: lines.filter((line) => line.variantId !== variantId) };
  }
  if (!lines.some((line) => line.variantId === variantId)) {
    return { ok: false, reason: 'variant_unavailable' };
  }
  return {
    ok: true,
    lines: lines.map((line) => (line.variantId === variantId ? { ...line, quantity } : line)),
  };
}

/** Adds `amount` of a variant: onto its existing line, or as a new line while the cart has room. */
export function addGuestLine(
  lines: readonly GuestLine[],
  snapshot: LineSnapshot,
  amount: number,
): GuestAddition {
  const existing = lines.find((line) => line.variantId === snapshot.variantId);
  const plan = planAddition(existing?.quantity ?? 0, amount);
  if (plan === null) return { ok: false, reason: 'quantity_out_of_range' };

  if (existing === undefined) {
    if (lines.length >= MAX_CART_LINES) return { ok: false, reason: 'cart_full' };
    return { ok: true, lines: [...lines, { ...snapshot, quantity: plan.quantity }], ...plan };
  }
  return {
    ok: true,
    lines: lines.map((line) =>
      line.variantId === snapshot.variantId
        ? { ...line, ...snapshot, quantity: plan.quantity }
        : line,
    ),
    ...plan,
  };
}

/** What to send to the server when the guest signs in. Quantities above the limit are brought down, never sent as is. */
export function toMergeItems(lines: readonly GuestLine[]): MergeItem[] {
  const quantities = new Map<number, number>();
  for (const line of lines) {
    const quantity = Math.min(Math.max(Math.trunc(line.quantity), 1), MAX_QUANTITY_PER_LINE);
    quantities.set(
      line.variantId,
      Math.min((quantities.get(line.variantId) ?? 0) + quantity, MAX_QUANTITY_PER_LINE),
    );
  }
  return [...quantities]
    .slice(0, MAX_CART_LINES)
    .map(([variantId, quantity]) => ({ variant_id: variantId, quantity }));
}
