import { useQuery } from '@tanstack/react-query';
import { http, type Page } from '@/shared/api';
import { catalogKeys } from './queryKeys';
import type { ProductSummary } from './types';
import { usePagedQuery } from './usePagedQuery';

export type ProductFilters = {
  category?: string | undefined;
  sort?: string | undefined;
  inStock?: boolean | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  seller?: string | undefined;
  /** Free text, already trimmed. The server needs at least 2 characters. */
  q?: string | undefined;
  /** The delivery zone: availability follows it. Left out when the customer has not chosen one. */
  zoneId: number | null;
  perPage?: number | undefined;
};

const PRODUCTS_PATH = '/products';

function toQuery({
  category,
  seller,
  q,
  zoneId,
  perPage,
  sort,
  inStock,
  minPrice,
  maxPrice,
}: ProductFilters) {
  return {
    sort,
    in_stock: inStock && zoneId !== null ? 1 : undefined,
    min_price: minPrice,
    max_price: maxPrice,
    category,
    seller,
    q,
    zone_id: zoneId ?? undefined,
    per_page: perPage,
  };
}

/** Server-priced results with combinable category, price and sort choices. */
export function useProductList(filters: ProductFilters, enabled = true) {
  const query = toQuery(filters);
  return usePagedQuery<ProductSummary>({
    queryKey: catalogKeys.products(query),
    path: PRODUCTS_PATH,
    query,
    enabled,
  });
}

/** Only the first page, for a shelf on the home screen. */
export function useFirstProducts(filters: ProductFilters) {
  const query = toQuery(filters);
  return useQuery({
    queryKey: [...catalogKeys.products(query), 'first-page'],
    queryFn: async ({ signal }) => {
      const page = await http.get<Page<ProductSummary>>(PRODUCTS_PATH, { query, signal });
      return page.data;
    },
  });
}
