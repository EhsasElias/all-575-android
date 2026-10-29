import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useState } from 'react';
import { useLanguage } from '@/shared/i18n';
import { routePaths, routeTo } from '@/shared/lib';
import {
  Button,
  ButtonLink,
  EmptyState,
  ErrorState,
  Skeleton,
  TextField,
  VisuallyHidden,
} from '@/shared/ui';
import { useCategories } from '../api/useCatalogQueries';
import { CatalogImage } from '../components/CatalogImage';
import { CategoryChips } from '../components/CategoryChips';
import { ProductResults } from '../components/ProductResults';
import { useProductList } from '../api/useProductList';
import { useDeliveryZone } from '../delivery/useDeliveryZone';
import { DeliveryChip } from '../delivery/DeliveryChip';
import { ProductFilters, useCatalogFilters } from '../search/ProductFilters';
import { pickText } from '../lib/localized';
import styles from './CategoriesScreen.module.css';

const CARD_IMAGE_SIZE = 112;
const EAGER_CARDS = 6;
const PLACEHOLDERS = [1, 2, 3, 4, 5, 6] as const;

const normalizeName = (text: string) =>
  text.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase().trim();

function CategoriesSkeleton() {
  const { t } = useTranslation();

  return (
    <div role="status">
      <VisuallyHidden>{t('states.loading')}</VisuallyHidden>
      <ul className={styles.grid} aria-hidden="true">
        {PLACEHOLDERS.map((placeholder) => (
          <li key={placeholder} className={styles.skeletonCard}>
            <Skeleton width="100%" height={CARD_IMAGE_SIZE} />
            <Skeleton width="60%" height="1em" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Every category, with its sub-categories one tap away. */
export function CategoriesScreen() {
  const { t } = useTranslation('catalog');
  const { t: tCommon } = useTranslation();
  const { language } = useLanguage();
  const categories = useCategories();
  const [nameQuery, setNameQuery] = useState('');
  const { zoneId } = useDeliveryZone();
  const filters = useCatalogFilters();
  const filteringProducts = Object.values(filters).some(Boolean);
  const products = useProductList({ ...filters, zoneId }, filteringProducts);
  const matches = categories.data?.filter((category) =>
    [category, ...(category.children ?? [])].some((entry) =>
      [entry.name.ar, entry.name.en].some((name) =>
        normalizeName(name).includes(normalizeName(nameQuery)),
      ),
    ),
  );

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>{t('categories.title')}</h1>

      <DeliveryChip />
      <ProductFilters zoneId={zoneId} />
      {filteringProducts ? (
        <ProductResults
          list={products}
          hideUnknownAvailability={zoneId === null}
          empty={
            <EmptyState
              icon="package"
              title={t('categoryProducts.emptyTitle')}
              message={t('categoryProducts.emptyMessage')}
            />
          }
        />
      ) : (
        <>
          <TextField
            type="search"
            label={t('filters.categorySearch')}
            value={nameQuery}
            onChange={(event) => {
              setNameQuery(event.target.value);
            }}
          />

          {categories.isPending && <CategoriesSkeleton />}
          {categories.isError && (
            <ErrorState
              onRetry={() => {
                void categories.refetch();
              }}
            />
          )}
          {categories.data?.length === 0 && (
            <EmptyState
              icon="grid"
              title={t('categories.emptyTitle')}
              message={t('categories.emptyMessage')}
              action={<ButtonLink to={routePaths.home}>{tCommon('actions.backToHome')}</ButtonLink>}
            />
          )}
          {categories.data && categories.data.length > 0 && matches?.length === 0 && (
            <EmptyState
              icon="search"
              title={t('filters.noCategoryMatch')}
              message={t('filters.categorySearch')}
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setNameQuery('');
                  }}
                >
                  {t('filters.clearCategorySearch')}
                </Button>
              }
            />
          )}
          {matches && matches.length > 0 && (
            <ul className={styles.grid}>
              {matches.map((category, index) => {
                const name = pickText(category.name, language);
                const children = category.children ?? [];
                return (
                  <li key={category.id} className={styles.card}>
                    <Link to={routeTo.categoryProducts(category.slug)} className={styles.main}>
                      <CatalogImage
                        src={category.image_url}
                        alt=""
                        size={CARD_IMAGE_SIZE}
                        eager={index < EAGER_CARDS}
                        className={styles.image}
                      />
                      <span className={styles.name}>{name}</span>
                    </Link>
                    {children.length > 0 && (
                      <CategoryChips
                        categories={children}
                        label={t('categories.subcategories', { name })}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
