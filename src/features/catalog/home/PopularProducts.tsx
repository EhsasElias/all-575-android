import { useCategories } from '../api/useCatalogQueries';
import { useProductList } from '../api/useProductList';
import { useDeliveryZone } from '../delivery/useDeliveryZone';
import { HomeDiscovery } from './HomeDiscovery';

/** The homepage is discovery-only; full catalogue filters remain on catalogue/search pages. */
export function PopularProducts() {
  const { zoneId } = useDeliveryZone();
  const categories = useCategories();
  const products = useProductList({ zoneId, perPage: 12, sort: 'newest' });

  return <HomeDiscovery categories={categories.data ?? []} products={products.items} />;
}
