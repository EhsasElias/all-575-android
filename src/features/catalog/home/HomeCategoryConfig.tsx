import { routePaths, routeTo } from '@/shared/lib';
import type { Category } from '../api/types';
import { CatalogImage } from '../components/CatalogImage';
import styles from './HomeDiscovery.module.css';

export type LanguageKey = 'ar' | 'en' | 'fr';
export type HomeCategory = {
  key: string;
  ar: string;
  en: string;
  fr: string;
  search: string;
  keys: readonly string[];
};

export const categoryCards: readonly HomeCategory[] = [
  {
    key: 'personal',
    ar: 'العناية الشخصية',
    en: 'Personal care',
    fr: 'Soins personnels',
    search: 'shampoo',
    keys: ['personal care', 'hygiene', 'shampoo', 'شامبو', 'العناية الشخصية'],
  },
  {
    key: 'makeup',
    ar: 'مستحضرات التجميل',
    en: 'Makeup',
    fr: 'Maquillage',
    search: 'makeup',
    keys: ['makeup', 'cosmetic', 'مكياج', 'مستحضرات التجميل'],
  },
  {
    key: 'perfume',
    ar: 'العطور',
    en: 'Perfumes',
    fr: 'Parfums',
    search: 'perfume',
    keys: ['perfume', 'fragrance', 'عطور', 'عطر'],
  },
  {
    key: 'stationery',
    ar: 'الأدوات المكتبية',
    en: 'Stationery',
    fr: 'Papeterie',
    search: 'stationery',
    keys: ['stationery', 'office supplies', 'مكتبية', 'قرطاسية'],
  },
  {
    key: 'school',
    ar: 'المستلزمات المدرسية',
    en: 'School supplies',
    fr: 'Fournitures scolaires',
    search: 'school',
    keys: ['school supplies', 'school', 'مدرسية', 'لوازم مدرسية'],
  },
  {
    key: 'detergents',
    ar: 'المنظفات',
    en: 'Cleaning products',
    fr: 'Produits nettoyants',
    search: 'cleaning',
    keys: ['cleaning products', 'detergent', 'منظفات', 'مواد تنظيف'],
  },
  {
    key: 'tools',
    ar: 'أدوات التنظيف',
    en: 'Cleaning tools',
    fr: 'Matériel de nettoyage',
    search: 'cleaning tools',
    keys: ['cleaning tools', 'أدوات تنظيف', 'مماسح', 'مكانس'],
  },
  {
    key: 'kitchen',
    ar: 'أدوات المطبخ',
    en: 'Kitchenware',
    fr: 'Ustensiles de cuisine',
    search: 'kitchen',
    keys: ['kitchen', 'cookware', 'مطبخ', 'أواني'],
  },
  {
    key: 'groceries',
    ar: 'الخضار والفواكه',
    en: 'Groceries & fresh produce',
    fr: 'Fruits et légumes',
    search: 'vegetables',
    keys: ['grocery', 'vegetable', 'fruit', 'produce', 'خضار', 'فواكه', 'بقالة'],
  },
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

export function matchCategory(categories: readonly Category[], item: HomeCategory) {
  const exactSlug = categorySlugs[item.key];
  const exact = categories.find((category) => category.slug === exactSlug);
  if (exact) return exact;
  return categories.find((category) => {
    const values = [category.slug, category.name.ar, category.name.en]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return item.keys.some((key) => values.includes(key));
  });
}

export function target(category: Category | undefined, search: string) {
  return category
    ? routeTo.categoryProducts(category.slug)
    : `${routePaths.search}?q=${encodeURIComponent(search)}`;
}

export function label(item: HomeCategory, language: LanguageKey) {
  return item[language];
}

export function CategoryPhoto({ category, eager = false }: { category: Category | undefined; eager?: boolean }) {
  // Render actual category photos, not paths to assets absent from this repository.
  return (
    <CatalogImage
      className={styles.categoryPhoto}
      src={category?.image_url ?? null}
      alt=""
      size={160}
      eager={eager}
    />
  );
}

