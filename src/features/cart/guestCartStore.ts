import { getPreference, setPreference } from '@/shared/storage';
import { countItems } from './cartRules';
import type { GuestLine } from './cartTypes';
import { parseGuestCart, serializeGuestCart } from './guestCartStorage';

const listeners = new Set<() => void>();

// The stored text is parsed (and validated) once per distinct value, so React sees a stable snapshot.
let parsedFrom: string | null = null;
let parsedLines: readonly GuestLine[] = parseGuestCart(null);

function getSnapshot(): readonly GuestLine[] {
  const stored = getPreference('guestCart');
  if (stored !== parsedFrom) {
    parsedFrom = stored;
    parsedLines = parseGuestCart(stored);
  }
  return parsedLines;
}

function getItemCount(): number {
  return countItems(getSnapshot());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function write(lines: readonly GuestLine[]): void {
  setPreference('guestCart', serializeGuestCart(lines));
  for (const listener of listeners) listener();
}

/**
 * The guest's cart lives in the `guestCart` preference. This store is the only code that reads or writes it, and
 * it lets screens (the tab badge, the cart, the product page) update the moment a line changes.
 * Use it with `useSyncExternalStore`.
 */
export const guestCartStore = {
  subscribe,
  getSnapshot,
  getItemCount,
  write,
  clear: () => {
    write([]);
  },
};
