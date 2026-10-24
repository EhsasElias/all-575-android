import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { useLanguage } from '@/shared/i18n';
import { routePaths, routeTo } from '@/shared/lib';
import { ButtonLink, EmptyState, Skeleton, VisuallyHidden } from '@/shared/ui';
import { useCategories } from '../api/useCatalogQueries';
import { useProductList } from '../api/useProductList';
import { CategoryChips } from '../components/CategoryChips';
import { NotFoundState } from '../components/NotFoundState';
import { ProductResults } from '../components/ProductResults';
import { DeliveryChip } from '../delivery/DeliveryChip';
import { useDeliveryZone } from '../delivery/useDeliveryZone';
import { pickText } from '../lib/localized';
import { findCategory } from './findCategory';
import styles from './CategoryProductsScreen.module.css';

/** The products of one category, with its sub-categories on top. */
export function CategoryProductsScreen() {
  const { slug = '' } = useParams();
  const { t } = useTranslation('catalog');
  const { t: tCommon } = useTranslation();
  const { language } = useLanguage();
  const categories = useCategories();
  const { zoneId } = useDeliveryZone();

  const match = categories.data ? findCategory(categories.data, slug) : null;
  // The products API answers an unknown slug with an empty list, so the category tree is what tells us.
  const unknownCategory = categories.isSuccess && match === null;
  const list = useProductList({ category: slug, zoneId }, !unknownCategory);

  if (unknownCategory) {
    return (
      <NotFoundState
        title={t('categoryProducts.notFoundTitle')}
        message={t('categoryProducts.notFoundMessage')}
        actionLabel={t('home.browseCategories')}
        actionTo={routePaths.categories}
      />
    );
  }

  const children = match?.category.children ?? [];

  return (
    <div className={styles.screen}>
      <div className={styles.heading}>
        {match?.parent && (
          <Link to={routeTo.categoryProducts(match.parent.slug)} className={styles.back}>
            {t('categoryProducts.backTo', { name: pickText(match.parent.name, language) })}
          </Link>
        )}
        <h1 className={styles.title}>
          {match ? (
            pickText(match.category.name, language)
          ) : categories.isPending ? (
            <>
              <Skeleton width="10rem" height="1.75rem" />
              <VisuallyHidden>{tCommon('states.loading')}</VisuallyHidden>
            </>
          ) : (
            t('categoryProducts.fallbackTitle')
          )}
        </h1>
      </div>

      <DeliveryChip className={styles.chip} />
      {children.length > 0 && (
        <CategoryChips categories={children} label={t('categoryProducts.subcategories')} />
      )}

      <ProductResults
        list={list}
        hideUnknownAvailability={zoneId === null}
        empty={
          <EmptyState
            icon="package"
            title={t('categoryProducts.emptyTitle')}
            message={t('categoryProducts.emptyMessage')}
            action={
              <ButtonLink to={routePaths.categories}>{t('home.browseCategories')}</ButtonLink>
            }
          />
        }
      />
    </div>
  );
}
