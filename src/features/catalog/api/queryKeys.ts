/** Every query of the catalog starts with "catalog", so it can be cleared in one go. */
export const catalogKeys = {
  categories: ['catalog', 'categories'] as const,
  addressZone: ['catalog', 'address-zone'] as const,
  products: (filters: Record<string, string | number | undefined>) =>
    ['catalog', 'products', filters] as const,
  product: (slug: string, zoneId: number | null) => ['catalog', 'product', slug, zoneId] as const,
  seller: (slug: string) => ['catalog', 'seller', slug] as const,
  reviews: (slug: string) => ['catalog', 'reviews', slug] as const,
};
