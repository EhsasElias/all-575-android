import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { routePaths } from '@/shared/lib';
import { ErrorState, Skeleton, VisuallyHidden } from '@/shared/ui';
import { useProduct } from '../api/useCatalogQueries';
import { NotFoundState } from '../components/NotFoundState';
import { useDeliveryZone } from '../delivery/useDeliveryZone';
import { isNotFound } from '../lib/isNotFound';
import { ProductDetails } from './ProductDetails';
import styles from './ProductScreen.module.css';

function ProductSkeleton() {
  const { t } = useTranslation();

  return (
    <div role="status" className={styles.skeleton}>
      <VisuallyHidden>{t('states.loading')}</VisuallyHidden>
      <Skeleton height="min(100vw, 30rem)" />
      <Skeleton width="70%" height="2rem" />
      <Skeleton width="40%" height="1.25rem" />
      <Skeleton height="8rem" />
    </div>
  );
}

/** One product, in the area the customer chose. A product that does not exist gets its own page, not an error. */
export function ProductScreen() {
  const { slug = '' } = useParams();
  const { t } = useTranslation('catalog');
  const { zoneId } = useDeliveryZone();
  const product = useProduct(slug, zoneId);

  if (product.isPending) return <ProductSkeleton />;
  if (product.isError) {
    return isNotFound(product.error) ? (
      <NotFoundState
        title={t('product.notFoundTitle')}
        message={t('product.notFoundMessage')}
        actionLabel={t('product.browse')}
        actionTo={routePaths.categories}
      />
    ) : (
      <ErrorState
        headingLevel={1}
        onRetry={() => {
          void product.refetch();
        }}
      />
    );
  }

  return <ProductDetails product={product.data} />;
}
