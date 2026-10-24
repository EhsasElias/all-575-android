import { useQuery } from '@tanstack/react-query';
import { http, type Page } from '@/shared/api';
import { catalogKeys } from './queryKeys';
import type { ProductSummary } from './types';
import { usePagedQuery } from './usePagedQuery';

export type ProductFilters = {
  category?: string | undefined;
  seller?: string | undefined;
  /** Free text, already trimmed. The server needs at least 2 characters. */
  q?: string | undefined;
  /** The delivery zone: availability follows it. Left out when the customer has not chosen one. */
  zoneId: number | null;
  perPage?: number | undefined;
};

const PRODUCTS_PATH = '/products';

function toQuery({ category, seller, q, zoneId, perPage }: ProductFilters) {
  return {
    category,
    seller,
    q,
    zone_id: zoneId ?? undefined,
    per_page: perPage,
  };
}

/** A paged list of products. There is no price filter or price sort: everything costs the same. */
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
