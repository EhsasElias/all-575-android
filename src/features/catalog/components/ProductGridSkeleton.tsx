import { useTranslation } from 'react-i18next';
import { Skeleton, VisuallyHidden } from '@/shared/ui';
import styles from './ProductGridSkeleton.module.css';

const PLACEHOLDERS = [1, 2, 3, 4, 5, 6] as const;

/** The shape of a product grid while it loads, so the page does not jump when the products arrive. */
export function ProductGridSkeleton() {
  const { t } = useTranslation();

  return (
    <div role="status">
      <VisuallyHidden>{t('states.loading')}</VisuallyHidden>
      <ul className={styles.grid} aria-hidden="true">
        {PLACEHOLDERS.map((placeholder) => (
          <li key={placeholder} className={styles.card}>
            <div className={styles.image}>
              <Skeleton height="100%" />
            </div>
            <Skeleton height="1.2em" />
            <Skeleton width="60%" height="1em" />
            <Skeleton width="40%" height="1.2em" />
          </li>
        ))}
      </ul>
    </div>
  );
}
