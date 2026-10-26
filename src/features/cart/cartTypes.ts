import type { Schemas } from '@/shared/api';

/** A name in both languages; the screen shows the one the customer reads. */
/** A name the server sends in Arabic and English; French reads the English one (see `textLanguages`). */
export type LocalizedText = { ar: string; en: string };

export type LineAvailability = Schemas['CartResource']['lines'][number]['availability'];

/** Everything a line needs to be shown without asking the API. The guest cart stores exactly this. */
export type LineSnapshot = {
  variantId: number;
  productSlug: string;
  name: LocalizedText;
  variantName: LocalizedText | null;
  imageUrl: string | null;
};

export type GuestLine = LineSnapshot & { quantity: number };

/** Prices are integer halalas. */
export type CartLine = GuestLine & {
  unitPrice: number;
  linePrice: number;
  availability: LineAvailability;
};

export type CartContents = {
  lines: readonly CartLine[];
  itemsCount: number;
  subtotal: number;
};

export type CartStatus = 'loading' | 'error' | 'ready';

/** Why a change to the cart did not happen. Screens turn each one into a message. */
export type CartRefusal =
  | 'quantity_out_of_range'
  | 'variant_unavailable'
  | 'cart_full'
  | 'session_expired'
  | 'network'
  | 'unknown';

export type CartChange = { ok: true } | { ok: false; reason: CartRefusal };

/** `quantity` is what the line holds now; `capped` says the customer asked for more than the limit. */
export type CartAddition =
  { ok: true; quantity: number; capped: boolean } | { ok: false; reason: CartRefusal };

/** The one shape every screen reads, whether the cart lives on the server or on the device. */
export type Cart = CartContents & {
  kind: 'guest' | 'server';
  status: CartStatus;
  /** Sets the quantity of a line already in the cart; zero removes it. */
  setQuantity: (variantId: number, quantity: number) => Promise<CartChange>;
  /** Adds `amount` to what the cart already holds of this variant, up to the per-line limit. */
  addItem: (snapshot: LineSnapshot, amount: number) => Promise<CartAddition>;
  remove: (variantId: number) => Promise<CartChange>;
  clear: () => Promise<CartChange>;
  refetch: () => void;
};
