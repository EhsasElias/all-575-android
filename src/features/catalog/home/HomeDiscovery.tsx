import { useEffect, useState } from 'react';
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

const CATEGORY_ATLAS = '/images/categories/home-category-atlas.webp';

// Photo order matches the user-supplied 3x3 category atlas.
const featuredCategories = [
  { key: 'personal', ar: 'العناية الشخصية', en: 'Personal care', fr: 'Soins personnels', search: 'shampoo', keys: ['personal care', 'hygiene', 'shampoo', 'شامبو', 'العناية الشخصية'] },
  { key: 'makeup', ar: 'مستحضرات التجميل', en: 'Makeup', fr: 'Maquillage', search: 'makeup', keys: ['makeup', 'cosmetic', 'مكياج', 'مستحضرات التجميل'] },
  { key: 'perfume', ar: 'العطور', en: 'Perfumes', fr: 'Parfums', search: 'perfume', keys: ['perfume', 'fragrance', 'عطور', 'عطر'] },
  { key: 'stationery', ar: 'الأدوات المكتبية', en: 'Stationery', fr: 'Papeterie', search: 'stationery', keys: ['stationery', 'office supplies', 'مكتبية', 'قرطاسية'] },
  { key: 'school', ar: 'المستلزمات المدرسية', en: 'School supplies', fr: 'Fournitures scolaires', search: 'school', keys: ['school supplies', 'school', 'مدرسية', 'لوازم مدرسية'] },
  { key: 'detergents', ar: 'المنظفات', en: 'Cleaning products', fr: 'Produits nettoyants', search: 'cleaning', keys: ['cleaning products', 'detergent', 'منظفات', 'مواد تنظيف'] },
  { key: 'tools', ar: 'أدوات التنظيف', en: 'Cleaning tools', fr: 'Matériel de nettoyage', search: 'cleaning tools', keys: ['cleaning tools', 'أدوات تنظيف', 'مماسح', 'مكانس'] },
  { key: 'kitchen', ar: 'أدوات المطبخ', en: 'Kitchenware', fr: 'Ustensiles de cuisine', search: 'kitchen', keys: ['kitchen', 'cookware', 'مطبخ', 'أواني'] },
  { key: 'groceries', ar: 'الخضار والفواكه', en: 'Groceries & fresh produce', fr: 'Fruits et légumes', search: 'vegetables', keys: ['grocery', 'vegetable', 'fruit', 'produce', 'خضار', 'فواكه', 'بقالة'] },
] as const;

function matchCategory(categories: readonly Category[], keys: readonly string[]) {
  return categories.find((category) => {
    const values = [category.slug, category.name.ar, category.name.en].filter(Boolean).join(' ').toLowerCase();
    return keys.some((key) => values.includes(key));
  });
}

const MAX_HIGHLIGHTS = 6;

/** Editorial shelves using only actual catalogue records: no invented offers or delivery promises. */
export function HomeDiscovery({ categories, products }: Props) {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const fr = language === 'fr';
  const tr = (arabic: string, english: string, french: string) =>
    ar ? arabic : fr ? french : english;
  const highlights = products.slice(0, MAX_HIGHLIGHTS);
  const [atlasLoaded, setAtlasLoaded] = useState(false);

  useEffect(() => {
    const image = new Image();
    image.onload = () => setAtlasLoaded(true);
    image.onerror = () => setAtlasLoaded(false);
    image.src = CATEGORY_ATLAS;
    return () => { image.onload = null; image.onerror = null; };
  }, []);

  return (
    <div className={styles.discovery}>
      {featuredCategories.length > 0 && (
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
            {featuredCategories.map((item, index) => {
              const category = matchCategory(categories, item.keys);
              const label = ar ? item.ar : fr ? item.fr : item.en;
              const destination = category
                ? routeTo.categoryProducts(category.slug)
                : `${routePaths.search}?q=${encodeURIComponent(item.search)}`;
              return (
                <Link
                  to={destination}
                  className={styles.categoryCard}
                  key={item.key}
                  aria-label={tr('استكشف ', 'Explore ', 'Explorer ') + label}
                >
                  <span className={styles.categoryImage}>
                    {category && <CatalogImage src={category.image_url} alt="" size={144} eager={index < 2} />}
                    {atlasLoaded && (
                      <span
                        className={styles.categoryPhoto}
                        aria-hidden="true"
                        style={{
                          backgroundImage: `url(${CATEGORY_ATLAS})`,
                          backgroundPosition: `${(index % 3) * 50}% ${Math.floor(index / 3) * 50}%`,
                        }}
                      />
                    )}
                  </span>
                  <span className={styles.categoryName}>{label}</span>
                  <span className={styles.categoryArrow} aria-hidden="true">↗</span>
                </Link>
              );
            })}
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
