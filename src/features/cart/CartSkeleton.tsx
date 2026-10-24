import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/shared/ui';
import styles from './CartSkeleton.module.css';

const PLACEHOLDER_LINES = ['first', 'second', 'third'] as const;

/** Stands in for the cart lines while they load. */
export function CartSkeleton() {
  const { t } = useTranslation();

  return (
    <div role="status" aria-busy="true" aria-label={t('states.loading')} className={styles.list}>
      {PLACEHOLDER_LINES.map((id) => (
        <div key={id} className={styles.line}>
          <Skeleton width={72} height={72} />
          <div className={styles.text}>
            <Skeleton width="60%" height="1.25rem" />
            <Skeleton width="35%" height="1rem" />
            <Skeleton width="45%" height="2.75rem" />
          </div>
        </div>
      ))}
    </div>
  );
}
