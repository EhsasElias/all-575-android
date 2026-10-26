import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { routePaths } from '@/shared/lib';
import { ErrorState, Skeleton, VisuallyHidden } from '@/shared/ui';
import { useCategories } from '../api/useCatalogQueries';
import { CategoryTile } from '../components/CategoryTile';
import styles from './HomeSection.module.css';

// What fits on a phone screen at first paint; the rest load when scrolled to.
const EAGER_TILES = 5;
const PLACEHOLDERS = [1, 2, 3, 4, 5] as const;

function StripSkeleton() {
  const { t } = useTranslation();

  return (
    <div role="status">
      <VisuallyHidden>{t('states.loading')}</VisuallyHidden>
      <ul className={styles.strip} aria-hidden="true">
        {PLACEHOLDERS.map((placeholder) => (
          <li key={placeholder} className={styles.stripItem}>
            <Skeleton width={88} height={88} />
            <Skeleton width={56} height="1em" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CategoryStrip() {
  const { t } = useTranslation('catalog');
  const categories = useCategories();

  if (categories.data?.length === 0) return null;

  return (
    <section aria-labelledby="home-categories" className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 id="home-categories" className={styles.sectionTitle}>
          {t('home.categoriesTitle')}
        </h2>
        <Link to={routePaths.categories} className={styles.seeAll}>
          {t('home.seeAll')}
        </Link>
      </div>
      {categories.isPending && <StripSkeleton />}
      {categories.isError && (
        <ErrorState
          headingLevel={3}
          onRetry={() => {
            void categories.refetch();
          }}
        />
      )}
      {categories.data && (
        <ul className={styles.strip}>
          {categories.data.map((category, index) => (
            <li key={category.id} className={styles.stripItem}>
              <CategoryTile category={category} eager={index < EAGER_TILES} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
