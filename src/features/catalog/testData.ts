import type { Page } from '@/shared/api';
import type {
  Address,
  Category,
  ProductDetail,
  ProductSummary,
  Review,
  Seller,
  Variant,
  Zone,
} from './api/types';

export const riyadh: Zone = {
  id: 1,
  name: { ar: 'الرياض', en: 'Riyadh' },
  delivery_fee: 1000,
  free_delivery_threshold: 5000,
  currency: 'SAR',
};

export const homeStore: Seller = {
  slug: 'home-store',
  name: { ar: 'متجر البيت', en: 'Home Store' },
  logo_url: null,
};

const PRICE = { gross: 575, net: 500, vat: 75, currency: 'SAR' };

export const foodCategory: Category = {
  id: 1,
  slug: 'food',
  name: { ar: 'أطعمة', en: 'Food' },
  image_url: 'http://api.test/images/food.png',
  children: [
    { id: 11, slug: 'snacks', name: { ar: 'وجبات خفيفة', en: 'Snacks' }, image_url: null },
    { id: 12, slug: 'drinks', name: { ar: 'مشروبات', en: 'Drinks' }, image_url: null },
  ],
};

export const toysCategory: Category = {
  id: 12,
  slug: 'toys',
  name: { ar: 'الألعاب', en: 'Toys' },
  image_url: null,
  children: [],
};

export const categories: Category[] = [foodCategory, toysCategory];

export function makeProduct(overrides: Partial<ProductSummary> = {}): ProductSummary {
  return {
    id: 1,
    slug: 'demo-food-1',
    name: { ar: 'بسكويت', en: 'Biscuits' },
    image_url: 'http://api.test/images/biscuits.png',
    seller: homeStore,
    category: { slug: 'food', name: foodCategory.name },
    price: PRICE,
    rating: { average: 0, count: 0 },
    availability: 'unknown',
    ...overrides,
  };
}

export const biscuits = makeProduct();
export const socks = makeProduct({
  id: 4,
  slug: 'demo-clothing-1',
  name: { ar: 'جوارب', en: 'Socks' },
  rating: { average: 4.5, count: 12 },
});
export const notebook = makeProduct({
  id: 7,
  slug: 'demo-stationery-1',
  name: { ar: 'دفتر', en: 'Notebook' },
  image_url: null,
});

export function makeVariant(overrides: Partial<Variant> = {}): Variant {
  return {
    id: 1,
    sku: 'DEMO-FOOD-1',
    name: null,
    price: PRICE,
    availability: 'unknown',
    ...overrides,
  };
}

export function makeProductDetail(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    ...biscuits,
    description: { ar: 'منتج تجريبي لعرض المتجر.', en: 'Demo product for previewing the store.' },
    vat_class: 'standard',
    variants: [makeVariant()],
    ...overrides,
  };
}

/** A product sold in three sizes: the first is out of stock, the last is nearly gone. */
export const sizedProduct = makeProductDetail({
  availability: 'in_stock',
  variants: [
    makeVariant({
      id: 10,
      sku: 'SMALL',
      name: { ar: 'صغير', en: 'Small' },
      availability: 'out_of_stock',
    }),
    makeVariant({
      id: 11,
      sku: 'MEDIUM',
      name: { ar: 'وسط', en: 'Medium' },
      availability: 'in_stock',
    }),
    makeVariant({
      id: 12,
      sku: 'LARGE',
      name: { ar: 'كبير', en: 'Large' },
      availability: 'low_stock',
    }),
  ],
});

export function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 1,
    rating: 4,
    body: 'Fresh and crunchy.',
    reviewer: 'S*** A.',
    created_at: '2026-10-20T09:00:00Z',
    ...overrides,
  };
}

export const defaultAddress: Address = {
  id: 5,
  label: 'Home',
  recipient_name: 'Sara',
  recipient_phone: '+966512345678',
  region: 'Riyadh',
  city: 'Riyadh',
  district: 'Al Olaya',
  street: 'King Fahd Road',
  building_number: '1234',
  additional_number: '5678',
  postal_code: '12211',
  short_address: 'RRRD2929',
  unit: null,
  floor: null,
  delivery_notes: null,
  lat: 24.71,
  lng: 46.67,
  is_default: true,
  serviceable: true,
  service_zone_id: 1,
};

/** A page of a paginated list; `next` is the full URL the server would send. */
export function page<T>(data: T[], next: string | null = null): Page<T> {
  return { data, links: { next }, meta: { next_cursor: next === null ? null : 'cursor' } };
}

export const NEXT_PRODUCTS_URL = 'http://api.test/api/v1/products?category=food&cursor=page2';
