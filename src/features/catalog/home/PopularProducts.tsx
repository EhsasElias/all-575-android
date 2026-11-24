import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonLink, EmptyState } from '@/shared/ui';
import { routePaths } from '@/shared/lib';
import { useLanguage } from '@/shared/i18n';
import { useCategories } from '../api/useCatalogQueries';
import { useProductList } from '../api/useProductList';
import { ProductResults } from '../components/ProductResults';
import { useDeliveryZone } from '../delivery/useDeliveryZone';
import { pickText } from '../lib/localized';
import styles from './HomeSection.module.css';
import { HomeDiscovery } from './HomeDiscovery';

const PAGE_SIZE = 12;
type SortChoice = 'newest' | 'price_asc' | 'price_desc' | 'best_selling';

function isSortChoice(value: string): value is SortChoice {
  return value === 'newest' || value === 'price_asc' || value === 'price_desc' || value === 'best_selling';
}

export function PopularProducts() {
  const { t } = useTranslation('catalog');
  const { language } = useLanguage();
  const ar = language === 'ar';
  const fr = language === 'fr';
  const tr = (arabic: string, english: string, french: string) =>
    ar ? arabic : fr ? french : english;
  const { zoneId } = useDeliveryZone();
  const categories = useCategories();
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<SortChoice>('newest');
  const [inStock, setInStock] = useState(false);
  const list = useProductList({
    zoneId,
    perPage: PAGE_SIZE,
    sort,
    category: category || undefined,
    inStock: inStock && zoneId !== null,
  });

  return (
    <>
      <HomeDiscovery categories={categories.data ?? []} products={list.items} />
      <section aria-labelledby="home-products" className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 id="home-products" className={styles.sectionTitle}>
            {tr('جميع المنتجات', 'All products', 'Tous les produits')}
          </h2>
          <p className={styles.sectionDescription}>
            {tr(
              'تصفح الأحدث أولاً، واكتشف بقية المنتجات أثناء التمرير.',
              'Newest products first. Load more to explore the full catalogue.',
              'Les nouveautés d’abord. Affichez la suite pour explorer tout le catalogue.',
            )}
          </p>
        </div>
      </div>
      <div
        className={styles.homeFilters}
        role="group"
        aria-label={tr('تصفية المنتجات', 'Filter products', 'Filtrer les produits')}
      >
        <label className={styles.homeFilterField}>
          <span>{tr('التصنيف', 'Category', 'Catégorie')}</span>
          <select value={category} onChange={(event) => { setCategory(event.target.value); }}>
            <option value="">
              {tr('جميع التصنيفات', 'All categories', 'Toutes les catégories')}
            </option>
            {(categories.data ?? []).map((item) => (
              <option value={item.slug} key={item.slug}>
                {pickText(item.name, language)}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.homeFilterField}>
          <span>{tr('ترتيب حسب', 'Sort by', 'Trier par')}</span>
          <select value={sort} onChange={(event) => {
              const value = event.target.value;
              if (isSortChoice(value)) setSort(value);
            }}>
            <option value="newest">{tr('الأحدث أولاً', 'Newest first', 'Plus récents')}</option>
            <option value="price_asc">
              {tr('السعر: الأقل أولاً', 'Price: low to high', 'Prix croissant')}
            </option>
            <option value="price_desc">
              {tr('السعر: الأعلى أولاً', 'Price: high to low', 'Prix décroissant')}
            </option>
            <option value="best_selling">
              {tr('الأكثر مبيعاً', 'Best selling', 'Meilleures ventes')}
            </option>
          </select>
        </label>
        <label className={styles.homeCheck}>
          <input
            type="checkbox"
            checked={inStock && zoneId !== null}
            disabled={zoneId === null}
            onChange={(event) => { setInStock(event.target.checked); }}
          />
          <span>{tr('المتوفر فقط', 'In stock only', 'En stock seulement')}</span>
        </label>
        {(category || sort !== 'newest' || inStock) && (
          <button
            type="button"
            className={styles.homeClear}
            onClick={() => {
              setCategory('');
              setSort('newest');
              setInStock(false);
            }}
          >
            {tr('مسح الفلاتر', 'Clear filters', 'Effacer les filtres')}
          </button>
        )}
      </div>
      <ProductResults
        list={list}
        hideUnknownAvailability={zoneId === null}
        empty={
          <EmptyState
            icon="package"
            headingLevel={3}
            title={t('home.emptyTitle')}
            message={t('home.emptyMessage')}
            action={
              <ButtonLink to={routePaths.categories}>{t('home.browseCategories')}</ButtonLink>
            }
          />
        }
      />
      </section>
    </>
  );
}
