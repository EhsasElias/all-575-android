import { Link } from 'react-router';
import { useLanguage } from '@/shared/i18n';
import { routePaths, routeTo } from '@/shared/lib';
import type { Category, ProductSummary } from '../api/types';
import { useProductList } from '../api/useProductList';
import { CatalogImage } from '../components/CatalogImage';
import { HomeProductTile } from './HomeProductTile';
import { useDeliveryZone } from '../delivery/useDeliveryZone';
import { pickText } from '../lib/localized';
import { CategoryPhoto, categoryCards, label, matchCategory, target } from './HomeCategoryConfig';
import styles from './HomeDiscovery.module.css';

type Props = {
  categories: readonly Category[];
  products: readonly ProductSummary[];
};

function GroceryProducts({ category }: { category: Category | undefined }) {
  const { zoneId } = useDeliveryZone();
  // Request only products classified in the chosen real grocery category.
  // Never substitute an unrelated catalogue product if the category does not exist.
  const list = useProductList(
    { zoneId, inStock: true, category: category?.slug, perPage: 6, sort: 'newest' },
    category !== undefined,
  );
  if (!category || list.items.length === 0) return null;

  return (
    <ul className={styles.productRail}>
      {list.items.map((product) => (
        <li key={product.id}>
          <HomeProductTile product={product} />
        </li>
      ))}
    </ul>
  );
}

/** Four mobile-first shelves, driven only by actual category and product records. */
export function HomeDiscovery({ categories, products }: Props) {
  const { language } = useLanguage();
  const tr = (ar: string, en: string, fr: string) =>
    language === 'ar' ? ar : language === 'fr' ? fr : en;
  const featured = categoryCards.map((item) => ({
    item,
    category: matchCategory(categories, item),
  }));
  const grocery = featured.find((item) => item.item.key === 'groceries');
  const groceryOptions = categories
    .filter((category) => {
      const values = [category.slug, category.name.ar, category.name.en].join(' ').toLowerCase();
      return ['vegetable', 'fruit', 'grocery', 'produce', 'خضار', 'فواكه', 'بقالة'].some((key) =>
        values.includes(key),
      );
    })
    .slice(0, 4);
  const dailyCards = featured.filter(({ item }) =>
    ['personal', 'makeup', 'perfume', 'detergents', 'kitchen'].includes(item.key),
  );

  return (
    <div className={styles.discovery}>
      <section className={styles.section} aria-labelledby="home-discover-categories">
        <div className={styles.headingRow}>
          <div className={styles.sectionHeading}>
            <span className={styles.kicker}>
              {tr('تسوّق حسب احتياجك', 'EXPLORE CATEGORIES', 'EXPLORER LES CATÉGORIES')}
            </span>
            <h2 id="home-discover-categories">
              {tr(
                'ماذا تحب أن تتسوق اليوم؟',
                'What would you like to shop today?',
                'Que souhaitez-vous acheter aujourd’hui ?',
              )}
            </h2>
          </div>
          <Link className={styles.more} to={routePaths.categories}>
            {tr('جميع الأقسام', 'All categories', 'Toutes les catégories')}
            <span aria-hidden="true">›</span>
          </Link>
        </div>
        <div className={styles.categoryGrid}>
          {featured.map(({ item, category }, index) => (
            <Link
              key={item.key}
              className={styles.categoryCard}
              to={target(category, item.search)}
              aria-label={tr('تصفح ', 'Explore ', 'Explorer ') + label(item, language)}
            >
              <span className={styles.categoryImage}>
                <CategoryPhoto category={category} eager={index < 4} />
              </span>
              <span className={styles.categoryName}>{label(item, language)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="home-daily-offers">
        <div className={styles.headingRow}>
          <div className={styles.sectionHeading}>
            <span className={styles.kicker}>
              {tr('مختارات تستحق الاكتشاف', 'FEATURED COLLECTIONS', 'SÉLECTIONS DU JOUR')}
            </span>
            <h2 id="home-daily-offers">
              {tr('اكتشف مجموعاتنا', 'Explore our collections', 'Découvrez nos collections')}
            </h2>
          </div>
          <Link to={routePaths.search} className={styles.more}>
            {tr('تصفح المنتجات', 'Browse products', 'Voir les produits')}{' '}
            <span aria-hidden="true">›</span>
          </Link>
        </div>
        <div className={styles.offerRail}>
          {dailyCards.map(({ item, category }) => (
            <Link key={item.key} className={styles.offerCard} to={target(category, item.search)}>
              <span className={styles.offerCardVisual}>
                <span className={styles.offerEyebrow}>
                  {tr('تسوّق الآن', 'SHOP THE COLLECTION', 'DÉCOUVRIR')}
                </span>
                <strong className={styles.offerTitle}>{label(item, language)}</strong>
                <span className={styles.offerPhoto}>
                  <CategoryPhoto category={category} />
                </span>
                <span className={styles.offerExplore} aria-hidden="true">
                  ↗
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="home-grocery">
        <Link className={styles.groceryPromo} to={target(grocery?.category, 'vegetables')}>
          <span className={styles.groceryPromoIcon} aria-hidden="true">
            {grocery && <CategoryPhoto category={grocery.category} />}
          </span>
          <span className={styles.groceryPromoText}>
            <strong>
              {tr(
                'بقالتك اليومية، واختيارات طازجة',
                'Your grocery essentials, freshly picked',
                'Vos essentiels du quotidien, fraîchement choisis',
              )}
            </strong>
            <small>
              {tr(
                'تسوق الخضار والفواكه ومستلزمات المنزل',
                'Browse fruit, vegetables and household essentials',
                'Découvrez fruits, légumes et essentiels de maison',
              )}
            </small>
          </span>
          <span className={styles.groceryPromoArrow} aria-hidden="true">
            →
          </span>
        </Link>
        <div className={styles.headingRow}>
          <h2 id="home-grocery">
            {tr('البقالة والخضار والفواكه', 'Grocery & fresh', 'Épicerie et produits frais')}
          </h2>
          <Link className={styles.more} to={target(grocery?.category, 'vegetables')}>
            {tr('تصفح', 'Explore', 'Explorer')} <span aria-hidden="true">›</span>
          </Link>
        </div>
        {groceryOptions.length > 0 ? (
          <div className={styles.groceryGrid}>
            {groceryOptions.map((category) => (
              <Link
                key={category.id}
                className={styles.groceryCard}
                to={routeTo.categoryProducts(category.slug)}
              >
                <span className={styles.groceryImage}>
                  <CatalogImage src={category.image_url} alt="" size={140} />
                </span>
                <span>{pickText(category.name, language)}</span>
              </Link>
            ))}
          </div>
        ) : (
          <Link className={styles.groceryCard} to={target(grocery?.category, 'vegetables')}>
            {grocery && (
              <span className={styles.groceryImage}>
                <CategoryPhoto category={grocery.category} />
              </span>
            )}
            <span>{tr('الخضار والفواكه', 'Fruits & vegetables', 'Fruits et légumes')}</span>
          </Link>
        )}
        <GroceryProducts category={grocery?.category} />
      </section>

      <section className={styles.section} aria-labelledby="home-picked-for-you">
        <div className={styles.pickedIntro}>
          <span className={styles.pickedIcon} aria-hidden="true">
            ✦
          </span>
          <span>
            {tr(
              'مقترحات من المنتجات المتوفرة',
              'Discover more available products',
              'Découvrez davantage de produits disponibles',
            )}
          </span>
        </div>
        <div className={styles.headingRow}>
          <h2 id="home-picked-for-you">
            {tr('اخترنا لك', 'Picked For You', 'Sélection pour vous')}
          </h2>
          <Link to={routePaths.search} className={styles.more}>
            {tr('المزيد', 'More', 'Plus')} <span aria-hidden="true">›</span>
          </Link>
        </div>
        {products.length > 0 ? (
          <ul className={styles.productRail}>
            {products.slice(0, 8).map((product) => (
              <li key={product.id}>
                <HomeProductTile product={product} />
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.helper}>
            {tr(
              'تصفح التصنيفات لاكتشاف المنتجات المتاحة.',
              'Explore categories to find available products.',
              'Parcourez les catégories pour découvrir les produits.',
            )}
          </p>
        )}
      </section>
    </div>
  );
}
