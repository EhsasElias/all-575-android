import type { Schemas } from '@/shared/api';
import type { GuestLine, LineAvailability, LineSnapshot } from './cartTypes';

export const UNIT_PRICE = 575;

export const BISCUITS: LineSnapshot = {
  variantId: 1,
  productSlug: 'demo-food-1',
  name: { ar: 'بسكويت', en: 'Biscuits' },
  variantName: null,
  imageUrl: 'http://127.0.0.1:8000/images/all575/products/demo-food-1.png',
};

export const CHOCOLATE: LineSnapshot = {
  variantId: 2,
  productSlug: 'demo-food-2',
  name: { ar: 'شوكولاتة', en: 'Chocolate' },
  variantName: null,
  imageUrl: null,
};

export const NOTEBOOK: LineSnapshot = {
  variantId: 7,
  productSlug: 'demo-stationery-1',
  name: { ar: 'دفتر', en: 'Notebook' },
  variantName: { ar: 'أزرق', en: 'Blue' },
  imageUrl: 'http://127.0.0.1:8000/images/all575/products/demo-stationery-1.png',
};

export const CATALOG: readonly LineSnapshot[] = [BISCUITS, CHOCOLATE, NOTEBOOK];

export function guestLine(snapshot: LineSnapshot, quantity: number): GuestLine {
  return { ...snapshot, quantity };
}

type CartResource = Schemas['CartResource'];
export type CartLineResource = CartResource['lines'][number];

/** One line as `GET /cart` sends it. */
export function serverLine(
  snapshot: LineSnapshot,
  quantity: number,
  availability: LineAvailability = 'unknown',
): CartLineResource {
  return {
    variant_id: snapshot.variantId,
    product_slug: snapshot.productSlug,
    name: snapshot.name,
    variant_name: snapshot.variantName,
    image_url: snapshot.imageUrl,
    quantity,
    unit_price: UNIT_PRICE,
    line_price: UNIT_PRICE * quantity,
    availability,
  };
}

/** The whole cart as the API sends it, totals included. */
export function cartResource(lines: readonly CartLineResource[]): CartResource {
  const itemsCount = lines.reduce((total, line) => total + line.quantity, 0);
  return {
    lines: [...lines],
    items_count: itemsCount,
    subtotal: UNIT_PRICE * itemsCount,
    currency: 'SAR',
  };
}

type Product = Schemas['ProductDetailResource'];
type Variant = Schemas['VariantResource'];

export function variantResource(overrides: Partial<Variant> = {}): Variant {
  return {
    id: BISCUITS.variantId,
    sku: 'DEMO-FOOD-1',
    name: null,
    price: { gross: UNIT_PRICE, net: 500, vat: 75, currency: 'SAR' },
    availability: 'in_stock',
    ...overrides,
  };
}

/** The product the product page hands to `AddToCart`. */
export function productResource(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    slug: BISCUITS.productSlug,
    name: BISCUITS.name,
    image_url: BISCUITS.imageUrl,
    seller: { slug: 'home-store', name: { ar: 'متجر البيت', en: 'Home Store' }, logo_url: null },
    category: { slug: 'food', name: { ar: 'أطعمة', en: 'Food' } },
    price: { gross: UNIT_PRICE, net: 500, vat: 75, currency: 'SAR' },
    rating: { average: 0, count: 0 },
    availability: 'in_stock',
    description: { ar: null, en: null },
    vat_class: 'standard',
    variants: [variantResource()],
    ...overrides,
  };
}
