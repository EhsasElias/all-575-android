import { Link } from 'react-router';
import { formatMoney, useLanguage } from '@/shared/i18n';
import { routePaths, routeTo } from '@/shared/lib';
import type { Category, ProductSummary } from '../api/types';
import { useProductList } from '../api/useProductList';
import { CatalogImage } from '../components/CatalogImage';
import { useDeliveryZone } from '../delivery/useDeliveryZone';
import { pickText } from '../lib/localized';
import styles from './HomeDiscovery.module.css';

type Props = {
  categories: readonly Category[];
  products: readonly ProductSummary[];
};

type LanguageKey = 'ar' | 'en' | 'fr';
type HomeCategory = {
  key: string;
  image: string;
  ar: string;
  en: string;
  fr: string;
  search: string;
  keys: readonly string[];
};

const categoryCards: readonly HomeCategory[] = [
  { key: 'personal', image: '/images/categories/personal-care.webp', ar: 'العناية الشخصية', en: 'Personal care', fr: 'Soins personnels', search: 'shampoo', keys: ['personal care', 'hygiene', 'shampoo', 'شامبو', 'العناية الشخصية'] },
  { key: 'makeup', image: '/images/categories/makeup.webp', ar: 'مستحضرات التجميل', en: 'Makeup', fr: 'Maquillage', search: 'makeup', keys: ['makeup', 'cosmetic', 'مكياج', 'مستحضرات التجميل'] },
  { key: 'perfume', image: '/images/categories/perfumes.webp', ar: 'العطور', en: 'Perfumes', fr: 'Parfums', search: 'perfume', keys: ['perfume', 'fragrance', 'عطور', 'عطر'] },
  { key: 'stationery', image: '/images/categories/stationery.webp', ar: 'الأدوات المكتبية', en: 'Stationery', fr: 'Papeterie', search: 'stationery', keys: ['stationery', 'office supplies', 'مكتبية', 'قرطاسية'] },
  { key: 'school', image: '/images/categories/school-supplies.webp', ar: 'المستلزمات المدرسية', en: 'School supplies', fr: 'Fournitures scolaires', search: 'school', keys: ['school supplies', 'school', 'مدرسية', 'لوازم مدرسية'] },
  { key: 'detergents', image: '/images/categories/cleaning-products.webp', ar: 'المنظفات', en: 'Cleaning products', fr: 'Produits nettoyants', search: 'cleaning', keys: ['cleaning products', 'detergent', 'منظفات', 'مواد تنظيف'] },
  { key: 'tools', image: '/images/categories/cleaning-tools.webp', ar: 'أدوات التنظيف', en: 'Cleaning tools', fr: 'Matériel de nettoyage', search: 'cleaning tools', keys: ['cleaning tools', 'أدوات تنظيف', 'مماسح', 'مكانس'] },
  { key: 'kitchen', image: '/images/categories/kitchenware.webp', ar: 'أدوات المطبخ', en: 'Kitchenware', fr: 'Ustensiles de cuisine', search: 'kitchen', keys: ['kitchen', 'cookware', 'مطبخ', 'أواني'] },
  { key: 'groceries', image: '/images/categories/groceries-fresh.webp', ar: 'الخضار والفواكه', en: 'Groceries & fresh produce', fr: 'Fruits et légumes', search: 'vegetables', keys: ['grocery', 'vegetable', 'fruit', 'produce', 'خضار', 'فواكه', 'بقالة'] },
];

const categorySlugs: Readonly<Record<string, string>> = {
  personal: 'personal-care',
  makeup: 'makeup',
  perfume: 'perfumes',
  stationery: 'stationery',
  school: 'school-supplies',
  detergents: 'cleaning-products',
  tools: 'cleaning-tools',
  kitchen: 'kitchenware',
  groceries: 'groceries-fresh',
};

function matchCategory(categories: readonly Category[], item: HomeCategory) {
  const exactSlug = categorySlugs[item.key];
  const exact = categories.find((category) => category.slug === exactSlug);
  if (exact) return exact;
  return categories.find((category) => {
    const values = [category.slug, category.name.ar, category.name.en].filter(Boolean).join(' ').toLowerCase();
    return item.keys.some((key) => values.includes(key));
  });
}

function target(category: Category | undefined, search: string) {
  return category
    ? routeTo.categoryProducts(category.slug)
    : `${routePaths.search}?q=${encodeURIComponent(search)}`;
}

function label(item: HomeCategory, language: LanguageKey) {
  return item[language];
}

function CategoryPhoto({ item, eager = false }: { item: HomeCategory; eager?: boolean }) {
  return (
    <img
      className={styles.categoryPhoto}
      src={item.image}
      alt=""
      width={160}
      height={160}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
}

function GroceryProducts({ category }: { category: Category | undefined }) {
  const { zoneId } = useDeliveryZone();
  const { language } = useLanguage();
  // Request only products classified in the chosen real grocery category.
  // Never substitute an unrelated catalogue product if the category does not exist.
  const list = useProductList(
    { zoneId, category: category?.slug, perPage: 6, sort: 'newest' },
    category !== undefined,
  );
  if (!category || list.items.length === 0) return null;

  return (
    <ul className={styles.productRail}>
      {list.items.map((product) => (
        <li key={product.id}>
          <Link className={styles.productCard} to={routeTo.product(product.slug)}>
            <span className={styles.productImage}>
              <CatalogImage src={product.image_url} alt="" size={160} />
            </span>
            <span className={styles.productName}>{pickText(product.name, language)}</span>
            <span className={styles.productPrice}>{formatMoney(product.price.net, language)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Four mobile-first shelves, driven only by actual category and product records. */
export function HomeDiscovery({ categories, products }: Props) {
  const { language } = useLanguage();
  const tr = (ar: string, en: string, fr: string) => language === 'ar' ? ar : language === 'fr' ? fr : en;
  const featured = categoryCards.map((item) => ({
    item,
    category: matchCategory(categories, item),
  }));
  const grocery = featured.find((item) => item.item.key === 'groceries');
  const groceryOptions = categories.filter((category) => {
    const values = [category.slug, category.name.ar, category.name.en].join(' ').toLowerCase();
    return ['vegetable', 'fruit', 'grocery', 'produce', 'خضار', 'فواكه', 'بقالة'].some((key) => values.includes(key));
  }).slice(0, 4);
  const dailyCards = featured.filter(({ item }) => ['personal', 'makeup', 'perfume', 'detergents'].includes(item.key));

  return (
    <div className={styles.discovery}>
      <section className={styles.section} aria-labelledby="home-discover-categories">
        <h2 id="home-discover-categories">{tr('ماذا تريد أن تتسوق؟', 'What would you like to order?', 'Que souhaitez-vous commander ?')}</h2>
        <div className={styles.categoryGrid}>
          {featured.map(({ item, category }, index) => (
            <Link
              key={item.key}
              className={styles.categoryCard}
              to={target(category, item.search)}
              aria-label={tr('تصفح ', 'Explore ', 'Explorer ') + label(item, language)}
            >
              <span className={styles.categoryImage}><CategoryPhoto item={item} eager={index < 4} /></span>
              <span className={styles.categoryName}>{label(item, language)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="home-daily-offers">
        <h2 id="home-daily-offers">{tr('عروض اليوم', 'Daily offers', 'Offres du jour')}</h2>
        <div className={styles.offerRail}>
          {dailyCards.map(({ item, category }) => (
            <Link key={item.key} className={styles.offerCard} to={target(category, item.search)}>
              <CategoryPhoto item={item} />
              <strong>{label(item, language)}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="home-grocery">
        <div className={styles.headingRow}>
          <h2 id="home-grocery">{tr('البقالة والخضار والفواكه', 'Grocery & fresh', 'Épicerie et produits frais')}</h2>
          <Link className={styles.more} to={target(grocery?.category, 'vegetables')}>
            {tr('تصفح', 'Explore', 'Explorer')} <span aria-hidden="true">›</span>
          </Link>
        </div>
        {groceryOptions.length > 0 ? (
          <div className={styles.groceryGrid}>
            {groceryOptions.map((category) => (
              <Link key={category.id} className={styles.groceryCard} to={routeTo.categoryProducts(category.slug)}>
                <span className={styles.groceryImage}>
                  <CatalogImage src={category.image_url} alt="" size={140} />
                </span>
                <span>{pickText(category.name, language)}</span>
              </Link>
            ))}
          </div>
        ) : (
          <Link className={styles.groceryCard} to={target(grocery?.category, 'vegetables')}>
            {grocery && <span className={styles.groceryImage}><CategoryPhoto item={grocery.item} /></span>}
            <span>{tr('الخضار والفواكه', 'Fruits & vegetables', 'Fruits et légumes')}</span>
          </Link>
        )}
        <GroceryProducts category={grocery?.category} />
      </section>

      <section className={styles.section} aria-labelledby="home-picked-for-you">
        <div className={styles.headingRow}>
          <h2 id="home-picked-for-you">{tr('اخترنا لك', 'Picked For You', 'Sélection pour vous')}</h2>
          <Link to={routePaths.search} className={styles.more}>
            {tr('المزيد', 'More', 'Plus')} <span aria-hidden="true">›</span>
          </Link>
        </div>
        {products.length > 0 ? (
          <ul className={styles.productRail}>
            {products.slice(0, 8).map((product) => (
              <li key={product.id}>
                <Link className={styles.productCard} to={routeTo.product(product.slug)}>
                  <span className={styles.productImage}>
                    <CatalogImage src={product.image_url} alt="" size={180} />
                  </span>
                  <span className={styles.productName}>{pickText(product.name, language)}</span>
                  <span className={styles.productPrice}>{formatMoney(product.price.net, language)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.helper}>{tr('تصفح التصنيفات لاكتشاف المنتجات المتاحة.', 'Explore categories to find available products.', 'Parcourez les catégories pour découvrir les produits.')}</p>
        )}
      </section>
    </div>
  );
}
