import { useCategories } from '../api/useCatalogQueries';
import { useProductList } from '../api/useProductList';
import { useDeliveryZone } from '../delivery/useDeliveryZone';
import { HomeDiscovery } from './HomeDiscovery';

/** The homepage is discovery-only; full catalogue filters remain on catalogue/search pages. */
export function PopularProducts() {
  const { zoneId } = useDeliveryZone();
  const categories = useCategories();
  // Never promote unavailable items once the customer's delivery zone is known.
  const products = useProductList({ zoneId, inStock: true, perPage: 12, sort: 'newest' });

  return <HomeDiscovery categories={categories.data ?? []} products={products.items} />;
}
