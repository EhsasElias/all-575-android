import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/shared/ui';
import styles from './SpendingSkeleton.module.css';

export function SpendingSkeleton() {
  const { t } = useTranslation();

  return (
    <div role="status" aria-busy="true" aria-label={t('states.loading')} className={styles.page}>
      <Skeleton height="6rem" />
      <div className={styles.tiles}>
        <Skeleton height="4.5rem" />
        <Skeleton height="4.5rem" />
        <Skeleton height="4.5rem" />
      </div>
      <Skeleton height="9rem" />
    </div>
  );
}
