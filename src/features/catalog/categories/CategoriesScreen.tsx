import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useLanguage } from '@/shared/i18n';
import { routePaths, routeTo } from '@/shared/lib';
import { ButtonLink, EmptyState, ErrorState, Skeleton, VisuallyHidden } from '@/shared/ui';
import { useCategories } from '../api/useCatalogQueries';
import { CatalogImage } from '../components/CatalogImage';
import { CategoryChips } from '../components/CategoryChips';
import { pickText } from '../lib/localized';
import styles from './CategoriesScreen.module.css';

const CARD_IMAGE_SIZE = 112;
const EAGER_CARDS = 6;
const PLACEHOLDERS = [1, 2, 3, 4, 5, 6] as const;

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

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>{t('categories.title')}</h1>

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
      {categories.data && categories.data.length > 0 && (
        <ul className={styles.grid}>
          {categories.data.map((category, index) => {
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
    </div>
  );
}
