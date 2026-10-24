import { Link } from 'react-router';
import { useLanguage } from '@/shared/i18n';
import { routeTo } from '@/shared/lib';
import type { Category } from '../api/types';
import { pickText } from '../lib/localized';
import styles from './CategoryChips.module.css';

type CategoryChipsProps = {
  categories: readonly Category[];
  /** Names the list for screen readers, since it has no visible heading of its own. */
  label: string;
};

/** A wrapping row of links to categories, for sub-categories and "try browsing" suggestions. */
export function CategoryChips({ categories, label }: CategoryChipsProps) {
  const { language } = useLanguage();

  return (
    <ul className={styles.chips} aria-label={label}>
      {categories.map((category) => (
        <li key={category.id}>
          <Link to={routeTo.categoryProducts(category.slug)} className={styles.chip}>
            {pickText(category.name, language)}
          </Link>
        </li>
      ))}
    </ul>
  );
}
