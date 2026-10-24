import { MAX_CART_LINES, MAX_QUANTITY_PER_LINE } from './cartRules';
import type { GuestLine, LocalizedText } from './cartTypes';

const STORAGE_VERSION = 1;
const MAX_TEXT_LENGTH = 300;
const MAX_URL_LENGTH = 2048;

const NO_LINES: readonly GuestLine[] = [];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.length <= MAX_TEXT_LENGTH;
}

function isLocalizedText(value: unknown): value is LocalizedText {
  return isRecord(value) && isText(value.ar) && isText(value.en);
}

/** Stored data is untrusted: only web addresses may become an image source. */
function isWebUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > MAX_URL_LENGTH) return false;
  try {
    const { protocol } = new URL(value);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

/** One stored line, rebuilt field by field so nothing unexpected survives. Null when it cannot be trusted. */
function parseLine(value: unknown): GuestLine | null {
  if (!isRecord(value)) return null;
  const { variantId, quantity, productSlug, name, variantName, imageUrl } = value;

  if (!isPositiveInteger(variantId) || !isPositiveInteger(quantity)) return null;
  if (!isText(productSlug) || productSlug === '' || !isLocalizedText(name)) return null;
  if (variantName !== null && !isLocalizedText(variantName)) return null;
  if (imageUrl !== null && !isWebUrl(imageUrl)) return null;

  return {
    variantId,
    quantity: Math.min(quantity, MAX_QUANTITY_PER_LINE),
    productSlug,
    name: { ar: name.ar, en: name.en },
    variantName: variantName === null ? null : { ar: variantName.ar, en: variantName.en },
    imageUrl,
  };
}

/**
 * Reads the guest cart from its stored text. Anything wrong (not JSON, a different version, a broken line, a
 * repeated variant, more lines than the cart can hold) is dropped; it never throws and never returns bad data.
 */
export function parseGuestCart(stored: string | null): readonly GuestLine[] {
  if (stored === null) return NO_LINES;

  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    return NO_LINES;
  }
  if (!isRecord(parsed) || parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.lines)) {
    return NO_LINES;
  }

  const candidates: readonly unknown[] = parsed.lines;
  const seen = new Set<number>();
  const lines: GuestLine[] = [];
  for (const candidate of candidates) {
    const line = parseLine(candidate);
    if (line === null || seen.has(line.variantId)) continue;
    seen.add(line.variantId);
    lines.push(line);
    if (lines.length === MAX_CART_LINES) break;
  }
  return lines;
}

export function serializeGuestCart(lines: readonly GuestLine[]): string {
  return JSON.stringify({ version: STORAGE_VERSION, lines });
}
