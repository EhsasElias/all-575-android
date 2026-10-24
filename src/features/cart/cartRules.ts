import type { CartContents, CartLine, GuestLine } from './cartTypes';

/** The same limits the server enforces (`store.cart` in the API), so the guest cart behaves like the real one. */
export const MAX_QUANTITY_PER_LINE = 20;
export const MAX_CART_LINES = 50;

export type Addition = { quantity: number; capped: boolean };

/**
 * What a line holds after adding `amount` to the `existing` quantity. Never above the limit; `capped` says the
 * customer asked for more than fits. Null when `amount` itself is not a quantity a customer can choose.
 */
export function planAddition(existing: number, amount: number): Addition | null {
  if (!Number.isInteger(amount) || amount < 1 || amount > MAX_QUANTITY_PER_LINE) return null;
  const wanted = existing + amount;
  return {
    quantity: Math.min(wanted, MAX_QUANTITY_PER_LINE),
    capped: wanted > MAX_QUANTITY_PER_LINE,
  };
}

export function summarize(lines: readonly CartLine[]): CartContents {
  return {
    lines,
    itemsCount: lines.reduce((total, line) => total + line.quantity, 0),
    subtotal: lines.reduce((total, line) => total + line.linePrice, 0),
  };
}

export function countItems(lines: readonly GuestLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

/** A guest line with the one price everything costs. */
export function priceGuestLines(lines: readonly GuestLine[], unitPrice: number): CartContents {
  return summarize(
    lines.map((line) => ({
      ...line,
      unitPrice,
      linePrice: unitPrice * line.quantity,
      // Stock is only known per delivery address, so a guest's lines are checked at checkout.
      availability: 'unknown',
    })),
  );
}

/** The cart as it will look once the server accepts `quantity` for a line (zero removes it). Used for instant feedback. */
export function withQuantity(
  contents: CartContents,
  variantId: number,
  quantity: number,
): CartContents {
  if (quantity <= 0) {
    return summarize(contents.lines.filter((line) => line.variantId !== variantId));
  }
  return summarize(
    contents.lines.map((line) =>
      line.variantId === variantId
        ? { ...line, quantity, linePrice: line.unitPrice * quantity }
        : line,
    ),
  );
}
