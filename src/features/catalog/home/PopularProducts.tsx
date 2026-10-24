import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { ButtonLink, EmptyState, ErrorState } from '@/shared/ui';
import { useFirstProducts } from '../api/useProductList';
import { ProductGrid } from '../components/ProductGrid';
import { ProductGridSkeleton } from '../components/ProductGridSkeleton';
import { useDeliveryZone } from '../delivery/useDeliveryZone';
import styles from './HomeSection.module.css';

const SHELF_SIZE = 12;

/** The first page of products, for the zone the customer chose. */
export function PopularProducts() {
  const { t } = useTranslation('catalog');
  const { zoneId } = useDeliveryZone();
  const products = useFirstProducts({ zoneId, perPage: SHELF_SIZE });

  return (
    <section aria-labelledby="home-popular" className={styles.section}>
      <h2 id="home-popular" className={styles.sectionTitle}>
        {t('home.popularTitle')}
      </h2>
      {products.isPending && <ProductGridSkeleton />}
      {products.isError && (
        <ErrorState
          title={t('list.productsErrorTitle')}
          headingLevel={3}
          onRetry={() => {
            void products.refetch();
          }}
        />
      )}
      {products.data?.length === 0 && (
        <EmptyState
          icon="package"
          headingLevel={3}
          title={t('home.emptyTitle')}
          message={t('home.emptyMessage')}
          action={<ButtonLink to={routePaths.categories}>{t('home.browseCategories')}</ButtonLink>}
        />
      )}
      {products.data && products.data.length > 0 && (
        <ProductGrid products={products.data} hideUnknownAvailability={zoneId === null} />
      )}
    </section>
  );
}
