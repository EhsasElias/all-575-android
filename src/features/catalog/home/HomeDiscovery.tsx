import { Link } from 'react-router';
import { formatMoney, useLanguage } from '@/shared/i18n';
import { routePaths, routeTo } from '@/shared/lib';
import type { Category, ProductSummary } from '../api/types';
import { CatalogImage } from '../components/CatalogImage';
import { pickText } from '../lib/localized';
import styles from './HomeDiscovery.module.css';

type Props = {
  categories: readonly Category[];
  products: readonly ProductSummary[];
};

const MAX_CATEGORIES = 4;
const MAX_HIGHLIGHTS = 6;

/** Editorial shelves using only actual catalogue records: no invented offers or delivery promises. */
export function HomeDiscovery({ categories, products }: Props) {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const fr = language === 'fr';
  const tr = (arabic: string, english: string, french: string) =>
    ar ? arabic : fr ? french : english;
  const highlights = products.slice(0, MAX_HIGHLIGHTS);
  const shortcuts = categories.slice(0, MAX_CATEGORIES);

  if (shortcuts.length === 0 && highlights.length === 0) return null;

  return (
    <div className={styles.discovery}>
      {shortcuts.length > 0 && (
        <section className={styles.section} aria-labelledby="home-discover-categories">
          <div className={styles.headingRow}>
            <div>
              <p className={styles.eyebrow}>{tr('تسوّق بسهولة', 'SHOP YOUR WAY', 'ACHETEZ À VOTRE FAÇON')}</p>
              <h2 id="home-discover-categories">
                {tr('ماذا تريد أن تتسوق؟', 'What would you like to shop?', 'Que souhaitez-vous acheter ?')}
              </h2>
            </div>
            <Link to={routePaths.categories} className={styles.more}>
              {tr('كل التصنيفات', 'All categories', 'Toutes les catégories')}
              <span aria-hidden="true">‹</span>
            </Link>
          </div>
          <div className={styles.categoryGrid}>
            {shortcuts.map((category, index) => (
              <Link
                to={routeTo.categoryProducts(category.slug)}
                className={styles.categoryCard}
                key={category.id}
                aria-label={tr('استكشف ', 'Explore ', 'Explorer ') + pickText(category.name, language)}
              >
                <span className={styles.categoryImage}>
                  <CatalogImage src={category.image_url} alt="" size={144} eager={index < 2} />
                </span>
                <span className={styles.categoryName}>{pickText(category.name, language)}</span>
                <span className={styles.categoryArrow} aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {highlights.length > 0 && (
        <section className={styles.section} aria-labelledby="home-daily-picks">
          <div className={styles.headingRow}>
            <div>
              <p className={styles.eyebrow}>{tr('من كتالوج المتجر', 'FROM THE CATALOGUE', 'DU CATALOGUE')}</p>
              <h2 id="home-daily-picks">
                {tr('اختيارات اليوم', "Today's picks", 'Sélection du jour')}
              </h2>
              <p className={styles.helper}>
                {tr('منتجات متاحة للاستكشاف الآن', 'Explore products in the store today', "Découvrez les produits de la boutique aujourd'hui")}
              </p>
            </div>
            <Link to={routePaths.search} className={styles.more}>
              {tr('عرض المزيد', 'See more', 'Voir plus')}
              <span aria-hidden="true">‹</span>
            </Link>
          </div>
          <ul className={styles.productRail}>
            {highlights.map((product) => (
              <li key={product.id}>
                <Link
                  className={styles.productCard}
                  to={routeTo.product(product.slug)}
                  aria-label={tr('استكشف المنتج: ', 'Explore product: ', 'Voir le produit : ') + pickText(product.name, language)}
                >
                  <span className={styles.productImage}>
                    <CatalogImage src={product.image_url} alt="" size={180} />
                  </span>
                  <span className={styles.productName}>{pickText(product.name, language)}</span>
                  <span className={styles.productPrice}>{formatMoney(product.price.net, language)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className={styles.cta}>
        <div>
          <p className={styles.eyebrow}>{tr('تجربة تسوق أسهل', 'EXPLORE MORE', 'DÉCOUVREZ PLUS')}</p>
          <strong>{tr('كل ما تحتاجه في مكان واحد', 'Everyday essentials, all in one place', 'Vos essentiels au même endroit')}</strong>
          <p>{tr('تصفح المنتجات والتصنيفات واكتشف ما يناسبك.', 'Browse real products and find what works for you.', 'Parcourez les produits et trouvez ce qui vous convient.')}</p>
        </div>
        <Link to={routePaths.categories} className={styles.ctaLink}>
          {tr('تصفح التصنيفات', 'Browse categories', 'Voir les catégories')}
        </Link>
      </div>
    </div>
  );
}
