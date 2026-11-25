import { Link } from 'react-router';
import { useLanguage } from '@/shared/i18n';
import { routePaths, routeTo } from '@/shared/lib';
import { useCategories } from '../api/useCatalogQueries';
import { pickText } from '../lib/localized';
import styles from './HomeScreen.module.css';

/** Desktop companion navigation; the mobile layout retains its category tiles. */
export function HomeCategorySidebar() {
  const { language } = useLanguage();
  const categories = useCategories();
  const tr = (ar: string, en: string, fr: string) =>
    language === 'ar' ? ar : language === 'fr' ? fr : en;

  return (
    <aside
      className={styles.categorySidebar}
      aria-label={tr('تصفح الأقسام', 'Browse categories', 'Parcourir les catégories')}
    >
      <Link className={styles.sidebarTitle} to={routePaths.categories}>
        <span aria-hidden="true">☰</span>
        {tr('جميع الأقسام', 'All categories', 'Toutes les catégories')}
        <span aria-hidden="true">›</span>
      </Link>
      <ul className={styles.sidebarList}>
        {(categories.data ?? []).slice(0, 10).map((category) => (
          <li key={category.id}>
            <Link to={routeTo.categoryProducts(category.slug)} className={styles.sidebarLink}>
              <span className={styles.sidebarBullet} aria-hidden="true">
                ✦
              </span>
              <span>{pickText(category.name, language)}</span>
              <span className={styles.sidebarChevron} aria-hidden="true">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link className={styles.sidebarAll} to={routePaths.categories}>
        {tr('عرض جميع الأقسام', 'View all categories', 'Toutes les catégories')}
      </Link>
    </aside>
  );
}
