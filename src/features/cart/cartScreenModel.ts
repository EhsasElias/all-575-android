import type { CartLine, LineAvailability } from './cartTypes';

/** Why a line cannot be bought: out of stock at the delivery address, or no longer sold at all. */
export type LineProblem = 'out_of_stock' | 'gone';

export type ScreenLine = CartLine & { problem: LineProblem | null };

/**
 * Marks the lines that cannot be bought. They stay in the list (never silently removed) so the customer sees why.
 * `stock` is what we know per delivery address, `gone` the variants the server refused as no longer available.
 */
export function toScreenLines(
  lines: readonly CartLine[],
  stock: ReadonlyMap<number, LineAvailability>,
  gone: ReadonlySet<number>,
): ScreenLine[] {
  return lines.map((line) => {
    if (gone.has(line.variantId)) return { ...line, problem: 'gone' };
    const availability = stock.get(line.variantId) ?? line.availability;
    return {
      ...line,
      availability,
      problem: availability === 'out_of_stock' ? 'out_of_stock' : null,
    };
  });
}

export type Payable = { items: number; subtotal: number };

/** What the customer can actually buy now. Same rule as the quote, which leaves unavailable lines out of the subtotal. */
export function payable(lines: readonly ScreenLine[]): Payable {
  return lines
    .filter((line) => line.problem === null)
    .reduce<Payable>(
      (total, line) => ({
        items: total.items + line.quantity,
        subtotal: total.subtotal + line.linePrice,
      }),
      { items: 0, subtotal: 0 },
    );
}
