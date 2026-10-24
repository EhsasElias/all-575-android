import { useQuery } from '@tanstack/react-query';
import { fetchCategories, fetchProduct, fetchSeller } from './catalogApi';
import { catalogKeys } from './queryKeys';
import type { Review } from './types';
import { usePagedQuery } from './usePagedQuery';

const TEN_MINUTES_MS = 10 * 60 * 1000;

/** The whole category tree: small, rarely changes, and shared by the home, categories and search screens. */
export function useCategories() {
  return useQuery({
    queryKey: catalogKeys.categories,
    queryFn: ({ signal }) => fetchCategories(signal),
    staleTime: TEN_MINUTES_MS,
  });
}

export function useProduct(slug: string, zoneId: number | null) {
  return useQuery({
    queryKey: catalogKeys.product(slug, zoneId),
    queryFn: ({ signal }) => fetchProduct(slug, zoneId, signal),
    // Choosing another area refreshes the same product in place, without a blank page in between.
    placeholderData: (previousData) => (previousData?.slug === slug ? previousData : undefined),
  });
}

export function useSeller(slug: string) {
  return useQuery({
    queryKey: catalogKeys.seller(slug),
    queryFn: ({ signal }) => fetchSeller(slug, signal),
  });
}

export function useReviews(slug: string) {
  return usePagedQuery<Review>({
    queryKey: catalogKeys.reviews(slug),
    path: `/products/${encodeURIComponent(slug)}/reviews`,
  });
}
