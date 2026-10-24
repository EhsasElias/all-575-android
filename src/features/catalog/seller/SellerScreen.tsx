import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { useLanguage } from '@/shared/i18n';
import { routePaths } from '@/shared/lib';
import { ButtonLink, EmptyState, ErrorState, Skeleton } from '@/shared/ui';
import { useSeller } from '../api/useCatalogQueries';
import { useProductList } from '../api/useProductList';
import { CatalogImage } from '../components/CatalogImage';
import { NotFoundState } from '../components/NotFoundState';
import { ProductResults } from '../components/ProductResults';
import { DeliveryChip } from '../delivery/DeliveryChip';
import { useDeliveryZone } from '../delivery/useDeliveryZone';
import { isNotFound } from '../lib/isNotFound';
import { pickText } from '../lib/localized';
import styles from './SellerScreen.module.css';

const LOGO_SIZE = 64;

/** A seller and what they sell. */
export function SellerScreen() {
  const { slug = '' } = useParams();
  const { t } = useTranslation('catalog');
  const { language } = useLanguage();
  const { zoneId } = useDeliveryZone();
  const seller = useSeller(slug);
  const missing = isNotFound(seller.error);
  const list = useProductList({ seller: slug, zoneId }, !missing);

  if (missing) {
    return (
      <NotFoundState
        title={t('seller.notFoundTitle')}
        message={t('seller.notFoundMessage')}
        actionLabel={t('product.browse')}
        actionTo={routePaths.categories}
      />
    );
  }
  if (seller.isError) {
    return (
      <ErrorState
        headingLevel={1}
        onRetry={() => {
          void seller.refetch();
        }}
      />
    );
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <CatalogImage
          src={seller.data?.logo_url ?? null}
          alt=""
          size={LOGO_SIZE}
          eager
          round
          className={styles.logo}
        />
        <h1 className={styles.title}>
          {seller.data ? pickText(seller.data.name, language) : <Skeleton width="10rem" />}
        </h1>
      </div>

      <DeliveryChip className={styles.chip} />

      <section aria-labelledby="seller-products" className={styles.products}>
        <h2 id="seller-products" className={styles.sectionTitle}>
          {t('seller.productsTitle')}
        </h2>
        <ProductResults
          list={list}
          hideUnknownAvailability={zoneId === null}
          empty={
            <EmptyState
              icon="package"
              headingLevel={3}
              title={t('seller.emptyTitle')}
              message={t('seller.emptyMessage')}
              action={
                <ButtonLink to={routePaths.categories}>{t('home.browseCategories')}</ButtonLink>
              }
            />
          }
        />
      </section>
    </div>
  );
}
