import { asBoolean, asInteger, asString, isRecord, readList } from './json';

/** The price of the cart for one address: what the server will charge if the customer pays this quote. */
export type LocalizedName = { ar: string | null; en: string | null };

export type QuoteLine = {
  variantId: number;
  productSlug: string;
  name: LocalizedName;
  variantName: LocalizedName | null;
  imageUrl: string | null;
  quantity: number;
  lineTotal: number;
  discount: number;
  available: boolean;
  availableUnits: number;
};

export type QuoteIssue = { variantId: number; code: string; availableUnits: number };

export type Quote = {
  id: string;
  expiresAtMs: number;
  lines: QuoteLine[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  vatIncluded: number;
  promoCode: string | null;
  addressId: number;
  issues: QuoteIssue[];
  canCheckout: boolean;
};

function readName(value: unknown): LocalizedName | null {
  if (!isRecord(value)) return null;
  const { ar, en } = value;
  if ((ar !== null && typeof ar !== 'string') || (en !== null && typeof en !== 'string'))
    return null;
  return { ar, en };
}

function readLine(value: unknown): QuoteLine | null {
  if (!isRecord(value)) return null;
  const name = readName(value.name);
  const variantName = value.variant_name === null ? null : readName(value.variant_name);
  const variantId = asInteger(value.variant_id);
  const productSlug = asString(value.product_slug);
  const quantity = asInteger(value.quantity);
  const lineTotal = asInteger(value.line_total);
  const discount = asInteger(value.discount);
  const available = asBoolean(value.available);
  const availableUnits = asInteger(value.available_units);
  if (
    name === null ||
    (value.variant_name !== null && variantName === null) ||
    variantId === null ||
    productSlug === null ||
    quantity === null ||
    lineTotal === null ||
    discount === null ||
    available === null ||
    availableUnits === null
  ) {
    return null;
  }
  return {
    variantId,
    productSlug,
    name,
    variantName,
    imageUrl: asString(value.image_url),
    quantity,
    lineTotal,
    discount,
    available,
    availableUnits,
  };
}

function readIssue(value: unknown): QuoteIssue | null {
  if (!isRecord(value)) return null;
  const variantId = asInteger(value.variant_id);
  const code = asString(value.code);
  const availableUnits = asInteger(value.available_units);
  if (variantId === null || code === null || availableUnits === null) return null;
  return { variantId, code, availableUnits };
}

/**
 * Reads a quote from raw JSON (`POST /quotes` and the `quote` inside a `quote_changed` refusal), or null if it
 * is not one. The contract types it only loosely, and money must never be guessed, so every amount is checked.
 */
export function readQuote(value: unknown): Quote | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const expiresAt = asString(value.expires_at);
  const expiresAtMs = expiresAt === null ? Number.NaN : Date.parse(expiresAt);
  const lines = readList(value.lines, readLine);
  const issues = readList(value.issues, readIssue);
  const amounts = {
    subtotal: asInteger(value.subtotal),
    discount: asInteger(value.discount),
    deliveryFee: asInteger(value.delivery_fee),
    total: asInteger(value.total),
    vatIncluded: asInteger(value.vat_included),
    addressId: asInteger(value.address_id),
  };
  const canCheckout = asBoolean(value.can_checkout);

  if (
    id === null ||
    Number.isNaN(expiresAtMs) ||
    lines === null ||
    issues === null ||
    canCheckout === null ||
    amounts.subtotal === null ||
    amounts.discount === null ||
    amounts.deliveryFee === null ||
    amounts.total === null ||
    amounts.vatIncluded === null ||
    amounts.addressId === null
  ) {
    return null;
  }
  return {
    id,
    expiresAtMs,
    lines,
    issues,
    canCheckout,
    subtotal: amounts.subtotal,
    discount: amounts.discount,
    deliveryFee: amounts.deliveryFee,
    total: amounts.total,
    vatIncluded: amounts.vatIncluded,
    addressId: amounts.addressId,
    promoCode: asString(value.promo_code),
  };
}
